import {
  buildBookReportSlackMessage,
  buildReportMetadata,
  normalizeBookUrl,
  type BookReportMetadata,
  type BookRequestInput,
  type RequestStatus
} from "./format";
import { createBookReportPullRequest, mergePullRequest, updateBookReportPullRequest } from "./github";
import { buildBookReportModalView, buildReportInput } from "./report-modal";
import {
  STATUS_LABELS,
  compactState,
  currentStatus,
  inputBlock,
  modalValue,
  plainText,
  pushStatusHistory,
  renderStateBlocks,
  stateText,
  statusHistory,
  withActor
} from "./state";
import {
  clearReportSubmissionLock,
  lockReportSubmission,
  saveRequestState,
  seedRequestState,
  type RequestStateRecord
} from "./request-state";
import { loadActionState, loadViewState, stateForError, type LoadedState } from "./workflow-state";
import {
  addCompletedReaction,
  lookupSlackRealName,
  normalizeApplicantName as cleanApplicantName,
  slackApi
} from "./slack";
import type { SlackApiResponse, SlackCommand, SlackInteractionPayload, SlackPostMessageResponse } from "./types";
import { currentMonthInJapan, errorMessage, safeJsonParse, todayInJapan } from "./utils";

export async function handleInteraction(payload: SlackInteractionPayload, env: Env): Promise<void> {
  if (payload.type === "view_submission") {
    if (payload.view?.callback_id === "book_request_submit") {
      await handleBookRequestSubmission(env, payload);
      return;
    }

    if (payload.view?.callback_id === "book_report_submit") {
      await handleBookReportSubmission(env, payload);
      return;
    }
  }

  if (payload.type !== "block_actions") {
    return;
  }
  const action = payload.actions?.[0];
  if (!action) {
    return;
  }

  switch (action.action_id) {
    case "approve_purchase":
      await transitionState(env, payload, ["approval_waiting"], "receipt_waiting", "購入が承認されました。購入後、このスレッドに領収書画像を添付してください。");
      return;
    case "reject_request":
      await transitionState(env, payload, ["approval_waiting"], "rejected", "申請が差し戻されました。");
      return;
    case "reopen_request":
      await transitionState(env, payload, ["rejected"], "approval_waiting", "申請を購入承認待ちに戻しました。");
      return;
    case "receipt_uploaded":
      await transitionState(env, payload, ["receipt_waiting"], "receipt_review_waiting", "領収書の貼り付け済みとして受け付けました。上長がスレッド内の画像を確認してください。");
      return;
    case "confirm_receipt":
      await transitionState(env, payload, ["receipt_review_waiting"], "report_waiting", "領収書を確認済みにしました。読了後、レポートを提出してください。");
      return;
    case "confirm_report":
      await confirmReportAndComplete(env, payload);
      return;
    case "undo_state":
      await undoState(env, payload);
      return;
    default:
      return;
  }
}

export async function openBookRequestModal(env: Env, triggerId: string, command: SlackCommand): Promise<void> {
  const targetMonth = currentMonthInJapan();
  const initialRealName = await lookupSlackRealName(env, command.user_id);

  await slackApi<SlackApiResponse>(env, "views.open", {
    trigger_id: triggerId,
    view: {
      type: "modal",
      callback_id: "book_request_submit",
      private_metadata: JSON.stringify({
        slackUserId: command.user_id,
        slackDisplayName: initialRealName || "",
        channelId: command.channel_id || env.BOOK_REQUEST_CHANNEL_ID
      }),
      title: plainText("書籍購入補助"),
      submit: plainText("申請する"),
      close: plainText("閉じる"),
      blocks: [
        inputBlock("applicant_name", "applicant_name", "氏名", "書籍レポートのAuthorに表示する氏名", initialRealName),
        inputBlock("book_title", "book_title", "書名", "購入したい本のタイトル"),
        inputBlock("book_url", "book_url", "書籍URL", "Amazon、出版社、書店などのURL"),
        inputBlock("target_month", "target_month", "対象月", "YYYY-MM", targetMonth),
        inputBlock("purpose", "purpose", "購入目的", "なぜ読みたいか、業務でどう使うか", undefined, true)
      ]
    }
  });
}

export async function openBookReportModal(env: Env, payload: SlackInteractionPayload): Promise<void> {
  const loaded = await loadActionState(env, payload);
  if (loaded.stale) {
    await postStaleStateHistory(env, payload, loaded);
    return;
  }

  if (!payload.trigger_id) {
    throw new Error("レポート提出に必要な申請情報が見つかりませんでした。");
  }

  await slackApi<SlackApiResponse>(env, "views.open", {
    trigger_id: payload.trigger_id,
    view: buildBookReportModalView(loaded.state, loaded.version)
  });
}

