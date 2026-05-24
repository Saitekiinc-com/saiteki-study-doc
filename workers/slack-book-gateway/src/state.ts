import type { BookReportMetadata, RequestStatus } from "./format";
import type { SlackBlock, SlackCommand, SlackInteractionPayload, SlackView } from "./types";
import { compactBookUrl, escapeSlack, safeJsonParse, truncate } from "./utils";

export type StateReference = {
  kind: "book-request-state";
  requestId: string;
  version: number;
};

export type StateActionValue = StateReference | BookReportMetadata;

export const STATUS_LABELS: Record<RequestStatus, string> = {
  approval_waiting: "購入承認待ち",
  rejected: "差し戻し",
  receipt_waiting: "購入・領収書貼付待ち",
  receipt_review_waiting: "領収書確認待ち",
  report_waiting: "読了・レポート提出待ち",
  report_review_waiting: "レポート確認待ち",
  completed: "完了"
};

const STATUS_NEXT_ACTIONS: Record<RequestStatus, string> = {
  approval_waiting: "上長が購入可否を判断してください。",
  rejected: "内容を確認し、必要であれば承認待ちに戻してください。",
  receipt_waiting: "購入後、このスレッドに領収書画像を添付し、添付後にボタンを押してください。",
  receipt_review_waiting: "上長がスレッド内の領収書を確認してください。",
  report_waiting: "読了後、ボタンからレポートを提出してください。",
  report_review_waiting: "上長がスレッド内のレポートを確認し、問題なければ完了にしてください。",
  completed: "補助申請は完了です。"
};

const STATE_VALUE_MAX_LENGTH = 1900;

export function slackCommandFromPayload(payload: SlackInteractionPayload): SlackCommand {
  return {
    trigger_id: payload.trigger_id || "",
    user_id: payload.user.id,
    user_name: payload.user.username || payload.user.name,
    channel_id: payload.channel?.id || payload.container?.channel_id
  };
}

export function stateFromPayload(payload: SlackInteractionPayload): BookReportMetadata {
  const state = parseState(payload.actions?.[0]?.value);
  if (!state) {
    throw new Error("Slackボタンの状態情報を読み取れませんでした。");
  }

  return compactState(hydrateStateFromPayload(state, payload));
}

export function parseState(value: string | undefined): BookReportMetadata | null {
  const parsed = parseStateActionValue(value);
  if (!parsed || isStateReference(parsed)) {
    return null;
  }

  return parsed;
}

export function parseStateActionValue(value: string | undefined): StateActionValue | null {
  if (!value) {
    return null;
  }

  return safeJsonParse<StateActionValue>(value);
}

export function isStateReference(value: StateActionValue): value is StateReference {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    value.kind === "book-request-state" &&
    typeof value.requestId === "string" &&
    typeof value.version === "number"
  );
}

export function hydrateStateFromPayload(state: BookReportMetadata, payload: SlackInteractionPayload): BookReportMetadata {
  return {
    ...state,
    channelId: state.channelId || payload.container?.channel_id || payload.channel?.id || "",
    messageTs: state.messageTs || payload.container?.message_ts,
    threadTs: state.threadTs || payload.container?.thread_ts || payload.container?.message_ts
  };
}

export function currentStatus(state: BookReportMetadata): RequestStatus {
  return state.status || "approval_waiting";
}

export function statusHistory(state: BookReportMetadata): RequestStatus[] {
  const history = state.statusHistory || [];
  if (history.length > 0) {
    return history;
  }

  return state.previousStatus ? [state.previousStatus] : [];
}

export function pushStatusHistory(state: BookReportMetadata): RequestStatus[] {
  return [...statusHistory(state), currentStatus(state)].slice(-10);
}

export function compactState(state: BookReportMetadata): BookReportMetadata {
  return {
    ...state,
    slackDisplayName: truncate(state.slackDisplayName, 80),
    bookTitle: truncate(state.bookTitle, 150),
    bookUrl: compactBookUrl(state.bookUrl || ""),
    purpose: truncate(state.purpose, 420)
  };
}

export function withActor(payload: SlackInteractionPayload, text: string): string {
  return `<@${payload.user.id}> ${text}`;
}

export function stateReference(state: BookReportMetadata, version: number): StateReference {
  return {
    kind: "book-request-state",
    requestId: state.requestId,
    version
  };
}

export function stateValue(state: BookReportMetadata, version?: number): string {
  if (version !== undefined) {
    return JSON.stringify(stateReference(state, version));
  }

  const value = JSON.stringify(compactState(state));
  if (value.length > STATE_VALUE_MAX_LENGTH) {
    return JSON.stringify({
      ...compactState(state),
      purpose: truncate(state.purpose, 160),
      bookUrl: compactBookUrl(state.bookUrl)
    });
  }

  return value;
}

