import { pinMessage, slackApi } from "./slack";
import { mrkdwn, plainText } from "./state";
import type { SlackApiResponse, SlackPostMessageResponse } from "./types";

export async function postLauncherMessage(
  env: Env,
  channelId: string
): Promise<{ channel: string; ts: string; pinned: boolean; pinError?: string }> {
  const postResult = await slackApi<SlackPostMessageResponse>(env, "chat.postMessage", {
    channel: channelId,
    text: "書籍購入補助の申請はこちらから行えます。",
    blocks: [
      {
        type: "section",
        text: mrkdwn("*書籍購入補助*\n本の購入申請はこのボタンから行えます。")
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: plainText("書籍購入補助を申請する"),
            action_id: "open_book_request",
            value: "open_book_request",
            style: "primary"
          }
        ]
      }
    ]
  });

  const postedChannel = postResult.channel || channelId;
  if (!postResult.ts) {
    throw new Error("Slack launcher message was posted without a timestamp.");
  }

  const pinResult = await pinMessage(env, postedChannel, postResult.ts);
  return {
    channel: postedChannel,
    ts: postResult.ts,
    pinned: pinResult.ok,
    pinError: pinResult.ok ? undefined : pinResult.error
  };
}