export async function handleInteractionError(env: Env, payload: SlackInteractionPayload, error: unknown): Promise<void> {
  console.error("Slack interaction failed", {
    errorName: error instanceof Error ? error.name : typeof error
  });

  const state = await stateForError(env, payload);
  if (!state) {
    return;
  }

  await postHistory(env, state, `処理中にエラーが発生しました: ${errorMessage(error)}`);
}

async function handleBookRequestSubmission(env: Env, payload: SlackInteractionPayload): Promise<void> {
  if (!payload.view) {
    throw new Error("Slack view payload is missing.");
  }

  const metadata = safeJsonParse<Record<string, string>>(payload.view.private_metadata || "{}") || {};
  const typedDisplayName = cleanApplicantName(modalValue(payload.view, "applicant_name", "applicant_name"));
  const fallbackDisplayName = metadata.slackDisplayName || payload.user.username || payload.user.name || payload.user.id;
  const slackDisplayName = typedDisplayName || (await lookupSlackDisplayName(env, payload.user.id, fallbackDisplayName));
  const requestInput: BookRequestInput = {
    requestId: `book-${todayInJapan()}-${crypto.randomUUID().slice(0, 8)}`,
    slackUserId: payload.user.id,
    slackDisplayName,
    bookTitle: modalValue(payload.view, "book_title", "book_title"),
    bookUrl: normalizeBookUrl(modalValue(payload.view, "book_url", "book_url")),
    purpose: modalValue(payload.view, "purpose", "purpose"),
    targetMonth: modalValue(payload.view, "target_month", "target_month"),
    slackChannelId: env.BOOK_REQUEST_CHANNEL_ID,
    createdAtIso: new Date().toISOString()
  };

  const state = compactState(buildReportMetadata(requestInput));
  const message = await postStateMessage(env, state);
  const hydratedState = compactState({
    ...state,
    channelId: message.channel || env.BOOK_REQUEST_CHANNEL_ID,
    messageTs: message.ts,
    threadTs: message.ts
  });
  const record = await seedRequestState(env, hydratedState);

  await updateStateMessage(env, record.state, record.version);
  await postHistory(env, record.state, "申請を受け付けました。上長がSlackのボタンから購入可否を判断します。");
}

async function handleBookReportSubmission(env: Env, payload: SlackInteractionPayload): Promise<void> {
  if (!payload.view) {
    throw new Error("Slack view payload is missing.");
  }

  const loaded = await loadViewState(env, payload);
  if (loaded.stale) {
    await postStaleStateHistory(env, payload, loaded, "古いレポートフォームです。最新の親投稿からもう一度開いてください。");
    return;
  }

  const status = currentStatus(loaded.state);
  if (status !== "report_waiting" && status !== "report_review_waiting") {
    await postHistory(env, loaded.state, `現在の状態は「${STATUS_LABELS[status]}」のため、レポートは提出できません。`);
    await updateStateMessage(env, loaded.state, loaded.version);
    return;
  }

  if (status === "report_review_waiting") {
    await updateSubmittedReport(env, payload, loaded);
    return;
  }

  const lockResult = await lockReportSubmission(env, loaded.state.requestId, loaded.version);
  if (!lockResult.ok) {
    await postConflictHistory(env, payload, lockResult.record || loaded);
    return;
  }

  const report = await buildReportInput(env, payload, lockResult.record.state);

  let pullRequest: Awaited<ReturnType<typeof createBookReportPullRequest>>;
  try {
    pullRequest = await createBookReportPullRequest(env, report, lockResult.record.state);
  } catch (error) {
    await clearReportSubmissionLock(env, lockResult.record.state.requestId, lockResult.record.version).catch(() => undefined);
    throw error;
  }

  await postHistory(
    env,
    lockResult.record.state,
    `${buildBookReportSlackMessage(report)}\n\n*GitHub PR*\n${pullRequest.html_url}\n\n上長は内容を確認し、親投稿のボタンから完了にしてください。`
  );

  const nextState = compactState({
    ...lockResult.record.state,
    slackDisplayName: report.slackDisplayName,
    bookTitle: report.bookTitle,
    bookUrl: report.link,
    status: "report_review_waiting",
    previousStatus: currentStatus(lockResult.record.state),
    statusHistory: pushStatusHistory(lockResult.record.state),
    prNumber: pullRequest.number,
    prUrl: pullRequest.html_url,
    prBranch: pullRequest.head.ref,
    reportPath: pullRequest.reportPath,
    report
  });

  const saved = await saveRequestState(env, nextState, lockResult.record.version);
  if (!saved.ok) {
    const recovered = saved.record?.reportSubmissionLockedAtIso ? await saveRequestState(env, nextState) : saved;
    if (!recovered.ok) {
      await postConflictHistory(env, payload, recovered.record || saved.record || loaded);
      return;
    }

    await updateStateMessage(env, recovered.record.state, recovered.record.version);
    return;
  }

  await updateStateMessage(env, saved.record.state, saved.record.version);
}

