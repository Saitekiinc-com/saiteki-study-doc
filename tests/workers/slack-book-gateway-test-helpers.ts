import assert from "node:assert";

export type MockCall = {
  url: string;
  method: string;
  body: any;
};

type MockStateRecord = {
  state: any;
  version: number;
  updatedAtIso: string;
  reportSubmissionLockedAtIso?: string;
};

export type MockStateNamespace = ReturnType<typeof createMockStateNamespace>;

export async function signedRequest(pathname: string, body: string, contentType = "application/x-www-form-urlencoded"): Promise<Request> {
  const timestamp = `${Math.floor(Date.now() / 1000)}`;
  const signature = await slackSignature(timestamp, body);
  return new Request(`https://example.test${pathname}`, {
    method: "POST",
    headers: {
      "content-type": contentType,
      "x-slack-request-timestamp": timestamp,
      "x-slack-signature": signature
    },
    body
  });
}

export function createExecutionContext(): {
  ctx: ExecutionContext;
  waitForWaitUntil: () => Promise<unknown[]>;
} {
  const promises: Promise<unknown>[] = [];
  return {
    ctx: {
      waitUntil(promise: Promise<unknown>) {
        promises.push(Promise.resolve(promise));
      },
      passThroughOnException() {
        // no-op for tests
      }
    } as ExecutionContext,
    waitForWaitUntil: () => Promise.all(promises)
  };
}

export function installFetchMock(options: { failGitHubBlob?: boolean; pinError?: string } = {}) {
  const calls: MockCall[] = [];

  globalThis.fetch = (async (input: any, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.url;
    const method = init?.method || "GET";
    const body = parseBody(init?.body);
    calls.push({ url, method, body });

    if (url.startsWith("https://slack.com/api/")) {
      const slackMethod = url.replace("https://slack.com/api/", "").split("?")[0];
      if (slackMethod === "users.profile.get") {
        return jsonResponse({ ok: true, profile: { real_name: "杉本光一", real_name_normalized: "meiguang2world" } });
      }
      if (slackMethod === "users.info") {
        return jsonResponse({
          ok: true,
          user: {
            id: "U_REQUESTER",
            name: "meiguang2world",
            real_name: "杉本光一",
            profile: { real_name: "杉本光一" }
          }
        });
      }
      if (slackMethod === "chat.postMessage") {
        return jsonResponse({ ok: true, channel: body.channel || "C0B5FKHTTCK", ts: body.thread_ts ? "1710000001.000000" : "1710000000.000000" });
      }
      if (slackMethod === "pins.add" && options.pinError) {
        return jsonResponse({ ok: false, error: options.pinError });
      }
      if (["views.open", "chat.update", "pins.add", "reactions.add"].includes(slackMethod)) {
        return jsonResponse({ ok: true });
      }
      return jsonResponse({ ok: true });
    }

    if (url.startsWith("https://api.github.com")) {
      const githubPath = new URL(url).pathname;
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc" && method === "GET") {
        return jsonResponse({ default_branch: "main" });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/ref/heads/main" && method === "GET") {
        return jsonResponse({ object: { sha: "base-sha" } });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/commits/base-sha" && method === "GET") {
        return jsonResponse({ sha: "base-sha", tree: { sha: "base-tree-sha" } });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/blobs" && method === "POST") {
        return options.failGitHubBlob ? jsonResponse({ message: "blob failed" }, 500) : jsonResponse({ sha: "blob-sha" });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/trees" && method === "POST") {
        return jsonResponse({ sha: "tree-sha" });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/commits" && method === "POST") {
        return jsonResponse({ sha: "commit-sha", tree: { sha: "tree-sha" } });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/git/refs" && method === "POST") {
        return jsonResponse({ object: { sha: "commit-sha" } });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/pulls" && method === "POST") {
        return jsonResponse({
          number: 231,
          html_url: "https://github.com/Saitekiinc-com/saiteki-study-doc/pull/231",
          head: { ref: "book-report/slack-test" }
        });
      }
      if (githubPath === "/repos/Saitekiinc-com/saiteki-study-doc/pulls/231/merge" && method === "PUT") {
        return jsonResponse({ merged: true, sha: "merge-sha" });
      }
    }

    return jsonResponse({ message: `Unhandled mock fetch: ${url}` }, 500);
  }) as typeof fetch;

  return {
    all: calls,
    slack(method: string) {
      return calls.filter((call) => call.url.startsWith(`https://slack.com/api/${method}`));
    },
    findSlack(method: string, predicate: (body: any) => boolean = () => true) {
      const call = this.slack(method).find((candidate) => predicate(candidate.body));
      assert.ok(call, `Expected Slack API call: ${method}`);
      return call;
    },
    github(path: string, method?: string) {
      return calls.filter((call) => call.url === `https://api.github.com${path}` && (!method || call.method === method));
    },
    findGitHub(path: string, method?: string) {
      const call = this.github(path, method)[0];
      assert.ok(call, `Expected GitHub API call: ${method || "*"} ${path}`);
      return call;
    }
  };
}

