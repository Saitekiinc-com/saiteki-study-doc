/// <reference path="./worker-configuration.d.ts" />
/// <reference path="./secrets.d.ts" />

import { slackCommandFromPayload } from "./state";
import type { SlackCommand, SlackInteractionPayload } from "./types";
import { json, parseFormEncoded, verifySlackRequest } from "./utils";
import { postLauncherMessage } from "./launcher";
import { handleInteraction, handleInteractionError, openBookReportModal, openBookRequestModal } from "./workflow";

export { BookPurchaseRequestState } from "./request-state";
export { normalizeApplicantName, selectSlackDisplayName, selectSlackRealName } from "./slack";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true });
    }

    if (!["/slack/commands", "/slack/interactions", "/slack/events"].includes(url.pathname)) {
      return new Response("Not found", { status: 404 });
    }

    const rawBody = await request.text();
    const verified = await verifySlackRequest(request, rawBody, env.SLACK_SIGNING_SECRET);
    if (!verified) {
      return new Response("Invalid Slack signature", { status: 401 });
    }

    if (url.pathname === "/slack/commands" && request.method === "POST") {
      return handleSlackCommand(rawBody, env);
    }

    if (url.pathname === "/slack/interactions" && request.method === "POST") {
      return handleSlackInteraction(rawBody, env, ctx);
    }

    if (url.pathname === "/slack/events" && request.method === "POST") {
      return handleSlackEvent(rawBody);
    }

    return new Response("Method not allowed", { status: 405 });
  }
};

async function handleSlackCommand(rawBody: string, env: Env): Promise<Response> {
  const command = parseFormEncoded<SlackCommand>(rawBody);
  if (command.channel_id && command.channel_id !== env.BOOK_REQUEST_CHANNEL_ID) {
    const commandText = command.text?.trim();
    return json({
      response_type: "ephemeral",
      text:
        commandText === "setup"
          ? "申請ボタン付きの案内は書籍購入補助チャンネルでだけ作成できます。対象チャンネルで /book setup を実行してください。"
          : "書籍購入補助の申請は対象チャンネルでだけ利用できます。対象チャンネルで /book を実行してください。"
    });
  }

  if (command.text?.trim() === "setup") {
    const launcherPostResult = await postLauncherMessage(env, command.channel_id || env.BOOK_REQUEST_CHANNEL_ID);
    return json({
      response_type: "ephemeral",
      text: launcherPostResult.pinned
        ? "申請ボタン付きの案内を投稿し、チャンネルにピン留めしました。"
        : `申請ボタン付きの案内を投稿しました。ただしピン留めはできませんでした（${launcherPostResult.pinError || "unknown_error"}）。Slack Appに pins:write を追加して再インストール後、必要なら /book setup を再実行してください。`
    });
  }

  await openBookRequestModal(env, command.trigger_id, command);
  return json({
    response_type: "ephemeral",
    text: "申請フォームを開きました。"
  });
}

async function handleSlackInteraction(rawBody: string, env: Env, ctx: ExecutionContext): Promise<Response> {
  const form = parseFormEncoded<{ payload: string }>(rawBody);
  const payload = JSON.parse(form.payload) as SlackInteractionPayload;
  const actionId = payload.actions?.[0]?.action_id;

  if (payload.type === "shortcut" && payload.callback_id === "open_book_request" && payload.trigger_id) {
    await openBookRequestModal(env, payload.trigger_id, slackCommandFromPayload(payload));
    return new Response("", { status: 200 });
  }

  if (payload.type === "block_actions" && actionId === "open_book_request" && payload.trigger_id) {
    await openBookRequestModal(env, payload.trigger_id, slackCommandFromPayload(payload));
    return new Response("", { status: 200 });
  }

  if (payload.type === "block_actions" && actionId === "open_book_report") {
    await openBookReportModal(env, payload);
    return new Response("", { status: 200 });
  }

  ctx.waitUntil(handleInteraction(payload, env).catch((error) => handleInteractionError(env, payload, error)));
  return new Response("", { status: 200 });
}

function handleSlackEvent(rawBody: string): Response {
  const envelope = JSON.parse(rawBody) as { type?: string; challenge?: string };
  if (envelope.type === "url_verification" && envelope.challenge) {
    return new Response(envelope.challenge, {
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  return json({ ok: true });
}