async function updateSubmittedReport(env: Env, payload: SlackInteractionPayload, loaded: LoadedState): Promise<void> {
  const report = await buildReportInput(env, payload, loaded.state);
  await updateBookReportPullRequest(env, report, loaded.state);
  await postHistory(env, loaded.state, `${buildBookReportSlackMessage(report)}\n\n*GitHub PRを更新しました*\n${loaded.state.prUrl}\n\n上長は内容を確認し、親投稿のボタンから完了にしてください。`);

  const nextState = compactState({
    ...loaded.state,
    slackDisplayName: report.slackDisplayName,
    bookTitle: report.bookTitle,
    bookUrl: report.link,
    report
  });
  const saved = await saveRequestState(env, nextState, loaded.version);
  if (!saved.ok) {
    const recovered =
      saved.record?.state.status === "report_review_waiting" && saved.record.state.prNumber === loaded.state.prNumber
        ? await saveRequestState(env, nextState)
        : saved;
    if (!recovered.ok) {
      await postConflictHistory(env, payload, recovered.record || saved.record || loaded);
      return;
    }

    await updateStateMessage(env, recovered.record.state, recovered.record.version);
    return;
  }

  await updateStateMessage(env, saved.record.state, saved.record.version);
}

async function buildReportInput(env: Env, payload: SlackInteractionPayload, state: BookReportMetadata): Promise<BookReportInput> {
  if (!payload.view) {
    throw new Error("Slack view payload is missing.");
  }

  const typedDisplayName = modalValue(payload.view, "reporter_name", "reporter_name");
  const slackDisplayName =
    typedDisplayName ||
    (await lookupSlackDisplayName(env, payload.user.id, state.slackDisplayName || payload.user.username || payload.user.name || payload.user.id));

  return {
    slackUserId: payload.user.id,
    slackDisplayName,
    bookTitle: modalValue(payload.view, "book_title", "book_title"),
    author: modalValue(payload.view, "author", "author"),
    link: normalizeBookUrl(modalValue(payload.view, "link", "link")),
    objective: modalValue(payload.view, "objective", "objective"),
    takeaways: modalValue(payload.view, "takeaways", "takeaways"),
    application: modalValue(payload.view, "application", "application"),
    positive: modalValue(payload.view, "positive", "positive"),
    negative: modalValue(payload.view, "negative", "negative"),
    recommend: modalValue(payload.view, "recommend", "recommend"),
    sourceRequestId: state.requestId,
    sourceSlackChannelId: state.channelId,
    sourceSlackThreadTs: state.threadTs || "",
    submittedAtIso: state.report?.submittedAtIso || new Date().toISOString()
  };
}

async function transitionState(
  env: Env,
  payload: SlackInteractionPayload,
  allowedFrom: RequestStatus[],
  nextStatus: RequestStatus,
  historyText: string,
  extra: Partial<BookReportMetadata> = {}
): Promise<void> {
  const loaded = await loadActionState(env, payload);
  if (loaded.stale) {
    await postStaleStateHistory(env, payload, loaded);
    return;
  }

  const fromStatus = currentStatus(loaded.state);
  if (!allowedFrom.includes(fromStatus)) {
    await postHistory(env, loaded.state, withActor(payload, `現在の状態は「${STATUS_LABELS[fromStatus]}」のため、この操作はできません。`));
    await updateStateMessage(env, loaded.state, loaded.version);
    return;
  }

  const nextState = compactState({
    ...loaded.state,
    ...extra,
    status: nextStatus,
    previousStatus: fromStatus,
    statusHistory: pushStatusHistory(loaded.state),
    channelId: loaded.state.channelId || env.BOOK_REQUEST_CHANNEL_ID
  });

  const saved = await saveRequestState(env, nextState, loaded.version);
  if (!saved.ok) {
    await postConflictHistory(env, payload, saved.record || loaded);
    return;
  }

  await updateStateMessage(env, saved.record.state, saved.record.version);
  await postHistory(env, saved.record.state, withActor(payload, historyText));
}

