import { normalizeBookUrl, type BookReportMetadata } from "./format";

export async function verifySlackRequest(request: Request, rawBody: string, signingSecret: string): Promise<boolean> {
  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");
  if (!timestamp || !signature) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestampSeconds) > 60 * 5) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(signingSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`v0:${timestamp}:${rawBody}`));
  const expected = `v0=${toHex(new Uint8Array(digest))}`;

  return timingSafeEqual(expected, signature);
}

export function parseFormEncoded<T extends Record<string, string | undefined>>(body: string): T {
  return Object.fromEntries(new URLSearchParams(body)) as T;
}

export function currentMonthInJapan(): string {
  return todayInJapan().slice(0, 7);
}

export function todayInJapan(): string {
  return dateInJapan(new Date().toISOString());
}

export function dateInJapan(iso: string): string {
  return new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function slackThreadUrl(state: BookReportMetadata): string {
  const threadTs = state.threadTs || state.messageTs || "";
  const permalinkTs = threadTs.replace(".", "");
  return `https://slack.com/archives/${state.channelId}/p${permalinkTs}`;
}

export function sanitizeFilename(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[\\/:*?"<>|#%{}^~[\]`;]+/gu, "")
      .replace(/\s+/gu, "-")
      .replace(/-+/gu, "-")
      .slice(0, 80)
      .replace(/^-|-$/gu, "") || "book-report"
  );
}

export function sanitizeBranchSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/gu, "-")
      .replace(/\.{2,}/gu, ".")
      .replace(/^-+|-+$/gu, "")
      .slice(0, 80) || "request"
  );
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function compactBookUrl(value: string): string {
  const normalized = normalizeBookUrl(value);
  if (normalized.length <= 1000) {
    return normalized;
  }

  try {
    const url = new URL(normalized);
    url.search = "";
    url.hash = "";
    return url.toString().length <= 1000 ? url.toString() : "";
  } catch {
    return "";
  }
}

export function escapeSlack(value: string): string {
  return value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
}

export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let diff = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    diff |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return diff === 0;
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
