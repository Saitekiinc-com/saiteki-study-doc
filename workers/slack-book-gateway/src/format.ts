export type BookRequestInput = {
  requestId: string;
  slackUserId: string;
  slackDisplayName: string;
  bookTitle: string;
  bookUrl: string;
  purpose: string;
  targetMonth: string;
  slackChannelId: string;
  slackThreadTs?: string;
  createdAtIso: string;
};

export type ReadingMemoInput = {
  beforeQuestion: string;
  usefulTakeaway: string;
  nextAction: string;
  slackUserId: string;
};

export type BookReportMetadata = {
  requestId: string;
  slackUserId: string;
  slackDisplayName: string;
  bookTitle: string;
  bookUrl: string;
  purpose: string;
  targetMonth: string;
  channelId: string;
  messageTs?: string;
  threadTs?: string;
  status?: RequestStatus;
  previousStatus?: RequestStatus;
  statusHistory?: RequestStatus[];
  prNumber?: number;
  prUrl?: string;
  prBranch?: string;
  reportPath?: string;
  report?: BookReportInput;
};

export type RequestStatus =
  | "approval_waiting"
  | "rejected"
  | "receipt_waiting"
  | "receipt_review_waiting"
  | "report_waiting"
  | "report_review_waiting"
  | "completed";

export type BookReportInput = {
  slackUserId: string;
  slackDisplayName: string;
  bookTitle: string;
  author: string;
  link: string;
  objective: string;
  takeaways: string;
  application: string;
  positive: string;
  negative: string;
  recommend: string;
  sourceRequestId: string;
  sourceSlackChannelId: string;
  sourceSlackThreadTs: string;
  submittedAtIso: string;
};

export function buildIssueTitle(input: Pick<BookRequestInput, "bookTitle" | "slackDisplayName">): string {
  return `書籍購入補助: ${input.bookTitle} (${input.slackDisplayName})`;
}

export function buildIssueBody(input: BookRequestInput): string {
  return `# 書籍購入補助申請

## 申請者
- Slack user id: ${input.slackUserId}
- Slack mention: <@${input.slackUserId}>
- Slack display name: ${input.slackDisplayName}
- GitHub user: 未設定

## 申請内容
- 種別: 本が決まっている
- 書名: ${input.bookTitle}
- URL: ${input.bookUrl}
- 購入目的:
${indentBlock(input.purpose)}
- 対象月: ${input.targetMonth}

## 状態
- book_selected: true
- receipt_submitted: false
- approved: false
- reading_memo_submitted: false
- published: false

## 非公開情報
- request_id: ${input.requestId}
- receipt_storage: 未提出
- slack_channel: ${input.slackChannelId}
- slack_thread_ts: ${input.slackThreadTs || "未作成"}
- created_at: ${input.createdAtIso}
`;
}

export function withSlackThreadMetadata(body: string, threadTs: string): string {
  if (body.includes("- slack_thread_ts:")) {
    return body.replace(/- slack_thread_ts: .*/u, `- slack_thread_ts: ${threadTs}`);
  }
  return `${body.trimEnd()}\n- slack_thread_ts: ${threadTs}\n`;
}

export function withReceiptMetadata(body: string, fileIds: string[]): string {
  const storageValue = fileIds.length > 0 ? `slack_file:${fileIds.join(",")}` : "slack_file:unknown";
  let updated = body.replace("- receipt_submitted: false", "- receipt_submitted: true");
  if (updated.includes("- receipt_storage:")) {
    updated = updated.replace(/- receipt_storage: .*/u, `- receipt_storage: ${storageValue}`);
  }
  return updated;
}

export function withReadingMemoSubmitted(body: string): string {
  return body.replace("- reading_memo_submitted: false", "- reading_memo_submitted: true");
}

export function buildReadingMemoComment(input: ReadingMemoInput): string {
  return `## 読後メモ

投稿者: <@${input.slackUserId}>

### 読む前に知りたかったこと
${input.beforeQuestion}

### 読んで役に立ったことを1つ
${input.usefulTakeaway}

### 次に試すことを1つ
${input.nextAction}
`;
}