async function undoState(env: Env, payload: SlackInteractionPayload): Promise<void> {
  const loaded = await loadActionState(env, payload);
  if (loaded.stale) {
    await postStaleStateHistory(env, payload, loaded);
    return;
  }

  if (currentStatus(loaded.state) === "completed") {
    await postHistory(env, loaded.state, withActor(payload, "完了済みのためSlackからは一つ前に戻せません。必要な場合はGitHub上で別途修正してください。"));
    return;
  }

  const history = statusHistory(loaded.state);
  const previousStatus = history.at(-1);
  if (!previousStatus) {
    await postHistory(env, loaded.state, withActor(payload, "戻せる直前の状態がありません。"));
    return;
  }

  const remainingHistory = history.slice(0, -1);
  const nextState = compactState({
    ...loaded.state,
    status: previousStatus,
    previousStatus: remainingHistory.at(-1),
    statusHistory: remainingHistory
  });

  const saved = await saveRequestState(env, nextState, loaded.version);
  if (!saved.ok) {
    await postConflictHistory(env, payload, saved.record || loaded);
    return;
  }

  await updateStateMessage(env, saved.record.state, saved.record.version);
  await postHistory(env, saved.record.state, withActor(payload, `状態を「${STATUS_LABELS[currentStatus(saved.record.state)]}」に戻しました。`));
}

async function confirmReportAndComplete(env: Env, payload: SlackInteractionPayload): Promise<void> {
  const loaded = await loadActionState(env, payload);
  if (loaded.stale) {
    await postStaleStateHistory(env, payload, loaded);
    return;
  }

  if (currentStatus(loaded.state) !== "report_review_waiting" || !loaded.state.prNumber) {
    await postHistory(env, loaded.state, withActor(payload, "レポート確認待ちではないため、完了処理はできません。"));
    await updateStateMessage(env, loaded.state, loaded.version);
    return;
  }

  await mergePullRequest(env, loaded.state);
  const nextState = compactState({
    ...loaded.state,
    status: "completed",
    previousStatus: currentStatus(loaded.state),
    statusHistory: pushStatusHistory(loaded.state)
  });

  const saved = await saveRequestState(env, nextState, loaded.version);
  if (!saved.ok) {
    await postConflictHistory(env, payload, saved.record || loaded);
    return;
  }

  await updateStateMessage(env, saved.record.state, saved.record.version);
  await addCompletedReaction(env, saved.record.state);
  await postHistory(env, saved.record.state, withActor(payload, `レポートを確認し、PR #${loaded.state.prNumber} をマージしました。補助申請は完了です。`));
}

async function postStateMessage(env: Env, state: BookReportMetadata): Promise<SlackPostMessageResponse> {
  return slackApi<SlackPostMessageResponse>(env, "chat.postMessage", {
    channel: state.channelId || env.BOOK_REQUEST_CHANNEL_ID,
    text: stateText(state),
    blocks: renderStateBlocks(state)
  });
}

async function updateStateMessage(env: Env, state: BookReportMetadata, version: number): Promise<void> {
  if (!state.messageTs) {
    throw new Error("更新対象のSlackメッセージが見つかりませんでした。");
  }

  await slackApi<SlackApiResponse>(env, "chat.update", {
    channel: state.channelId || env.BOOK_REQUEST_CHANNEL_ID,
    ts: state.messageTs,
    text: stateText(state),
    blocks: renderStateBlocks(state, version)
  });
}

async function postHistory(env: Env, state: BookReportMetadata, text: string): Promise<void> {
  await slackApi<SlackApiResponse>(env, "chat.postMessage", {
    channel: state.channelId || env.BOOK_REQUEST_CHANNEL_ID,
    thread_ts: state.threadTs || state.messageTs,
    text
  });
}

async function postStaleStateHistory(env: Env, payload: SlackInteractionPayload, loaded: LoadedState, text = "古いボタンです。最新の親投稿から操作してください。"): Promise<void> {
  await postHistory(env, loaded.state, withActor(payload, text));
  await updateStateMessage(env, loaded.state, loaded.version);
}

async function postConflictHistory(
  env: Env,
  payload: SlackInteractionPayload,
  current: Pick<LoadedState, "state" | "version"> | RequestStateRecord
): Promise<void> {
  const state = "state" in current ? current.state : current;
  const version = "version" in current ? current.version : 0;
  await postHistory(env, state, withActor(payload, "別の操作により状態が更新されています。最新の親投稿から操作してください。"));
  if (version > 0) {
    await updateStateMessage(env, state, version);
  }
}
