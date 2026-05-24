import { normalizeBookUrl, type BookReportInput, type BookReportMetadata } from "./format";
import { lookupSlackDisplayName } from "./slack";
import { currentStatus, inputBlock, modalValue, plainText, stateReference } from "./state";
import type { SlackInteractionPayload } from "./types";

export function buildBookReportModalView(state: BookReportMetadata, version: number) {
  const report = state.report;
  const isEditing = currentStatus(state) === "report_review_waiting";

  return {
    type: "modal",
    callback_id: "book_report_submit",
    private_metadata: JSON.stringify(stateReference(state, version)),
    title: plainText(isEditing ? "書籍レポートを編集" : "書籍レポート"),
    submit: plainText(isEditing ? "更新する" : "提出する"),
    close: plainText("閉じる"),
    blocks: [
      inputBlock("book_title", "book_title", "書籍名", "書籍名", report?.bookTitle || state.bookTitle),
      inputBlock("reporter_name", "reporter_name", "氏名", "書籍レポートのAuthorに表示する氏名", report?.slackDisplayName || state.slackDisplayName),
      inputBlock("author", "author", "著者", "著者名", report?.author),
      inputBlock("link", "link", "リンク", "書籍URL", report?.link || state.bookUrl),
      inputBlock("objective", "objective", "読む前の目的", "読み始める前に知りたかったこと", report?.objective || state.purpose, true),
      inputBlock("takeaways", "takeaways", "得られた知識", "得られた知識や気づき", report?.takeaways, true),
      inputBlock("application", "application", "実務における活用", "業務でどう活用できそうか", report?.application, true),
      inputBlock("positive", "positive", "良かった点", "良かった点、学びになった点", report?.positive, true),
      inputBlock("negative", "negative", "難しかった点・合わなかった点", "難しかった点や合わなかった点", report?.negative, true),
      inputBlock("recommend", "recommend", "どんな人におすすめ？", "おすすめしたい人", report?.recommend, true)
    ]
  };
}

export async function buildReportInput(env: Env, payload: SlackInteractionPayload, state: BookReportMetadata): Promise<BookReportInput> {
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