export function buildReportMetadata(input: BookRequestInput): BookReportMetadata {
  return {
    requestId: input.requestId,
    slackUserId: input.slackUserId,
    slackDisplayName: input.slackDisplayName,
    bookTitle: input.bookTitle,
    bookUrl: input.bookUrl,
    purpose: input.purpose,
    targetMonth: input.targetMonth,
    channelId: input.slackChannelId,
    messageTs: input.slackThreadTs,
    threadTs: input.slackThreadTs,
    status: "approval_waiting"
  };
}

export function buildBookReportIssueTitle(input: Pick<BookReportInput, "bookTitle">): string {
  return `📚 ${input.bookTitle} 書籍レポート`;
}

export function buildBookReportIssueBody(input: BookReportInput): string {
  return `<!--
source: slack-book-gateway
request_id: ${input.sourceRequestId}
slack_user_id: ${input.slackUserId}
slack_display_name: ${input.slackDisplayName}
slack_channel: ${input.sourceSlackChannelId}
slack_thread_ts: ${input.sourceSlackThreadTs}
submitted_at: ${input.submittedAtIso}
-->

### 書籍名
${input.bookTitle}

### 著者
${input.author}

### リンク
${input.link}

### 読む前の目的
${input.objective}

### 得られた知識
${input.takeaways}

### 実務における活用
${input.application}

### 良かった点
${input.positive}

### 難しかった点・合わなかった点
${input.negative}

### 💡 どんな人におすすめ？
${input.recommend}
`;
}

export function buildBookReportMarkdown(input: BookReportInput, sourceUrl: string, date: string): string {
  return `---
title: "${input.bookTitle}"
author: ${input.slackDisplayName}
issue_url: ${sourceUrl}
date: ${date}
---

# ${input.bookTitle}

*   **Original Source**: [Slack thread](${sourceUrl})
*   **投稿者**: ${input.slackDisplayName}
*   **書籍の著者**: ${input.author}
${input.link ? `*   **リンク**: [${input.link}](${input.link})` : ""}

---

## 🎯 読む前の目的
${input.objective || "なし"}

## 💡 得られた知識・気づき
${input.takeaways || "なし"}

## 🛠 実務における活用
${input.application || "なし"}

## 👍 良かった点・学び
${input.positive || "なし"}

## 👎 難しかった点・合わなかった点
${input.negative || "なし"}

## 👤 どんな人におすすめ？
${input.recommend || "なし"}

---
`;
}

export function buildBookReportSlackMessage(input: BookReportInput): string {
  return `*<@${input.slackUserId}> 書籍レポートを受け付けました。*

*書籍名*
${input.bookTitle}

*著者*
${input.author}

*リンク*
${input.link}

*読む前の目的*
${input.objective}

*得られた知識*
${input.takeaways}

*実務における活用*
${input.application}

*良かった点*
${input.positive}

*難しかった点・合わなかった点*
${input.negative}

*💡 どんな人におすすめ？*
${input.recommend}`;
}

export function normalizeBookUrl(value: string): string {
  const trimmed = unwrapSlackLink(value.trim()).replace(/&amp;/gu, "&");
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
  const amazonUrl = canonicalAmazonUrl(withProtocol);
  if (amazonUrl) {
    return amazonUrl;
  }

  try {
    const url = new URL(withProtocol);
    return url.toString();
  } catch {
    return withProtocol;
  }
}

function unwrapSlackLink(value: string): string {
  const match = value.match(/^<([^>|]+)(?:\|[^>]+)?>$/u);
  return match?.[1] || value;
}

function canonicalAmazonUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!/(^|\.)amazon\./iu.test(url.hostname)) {
      return null;
    }

    const match = url.pathname.match(/\/(?:dp|gp\/product|exec\/obidos\/ASIN)\/([A-Z0-9]{10})(?:[/?]|$)/iu);
    if (!match) {
      return null;
    }

    return `${url.origin}/dp/${match[1].toUpperCase()}`;
  } catch {
    return null;
  }
}

function indentBlock(value: string): string {
  return value
    .trim()
    .split(/\r?\n/u)
    .map((line) => `  ${line}`)
    .join("\n");
}