export function makeState(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "book-2026-05-test",
    slackUserId: "U_REQUESTER",
    slackDisplayName: "杉本光一",
    bookTitle: "リーダブルコード",
    bookUrl: "https://example.com/book",
    purpose: "レビューの質を上げたい",
    targetMonth: "2026-05",
    channelId: "C0B5FKHTTCK",
    messageTs: "1710000000.000000",
    threadTs: "1710000000.000000",
    status: "approval_waiting",
    ...overrides
  };
}

export function blockActionPayload(actionId: string, state: unknown, userId: string) {
  return {
    type: "block_actions",
    user: { id: userId, username: "manager" },
    trigger_id: "trigger-action",
    container: {
      channel_id: "C0B5FKHTTCK",
      message_ts: "1710000000.000000",
      thread_ts: "1710000000.000000"
    },
    actions: [
      {
        action_id: actionId,
        value: JSON.stringify(state)
      }
    ]
  };
}

export function reportSubmissionPayload(state: unknown) {
  return {
    type: "view_submission",
    user: { id: "U_REQUESTER", username: "requester" },
    view: {
      id: "view-report",
      callback_id: "book_report_submit",
      private_metadata: JSON.stringify(state),
      state: {
        values: {
          book_title: { book_title: { value: "リーダブルコード" } },
          reporter_name: { reporter_name: { value: "杉本光一" } },
          author: { author: { value: "Dustin Boswell" } },
          link: { link: { value: "https://example.com/book" } },
          objective: { objective: { value: "レビューの質を上げたい" } },
          takeaways: { takeaways: { value: "命名が重要" } },
          application: { application: { value: "レビュー時に名前を見る" } },
          positive: { positive: { value: "具体例が多い" } },
          negative: { negative: { value: "なし" } },
          recommend: { recommend: { value: "コードレビューをする人" } }
        }
      }
    }
  };
}

export function actionLabels(blocks: any[]): string[] {
  return blocks
    .filter((block) => block.type === "actions")
    .flatMap((block) => block.elements || [])
    .map((element) => element.text?.text)
    .filter(Boolean);
}

export function firstActionState(blocks: any[], stateStore: MockStateNamespace): any {
  const actionBlock = blocks.find((block) => block.type === "actions");
  const value = actionBlock?.elements?.find((element: any) => typeof element.value === "string")?.value;
  assert.ok(value, "Expected at least one stateful action value");
  const parsed = JSON.parse(value);
  if (parsed.kind === "book-request-state") {
    return stateStore.getState(parsed.requestId);
  }

  return parsed;
}

export function confirmForAction(blocks: any[], actionId: string): unknown {
  return blocks
    .filter((block) => block.type === "actions")
    .flatMap((block) => block.elements || [])
    .find((element) => element.action_id === actionId)?.confirm;
}