export function stateText(state: BookReportMetadata): string {
  const status = currentStatus(state);
  return `<@${state.slackUserId}> 書籍購入補助「${state.bookTitle}」は「${STATUS_LABELS[status]}」です。`;
}

export function modalValue(view: SlackView, blockId: string, actionId: string): string {
  return view.state?.values?.[blockId]?.[actionId]?.value?.trim() || "";
}

export function inputBlock(
  blockId: string,
  actionId: string,
  label: string,
  placeholder: string,
  initialValue?: string,
  multiline = false
): SlackBlock {
  const element: Record<string, unknown> = {
    type: "plain_text_input",
    action_id: actionId,
    placeholder: plainText(placeholder),
    multiline
  };

  if (initialValue) {
    element.initial_value = initialValue;
  }

  return {
    type: "input",
    block_id: blockId,
    label: plainText(label),
    element
  };
}

export function plainText(text: string): SlackBlock {
  return {
    type: "plain_text",
    text,
    emoji: true
  };
}

export function mrkdwn(text: string): SlackBlock {
  return {
    type: "mrkdwn",
    text
  };
}

export function renderStateBlocks(input: BookReportMetadata, version?: number): SlackBlock[] {
  const state = compactState(input);
  const status = currentStatus(state);
  const details = [
    `*申請者*\n<@${state.slackUserId}>`,
    `*対象月*\n${escapeSlack(state.targetMonth)}`,
    `*状態*\n${STATUS_LABELS[status]}`,
    `*書籍URL*\n${state.bookUrl ? `<${escapeSlack(state.bookUrl)}|リンクを開く>` : "未入力"}`
  ];

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: plainText("書籍購入補助")
    },
    {
      type: "section",
      text: mrkdwn(`*${escapeSlack(state.bookTitle)}*\n${escapeSlack(state.purpose)}`)
    },
    {
      type: "section",
      fields: details.map((text) => mrkdwn(text))
    },
    {
      type: "section",
      text: mrkdwn(`*次のアクション*\n${STATUS_NEXT_ACTIONS[status]}`)
    }
  ];

  if (state.prUrl) {
    blocks.push({
      type: "section",
      text: mrkdwn(`*レポートPR*\n<${escapeSlack(state.prUrl)}|#${state.prNumber || ""} を開く>`)
    });
  }

  const elements = actionElementsForState(state, version);
  if (elements.length > 0) {
    blocks.push({
      type: "actions",
      elements
    });
  }

  return blocks;
}

function actionElementsForState(state: BookReportMetadata, version?: number): SlackBlock[] {
  const status = currentStatus(state);
  const elements: SlackBlock[] = [];

  if (status === "approval_waiting") {
    elements.push(button("購入を承認", "approve_purchase", state, version, "primary"));
    return elements;
  }

  if (status === "rejected") {
    elements.push(button("承認待ちに戻す", "reopen_request", state, version, "primary"));
    elements.push(button("一つ前に戻す", "undo_state", state, version));
    return elements;
  }

  if (status === "receipt_waiting") {
    elements.push(button("領収書を貼り付けました", "receipt_uploaded", state, version, "primary"));
    elements.push(button("一つ前に戻す", "undo_state", state, version));
    return elements;
  }

  if (status === "receipt_review_waiting") {
    elements.push(button("領収書を確認済みにする", "confirm_receipt", state, version, "primary"));
    elements.push(button("一つ前に戻す", "undo_state", state, version));
    return elements;
  }

  if (status === "report_waiting") {
    elements.push(button("レポートを書く", "open_book_report", state, version, "primary"));
    elements.push(button("一つ前に戻す", "undo_state", state, version));
    return elements;
  }

  if (status === "report_review_waiting") {
    elements.push(
      button("レポートを確認して完了", "confirm_report", state, version, "primary", {
        title: plainText("完了してよいですか？"),
        text: mrkdwn("PRをマージして補助申請を完了します。完了後はSlackから一つ前に戻せません。"),
        confirm: plainText("完了する"),
        deny: plainText("キャンセル")
      })
    );
    if (state.prUrl) {
      elements.push({
        type: "button",
        text: plainText("PRを開く"),
        action_id: "open_pr_url",
        url: state.prUrl
      });
    }
    elements.push(button("一つ前に戻す", "undo_state", state, version));
    return elements;
  }

  return elements;
}

function button(
  label: string,
  actionId: string,
  state: BookReportMetadata,
  version?: number,
  style?: "primary" | "danger",
  confirm?: SlackBlock
): SlackBlock {
  const element: SlackBlock = {
    type: "button",
    text: plainText(label),
    action_id: actionId,
    value: stateValue(state, version)
  };

  if (style) {
    element.style = style;
  }

  if (confirm) {
    element.confirm = confirm;
  }

  return element;
}
