import type {
  SlackApiResponse,
  SlackPostMessageResponse,
  SlackProfile,
  SlackUserInfoResponse,
  SlackUserProfileResponse
} from "./types";

export class SlackApiCallError extends Error {
  constructor(
    readonly method: string,
    readonly status: number,
    readonly slackError: string
  ) {
    super(`Slack API ${method} failed: ${status} ${slackError}`);
  }
}

export async function slackApi<T extends SlackApiResponse>(env: Env, method: string, body: unknown): Promise<T> {
  const response = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  });
  const result = (await response.json()) as T;

  if (!response.ok || !result.ok) {
    throw new SlackApiCallError(method, response.status, result.error || "unknown_error");
  }

  return result;
}

export async function pinMessage(env: Env, channelId: string, timestamp: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await slackApi<SlackApiResponse>(env, "pins.add", {
      channel: channelId,
      timestamp
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof SlackApiCallError && error.slackError === "already_pinned") {
      return { ok: true };
    }

    console.warn("Slack API pins.add failed", error);
    return { ok: false, error: error instanceof SlackApiCallError ? error.slackError : "unknown_error" };
  }
}

export async function addCompletedReaction(env: Env, state: { channelId?: string; messageTs?: string }): Promise<void> {
  if (!state.messageTs) {
    return;
  }

  try {
    await slackApi<SlackApiResponse>(env, "reactions.add", {
      channel: state.channelId || env.BOOK_REQUEST_CHANNEL_ID,
      timestamp: state.messageTs,
      name: "white_check_mark"
    });
  } catch (error) {
    console.warn("Slack API reactions.add failed", error);
  }
}

export async function lookupSlackRealName(env: Env, userId: string): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ user: userId });
    const response = await fetch(`https://slack.com/api/users.profile.get?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`
      }
    });
    const result = (await response.json()) as SlackUserProfileResponse;

    if (response.ok && result.ok && result.profile) {
      const realName = selectSlackRealName(result.profile);
      if (realName) {
        return realName;
      }
    } else {
      console.warn(`Slack API users.profile.get failed: ${response.status} ${result.error || "unknown_error"}`);
    }
  } catch (error) {
    console.warn("Slack API users.profile.get lookup failed", error);
  }

  return lookupSlackInfoRealName(env, userId);
}

export async function lookupSlackDisplayName(env: Env, userId: string, fallback: string): Promise<string> {
  try {
    const params = new URLSearchParams({ user: userId });
    const response = await fetch(`https://slack.com/api/users.info?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`
      }
    });
    const result = (await response.json()) as SlackUserInfoResponse;

    if (!response.ok || !result.ok || !result.user) {
      console.warn(`Slack API users.info failed: ${response.status} ${result.error || "unknown_error"}`);
      return fallback;
    }

    return selectSlackDisplayName(result.user, fallback);
  } catch (error) {
    console.warn("Slack API users.info lookup failed", error);
    return fallback;
  }
}

export function selectSlackRealName(profile: SlackProfile | undefined, userRealName?: string): string | undefined {
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
  return firstNonEmail(profile?.real_name, userRealName, fullName);
}

export function selectSlackDisplayName(user: SlackUserInfoResponse["user"] | undefined, fallback: string): string {
  const profile = user?.profile || {};
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

  return (
    firstNonEmail(
      profile.display_name,
      profile.real_name,
      user?.real_name,
      fullName,
      profile.display_name_normalized,
      profile.real_name_normalized,
      user?.name,
      fallback
    ) ||
    firstNonEmpty(
      profile.display_name,
      profile.real_name,
      user?.real_name,
      fullName,
      profile.display_name_normalized,
      profile.real_name_normalized,
      user?.name,
      fallback
    ) ||
    fallback
  );
}

export function normalizeApplicantName(value: string): string {
  return value.trim().replace(/^[@＠]\s*/u, "");
}

async function lookupSlackInfoRealName(env: Env, userId: string): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({ user: userId });
    const response = await fetch(`https://slack.com/api/users.info?${params.toString()}`, {
      headers: {
        authorization: `Bearer ${env.SLACK_BOT_TOKEN}`
      }
    });
    const result = (await response.json()) as SlackUserInfoResponse;

    if (!response.ok || !result.ok || !result.user) {
      console.warn(`Slack API users.info failed: ${response.status} ${result.error || "unknown_error"}`);
      return undefined;
    }

    return selectSlackRealName(result.user.profile, result.user.real_name);
  } catch (error) {
    console.warn("Slack API users.info real_name lookup failed", error);
    return undefined;
  }
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value));
}

function firstNonEmail(...values: Array<string | undefined>): string | undefined {
  return values
    .map((value) => value?.trim())
    .find((value): value is string => typeof value === "string" && value.length > 0 && !isEmailLike(value));
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.trim());
}
