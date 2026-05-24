import { describe, test } from "node:test";
import assert from "node:assert";
import {
  buildBookReportIssueBody,
  buildBookReportIssueTitle,
  buildBookReportMarkdown,
  buildBookReportSlackMessage,
  buildIssueBody,
  buildIssueTitle,
  buildReadingMemoComment,
  normalizeBookUrl,
  withReceiptMetadata,
  withSlackThreadMetadata
} from "../../workers/slack-book-gateway/src/format.js";

describe("slack-book-gateway format helpers", () => {
  const input = {
    requestId: "book-2026-05-test",
    slackUserId: "U123",
    slackDisplayName: "山田太郎",
    bookTitle: "リーダブルコード",
    bookUrl: "https://example.com/book",
    purpose: "読みやすいコードを書けるようになりたい",
    targetMonth: "2026-05",
    slackChannelId: "C0B5FKHTTCK",
    createdAtIso: "2026-05-23T00:00:00.000Z"
  };

  test("buildIssueTitle includes book title and Slack display name", () => {
    assert.strictEqual(buildIssueTitle(input), "書籍購入補助: リーダブルコード (山田太郎)");
  });

  test("buildIssueBody stores Slack metadata without receipt data", () => {
    const body = buildIssueBody(input);

    assert.match(body, /Slack user id: U123/u);
    assert.match(body, /slack_channel: C0B5FKHTTCK/u);
    assert.match(body, /slack_thread_ts: 未作成/u);
    assert.match(body, /receipt_storage: 未提出/u);
  });

  test("withSlackThreadMetadata replaces placeholder thread ts", () => {
    const body = withSlackThreadMetadata(buildIssueBody(input), "1710000000.000000");

    assert.match(body, /slack_thread_ts: 1710000000\.000000/u);
    assert.doesNotMatch(body, /slack_thread_ts: 未作成/u);
  });

  test("withReceiptMetadata marks receipt as submitted", () => {
    const body = withReceiptMetadata(buildIssueBody(input), ["F123", "F456"]);

    assert.match(body, /receipt_submitted: true/u);
    assert.match(body, /receipt_storage: slack_file:F123,F456/u);
  });

  test("buildReadingMemoComment renders three memo fields", () => {
    const comment = buildReadingMemoComment({
      slackUserId: "U123",
      beforeQuestion: "保守しやすいコードの観点",
      usefulTakeaway: "命名と分割が大事",
      nextAction: "レビュー時に名前を確認する"
    });

    assert.match(comment, /読む前に知りたかったこと/u);
    assert.match(comment, /命名と分割が大事/u);
    assert.match(comment, /次に試すことを1つ/u);
  });

  test("buildBookReportIssueBody matches existing GitHub report fields", () => {
    const report = {
      slackUserId: "U123",
      slackDisplayName: "山田太郎",
      bookTitle: "リーダブルコード",
      author: "Dustin Boswell",
      link: "https://example.com/book",
      objective: "読みやすいコードを書けるようになりたい",
      takeaways: "名前の重要性",
      application: "関数名を見直す",
      positive: "具体例が多い",
      negative: "なし",
      recommend: "コードレビューをする人",
      sourceRequestId: "book-2026-05-test",
      sourceSlackChannelId: "C0B5FKHTTCK",
      sourceSlackThreadTs: "1779506111.361809",
      submittedAtIso: "2026-05-23T00:00:00.000Z"
    };

    assert.strictEqual(buildBookReportIssueTitle(report), "📚 リーダブルコード 書籍レポート");

    const body = buildBookReportIssueBody(report);
    assert.match(body, /### 書籍名/u);
    assert.match(body, /### 著者/u);
    assert.match(body, /### リンク/u);
    assert.match(body, /### 実務における活用/u);
    assert.match(body, /slack_display_name: 山田太郎/u);

    const slackMessage = buildBookReportSlackMessage(report);
    assert.match(slackMessage, /書籍レポートを受け付けました/u);
    assert.match(slackMessage, /コードレビューをする人/u);

    const markdown = buildBookReportMarkdown(report, "https://slack.com/archives/C0B5FKHTTCK/p1779506111361809", "2026-05-23");
    assert.match(markdown, /Original Source/u);
    assert.match(markdown, /投稿者/u);
    assert.match(markdown, /実務における活用/u);
  });

  test("normalizeBookUrl canonicalizes long Amazon product URLs without truncating", () => {
    const normalized = normalizeBookUrl(
      "https://www.amazon.co.jp/%E3%83%86%E3%82%B9%E3%83%88/dp/4822283684/ref=sr_1_1?__mk_ja_JP=%E3%82%AB%E3%82%BF%E3%82%AB%E3%83%8A&crid=abc"
    );

    assert.strictEqual(normalized, "https://www.amazon.co.jp/dp/4822283684");
  });

  test("normalizeBookUrl unwraps Slack link markup and HTML entities", () => {
    const normalized = normalizeBookUrl("<https://example.com/book?foo=1&amp;bar=2|リンク>");

    assert.strictEqual(normalized, "https://example.com/book?foo=1&bar=2");
  });
});