export function createMockStateNamespace() {
  const records = new Map<string, MockStateRecord>();
  let conflictNextSave = false;

  const namespace = {
    clear() {
      records.clear();
      conflictNextSave = false;
    },
    conflictNextSave() {
      conflictNextSave = true;
    },
    getState(requestId: string) {
      const record = this.getRecord(requestId);
      return record.state;
    },
    getRecord(requestId: string) {
      const record = records.get(requestId);
      assert.ok(record, `Expected request state: ${requestId}`);
      return record;
    },
    async seed(state: any) {
      const existing = records.get(state.requestId);
      if (existing) {
        return existing;
      }
      const record = { state, version: 1, updatedAtIso: new Date().toISOString() };
      records.set(state.requestId, record);
      return record;
    },
    async save(state: any, expectedVersion?: number) {
      const existing = records.get(state.requestId);
      if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) {
        return { ok: false, error: "version_conflict", record: existing };
      }
      const record = { state, version: (existing?.version || 0) + 1, updatedAtIso: new Date().toISOString() };
      records.set(state.requestId, record);
      return { ok: true, record };
    },
    getByName(requestId: string) {
      return {
        fetch: async (_url: string, init?: RequestInit) => {
          const action = new URL(_url).pathname.replace(/^\/+/u, "");
          const body = parseBody(init?.body) || {};
          const existing = records.get(requestId);

          if (action === "get") {
            return jsonResponse({ ok: true, record: existing || null });
          }

          if (action === "seed") {
            if (existing) {
              return jsonResponse({ ok: true, record: existing });
            }
            const record = { state: body.state, version: 1, updatedAtIso: new Date().toISOString() };
            records.set(requestId, record);
            return jsonResponse({ ok: true, record });
          }

          if (action === "save") {
            if (existing && conflictNextSave) {
              conflictNextSave = false;
              return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
            }
            if (existing && body.expectedVersion !== undefined && existing.version !== body.expectedVersion) {
              return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
            }
            const record = {
              state: body.state,
              version: (existing?.version || 0) + 1,
              updatedAtIso: new Date().toISOString()
            };
            records.set(requestId, record);
            return jsonResponse({ ok: true, record });
          }

          if (action === "lock-report-submission") {
            if (!existing) {
              return jsonResponse({ ok: false, error: "state_not_found" }, 404);
            }
            if (body.expectedVersion !== undefined && existing.version !== body.expectedVersion) {
              return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
            }
            if (existing.state.status !== "report_waiting" || existing.reportSubmissionLockedAtIso) {
              return jsonResponse({ ok: false, error: "report_submission_not_available", record: existing }, 409);
            }
            const record = {
              state: existing.state,
              version: existing.version + 1,
              updatedAtIso: new Date().toISOString(),
              reportSubmissionLockedAtIso: new Date().toISOString()
            };
            records.set(requestId, record);
            return jsonResponse({ ok: true, record });
          }

          if (action === "clear-report-submission-lock") {
            if (!existing) {
              return jsonResponse({ ok: false, error: "state_not_found" }, 404);
            }
            const record = {
              state: existing.state,
              version: existing.version + 1,
              updatedAtIso: new Date().toISOString()
            };
            records.set(requestId, record);
            return jsonResponse({ ok: true, record });
          }

          return jsonResponse({ ok: false, error: "not_found" }, 404);
        }
      };
    },
    idFromName(requestId: string) {
      return requestId;
    },
    get(requestId: string) {
      return this.getByName(requestId);
    }
  };

  return namespace;
}

async function slackSignature(timestamp: string, body: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode("test-signing-secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`v0:${timestamp}:${body}`));
  return `v0=${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function parseBody(body: BodyInit | null | undefined): any {
  if (typeof body !== "string") {
    return body;
  }
  try {
    return JSON.parse(body);
  } catch {
    return Object.fromEntries(new URLSearchParams(body));
  }
}
