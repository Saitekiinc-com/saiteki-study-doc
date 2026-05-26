/// <reference path="../../workers/slack-book-gateway/src/worker-configuration.d.ts" />

import { describe, test, afterEach } from "node:test";
import assert from "node:assert";
import worker from "../../workers/slack-book-gateway/src/index.js";
import {
  actionLabels,
  blockActionPayload,
  confirmForAction,
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

describe("slack-book-gateway HTTP entrypoints and state transitions", () => {
  test("rejects requests with an invalid Slack signature", async () => {
    const response = await worker.fetch(
      new Request("https://example.test/slack/events", {
        method: "POST",
        headers: {
          "x-slack-request-timestamp": `${Math.floor(Date.now() / 1000)}`,
          "x-slack-signature": "v0=invalid"
        },
        body: JSON.stringify({ type: "url_verification", challenge: "challenge-value" })
      }),
      env as never,
      createExecutionContext().ctx
    );

    assert.strictEqual(response.status, 401);
  });

  test("responds to Slack Events API URL verification challenge", async () => {
    const body = JSON.stringify({ type: "url_verification", challenge: "challenge-value" });
    const response = await worker.fetch(await signedRequest("/slack/events", body, "application/json"), env as never, createExecutionContext().ctx);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(await response.text(), "challenge-value");
  });

  test("opens the book request modal from slash command with Slack real_name as the default applicant name", async () => {
    const calls = installFetchMock();
    const commandBody = new URLSearchParams({
      trigger_id: "trigger-123",
      user_id: "U_REQUESTER",
      user_name: "requester",
      channel_id: "C0B5FKHTTCK"
    }).toString();

    const response = await worker.fetch(await signedRequest("/slack/commands", commandBody), env as never, createExecutionContext().ctx);
    const result = (await response.json()) as { text: string };
    const modalCall = calls.findSlack("views.open");
    const applicantBlock = modalCall.body.view.blocks[0];
    const metadata = JSON.parse(modalCall.body.view.private_metadata);

    assert.strictEqual(response.status, 200);
    assert.match(result.text, /申請フォームを開きました/u);
    assert.strictEqual(applicantBlock.element.initial_value, "杉本光一");
    assert.strictEqual(metadata.slackDisplayName, "杉本光一");
  });

  test("does not open the book request modal from slash command outside the configured channel", async () => {
    const calls = installFetchMock();
    const commandBody = new URLSearchParams({
      trigger_id: "trigger-123",
      user_id: "U_REQUESTER",
      user_name: "requester",
      channel_id: "C_OTHER"
    }).toString();

    const response = await worker.fetch(await signedRequest("/slack/commands", commandBody), env as never, createExecutionContext().ctx);
    const result = (await response.json()) as { text: string };

    assert.strictEqual(response.status, 200);
    assert.match(result.text, /対象チャンネル/u);
    assert.strictEqual(calls.slack("views.open").length, 0);
  });

  test("does not post the setup launcher outside the configured book request channel", async () => {
    const calls = installFetchMock();
    const commandBody = new URLSearchParams({
      trigger_id: "trigger-setup",
      user_id: "U_MANAGER",
      user_name: "manager",
      channel_id: "C_OTHER",
      text: "setup"
    }).toString();

    const response = await worker.fetch(await signedRequest("/slack/commands", commandBody), env as never, createExecutionContext().ctx);
    const result = (await response.json()) as { text: string };

    assert.strictEqual(response.status, 200);
    assert.match(result.text, /対象チャンネル/u);
    assert.strictEqual(calls.slack("chat.postMessage").length, 0);
    assert.strictEqual(calls.slack("pins.add").length, 0);
  });

  test("posts and pins the setup launcher in the configured book request channel", async () => {
    const calls = installFetchMock();
    const commandBody = new URLSearchParams({
      trigger_id: "trigger-setup",
      user_id: "U_MANAGER",
      user_name: "manager",
      channel_id: "C0B5FKHTTCK",
      text: "setup"
    }).toString();

    const response = await worker.fetch(await signedRequest("/slack/commands", commandBody), env as never, createExecutionContext().ctx);
    const result = (await response.json()) as { text: string };
    const launcherCall = calls.findSlack("chat.postMessage");
    const pinCall = calls.findSlack("pins.add");

    assert.strictEqual(response.status, 200);
    assert.match(result.text, /ピン留めしました/u);
    assert.strictEqual(launcherCall.body.channel, "C0B5FKHTTCK");
    assert.strictEqual(launcherCall.body.blocks[1].elements[0].action_id, "open_book_request");
    assert.strictEqual(pinCall.body.channel, "C0B5FKHTTCK");
  });

  test("still posts the setup launcher when Slack pinning fails", async () => {
    const calls = installFetchMock({ pinError: "missing_scope" });
    const originalWarn = console.warn;
    const commandBody = new URLSearchParams({
      trigger_id: "trigger-setup",
      user_id: "U_MANAGER",
      user_name: "manager",
      channel_id: "C0B5FKHTTCK",
      text: "setup"
    }).toString();

    console.warn = () => undefined;
    try {
      const response = await worker.fetch(await signedRequest("/slack/commands", commandBody), env as never, createExecutionContext().ctx);
      const result = (await response.json()) as { text: string };

      assert.strictEqual(response.status, 200);
      assert.match(result.text, /ピン留めはできませんでした（missing_scope）/u);
      assert.strictEqual(calls.slack("chat.postMessage").length, 1);
      assert.strictEqual(calls.slack("pins.add").length, 1);
    } finally {
      console.warn = originalWarn;
    }
  });

  test("creates a Slack status board when the request modal is submitted", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const payload = {
      type: "view_submission",
      user: { id: "U_REQUESTER", username: "requester" },
      view: {
        id: "view-1",
        callback_id: "book_request_submit",
        private_metadata: JSON.stringify({
          slackUserId: "U_REQUESTER",
          slackDisplayName: "杉本光一",
          channelId: "C0B5FKHTTCK"
        }),
        state: {
          values: {
            applicant_name: { applicant_name: { value: "杉本光一" } },
            book_title: { book_title: { value: "リーダブルコード" } },
            book_url: { book_url: { value: "https://example.com/book" } },
            target_month: { target_month: { value: "2026-05" } },
            purpose: { purpose: { value: "レビューの質を上げたい" } }
          }
        }
      }
    };

    const response = await postInteraction(payload, ctx);
    await ctx.waitForWaitUntil();

    const updateCall = calls.findSlack("chat.update");
    const historyCall = calls.findSlack("chat.postMessage", (body) => typeof body.thread_ts === "string");
    const actions = actionLabels(updateCall.body.blocks);

    assert.strictEqual(response.status, 200);
    assert.match(updateCall.body.text, /購入承認待ち/u);
    assert.deepStrictEqual(actions, ["購入を承認"]);
    assert.doesNotMatch(JSON.stringify(updateCall.body.blocks), /差し戻し/u);
    assert.match(historyCall.body.text, /申請を受け付けました/u);
  });

  test("advances purchase approval to receipt waiting and records the actor in thread history", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const response = await postInteraction(blockActionPayload("approve_purchase", makeState(), "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    const updateCall = calls.findSlack("chat.update");
    const historyCall = calls.findSlack("chat.postMessage");

    assert.strictEqual(response.status, 200);
    assert.match(updateCall.body.text, /購入・領収書貼付待ち/u);
    assert.deepStrictEqual(actionLabels(updateCall.body.blocks), ["領収書を貼り付けました", "一つ前に戻す"]);
    assert.match(historyCall.body.text, /^<@U_MANAGER> 購入が承認されました/u);
  });

  test("rejects stale state button actions without overwriting the current state", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(
      makeState({
        status: "receipt_waiting",
        previousStatus: "approval_waiting",
        statusHistory: ["approval_waiting"]
      })
    );
    const staleReference = {
      kind: "book-request-state",
      requestId: record.state.requestId,
      version: record.version - 1
    };

    const response = await postInteraction(blockActionPayload("receipt_uploaded", staleReference, "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    const current = env.BOOK_PURCHASE_REQUESTS.getState(record.state.requestId);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(current.status, "receipt_waiting");
    assert.match(calls.findSlack("chat.postMessage").body.text, /古いボタン/u);
  });

  test("rejects legacy full-state button actions once Durable Object state exists", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(
      makeState({
        status: "report_waiting",
        previousStatus: "receipt_review_waiting",
        statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
      })
    );
    const staleFullState = makeState({
      requestId: record.state.requestId,
      status: "receipt_waiting",
      previousStatus: "approval_waiting",
      statusHistory: ["approval_waiting"]
    });

    const response = await postInteraction(blockActionPayload("receipt_uploaded", staleFullState, "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    const current = env.BOOK_PURCHASE_REQUESTS.getState(record.state.requestId);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(current.status, "report_waiting");
    assert.match(calls.findSlack("chat.postMessage").body.text, /古いボタン/u);
  });

  test("undo returns only one action back and preserves the remaining status history", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "report_waiting",
      previousStatus: "receipt_review_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
    });

    const response = await postInteraction(blockActionPayload("undo_state", state, "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    const updateCall = calls.findSlack("chat.update");
    const nextState = firstActionState(updateCall.body.blocks, env.BOOK_PURCHASE_REQUESTS);
    const historyCall = calls.findSlack("chat.postMessage");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(nextState.status, "receipt_review_waiting");
    assert.deepStrictEqual(nextState.statusHistory, ["approval_waiting", "receipt_waiting"]);
    assert.match(historyCall.body.text, /^<@U_MANAGER> 状態を「領収書確認待ち」に戻しました。/u);
  });

  test("completed requests cannot be undone from Slack", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "completed",
      previousStatus: "report_review_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting", "report_waiting", "report_review_waiting"]
    });

    const response = await postInteraction(blockActionPayload("undo_state", state, "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.slack("chat.update").length, 0);
    assert.match(calls.findSlack("chat.postMessage").body.text, /^<@U_MANAGER> 完了済みのため/u);
  });

  test("report submission creates a GitHub PR and moves the request to report review waiting", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "report_waiting",
      previousStatus: "receipt_review_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
    });
    const payload = reportSubmissionPayload(state);

    const response = await postInteraction(payload, ctx);
    await ctx.waitForWaitUntil();

    const prCall = calls.findGitHub("/repos/Saitekiinc-com/saiteki-study-doc/pulls", "POST");
    const labelsCall = calls.findGitHub("/repos/Saitekiinc-com/saiteki-study-doc/issues/231/labels", "POST");
    const updateCall = calls.findSlack("chat.update");
    const nextState = firstActionState(updateCall.body.blocks, env.BOOK_PURCHASE_REQUESTS);
    const historyCall = calls.findSlack("chat.postMessage");

    assert.strictEqual(response.status, 200);
    assert.strictEqual(prCall.body.title, "feat: add book report for リーダブルコード");
    assert.deepStrictEqual(labelsCall.body.labels, ["book-report"]);
    assert.strictEqual(nextState.status, "report_review_waiting");
    assert.strictEqual(nextState.prNumber, 231);
    assert.match(historyCall.body.text, /https:\/\/github\.com\/Saitekiinc-com\/saiteki-study-doc\/pull\/231/u);
    assert.deepStrictEqual(actionLabels(updateCall.body.blocks), ["レポートを編集", "レポートを確認して完了", "PRを開く"]);
    assert.ok(confirmForAction(updateCall.body.blocks, "confirm_report"), "confirm_report should require a confirmation dialog");
  });

  test("report submission failure posts an error back to the Slack thread", async () => {
    const calls = installFetchMock({ failGitHubBlob: true });
    const ctx = createExecutionContext();
    const originalConsoleError = console.error;
    const payload = reportSubmissionPayload(
      makeState({
        status: "report_waiting",
        previousStatus: "receipt_review_waiting",
        statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
      })
    );

    console.error = () => undefined;
    try {
      const response = await postInteraction(payload, ctx);
      await ctx.waitForWaitUntil();

      assert.strictEqual(response.status, 200);
      assert.match(calls.findSlack("chat.postMessage").body.text, /処理中にエラーが発生しました: GitHub API request failed: 500/u);
    } finally {
      console.error = originalConsoleError;
    }
  });

  test("does not create a second report PR from a stale report modal submission", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "report_waiting",
      previousStatus: "receipt_review_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
    });
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(state);
    await env.BOOK_PURCHASE_REQUESTS.save({
      ...state,
      status: "report_review_waiting",
      prNumber: 231,
      prUrl: "https://github.com/Saitekiinc-com/saiteki-study-doc/pull/231",
      prBranch: "book-report/slack-test",
      reportPath: "docs/knowledge_base/book_reports/report.md"
    }, record.version);
    const payload = reportSubmissionPayload({
      kind: "book-request-state",
      requestId: state.requestId,
      version: record.version
    });

    const response = await postInteraction(payload, ctx);
    await ctx.waitForWaitUntil();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.github("/repos/Saitekiinc-com/saiteki-study-doc/pulls", "POST").length, 0);
    assert.match(calls.findSlack("chat.postMessage").body.text, /古いレポートフォーム/u);
  });

  test("recovers the Slack state when final report save conflicts after PR creation", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "report_waiting",
      previousStatus: "receipt_review_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting"]
    });
    const record = await env.BOOK_PURCHASE_REQUESTS.seed(state);
    const payload = reportSubmissionPayload({
      kind: "book-request-state",
      requestId: state.requestId,
      version: record.version
    });

    env.BOOK_PURCHASE_REQUESTS.conflictNextSave();

    const response = await postInteraction(payload, ctx);
    await ctx.waitForWaitUntil();

    const current = env.BOOK_PURCHASE_REQUESTS.getState(state.requestId);

    assert.strictEqual(response.status, 200);
    assert.strictEqual(calls.github("/repos/Saitekiinc-com/saiteki-study-doc/pulls", "POST").length, 1);
    assert.strictEqual(current.status, "report_review_waiting");
    assert.strictEqual(current.prNumber, 231);
    assert.match(calls.findSlack("chat.update").body.text, /レポート確認待ち/u);
  });

  test("confirming the report merges the PR, marks the request completed, and adds a completed reaction", async () => {
    const calls = installFetchMock();
    const ctx = createExecutionContext();
    const state = makeState({
      status: "report_review_waiting",
      previousStatus: "report_waiting",
      statusHistory: ["approval_waiting", "receipt_waiting", "receipt_review_waiting", "report_waiting"],
      prNumber: 231,
      prUrl: "https://github.com/Saitekiinc-com/saiteki-study-doc/pull/231",
      prBranch: "book-report/slack-test"
    });

    const response = await postInteraction(blockActionPayload("confirm_report", state, "U_MANAGER"), ctx);
    await ctx.waitForWaitUntil();

    const updateCall = calls.findSlack("chat.update");
    const historyCall = calls.findSlack("chat.postMessage");

    assert.strictEqual(response.status, 200);
    assert.ok(calls.findGitHub("/repos/Saitekiinc-com/saiteki-study-doc/pulls/231/merge", "PUT"));
    assert.match(updateCall.body.text, /完了/u);
    assert.deepStrictEqual(actionLabels(updateCall.body.blocks), []);
    assert.strictEqual(calls.findSlack("reactions.add").body.name, "white_check_mark");
    assert.match(historyCall.body.text, /^<@U_MANAGER> レポートを確認し、PR #231 をマージしました/u);
  });
});

async function postInteraction(payload: unknown, ctx = createExecutionContext()): Promise<Response> {
  const body = new URLSearchParams({ payload: JSON.stringify(payload) }).toString();
  return worker.fetch(await signedRequest("/slack/interactions", body), env as never, ctx.ctx);
}
