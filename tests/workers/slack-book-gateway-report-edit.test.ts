/// <reference path="../../workers/slack-book-gateway/src/worker-configuration.d.ts" />

import { afterEach, describe, test } from "node:test";
import assert from "node:assert";
import worker from "../../workers/slack-book-gateway/src/index.js";
import {
  actionLabels,
  blockActionPayload,
  createExecutionContext,
  createMockStateNamespace,
  firstActionState,
  installFetchMock,
  makeState,
  reportSubmissionPayload,
  signedRequest
} from "./slack-book-gateway-test-helpers";

const env = {
  SLACK_SIGNING_SECRET: "test-signing-secret",
  SLACK_BOT_TOKEN: "xoxb-test",
  GITHUB_TOKEN: "ghp-test",
  BOOK_REQUEST_CHANNEL_ID: "C0B5FKHTTCK",
  GITHUB_OWNER: "Saitekiinc-com",
  GITHUB_REPO: "saiteki-study-doc",
  BOOK_PURCHASE_REQUESTS: createMockStateNamespace()
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  env.BOOK_PURCHASE_REQUESTS.clear();
});

describe("slack-book-gateway report edit flow", () => {
  test("opens the submitted report with current values and does not offer undo", async () => {
    const calls = installFetchMock();
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(reportReviewState());

    const response = await postInteraction(
      blockActionPayload("open_book_report", {
        kind: "book-request-state",
        requestId: record.state.requestId,
        version: record.version
      }, "U_REQUESTER")
    );
    const modalCall = calls.findSlack("views.open");
    const blocks = modalCall.body.view.blocks;

    assert.strictEqual(response.status, 200);
    assert.strictEqual(modalCall.body.view.title.text, "書籍レポートを編集");
    assert.strictEqual(blocks.find((block: any) => block.block_id === "author").element.initial_value, "Dustin Boswell");
    assert.strictEqual(blocks.find((block: any) => block.block_id === "takeaways").element.initial_value, "命名が重要");
  });

  test("updates the existing report PR branch when an edited report is submitted", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(reportReviewState());
    const stateReference = {
      kind: "book-request-state",
      requestId: record.state.requestId,
      version: record.version
    };

    const response = await postInteraction(reportSubmissionPayload(stateReference, {
      takeaways: "編集後の学び",
      positive: "編集後の良かった点"
    }), ctx);
    await ctx.waitForWaitUntil();

    const updateCall = calls.findSlack("chat.update");
    const nextState = firstActionState(updateCall.body.blocks, env.BOOK_PURCHASE_REQUESTS);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.github("/repos/Saitekiinc-com/saiteki-study-doc/pulls", "POST").length, 0);
    assert.ok(calls.findGitHub("/repos/Saitekiinc-com/saiteki-study-doc/git/refs/heads/book-report/slack-test", "PATCH"));
    assert.ok(calls.findGitHub("/repos/Saitekiinc-com/saiteki-study-doc/pulls/231", "PATCH"));
    assert.strictEqual(nextState.status, "report_review_waiting");
    assert.strictEqual(nextState.report.takeaways, "編集後の学び");
    assert.deepStrictEqual(actionLabels(updateCall.body.blocks), ["レポートを編集", "レポートを確認して完了", "PRを開く"]);
    assert.match(calls.findSlack("chat.postMessage").body.text, /GitHub PRを更新しました/u);
  });
});

function reportReviewState() {
  const report = {
    slackUserId: "U_REQUESTER",
    slackDisplayName: "杉本光一",
    bookTitle: "リーダブルコード",
    author: "Dustin Boswell",
    link: "https://example.com/book",
    objective: "レビューの質を上げたい",
    takeaways: "命名が重要",
    application: "レビュー時に名前を見る",
    positive: "具体例が多い",
    negative: "なし",
    recommend: "コードレビューをする人",
    sourceRequestId: "book-2026-05-test",
    sourceSlackChannelId: "C0B5FKHTTCK",
    sourceSlackThreadTs: "1710000000.000000",
    submittedAtIso: "2026-05-24T00:00:00.000Z"
  };

  return makeState({
    status: "report_review_waiting",
    previousStatus: "report_waiting",
    statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting", "report_waiting"],
    prNumber: 231,
    prUrl: "https://github.com/Saitekiinc-com/saiteki-study-doc/pull/231",
    prBranch: "book-report/slack-test",
    reportPath: "docs/knowledge_base/book_reports/report.md",
    report
  });
}

async function postInteraction(payload: unknown, ctx = createExecutionContext()): Promise<Response> {
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  return worker.fetch(await signedRequest("/slack/interactions", body), env as never, ctx.ctx);
}
