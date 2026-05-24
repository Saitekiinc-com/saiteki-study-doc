import type { BookReportMetadata } from "./format";

export type RequestStateRecord = {
  state: BookReportMetadata;
  version: number;
  updatedAtIso: string;
  reportSubmissionLockedAtIso?: string;
};

type SaveStateRequest = {
  state: BookReportMetadata;
  expectedVersion?: number;
};

type StateResponse =
  | {
      ok: true;
      record: RequestStateRecord | null;
    }
  | {
      ok: false;
      error: string;
      record?: RequestStateRecord | null;
    };

export class BookPurchaseRequestState {
  constructor(private readonly durableState: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    const action = new URL(request.url).pathname.replace(/^\/+/u, "");
    const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};

    if (action === "get") {
      return jsonResponse({ ok: true, record: await this.readRecord() });
    }

    if (action === "seed") {
      const existing = await this.readRecord();
      if (existing) {
        return jsonResponse({ ok: true, record: existing });
      }

      return jsonResponse({ ok: true, record: await this.writeRecord((body as SaveStateRequest).state, 0) });
    }

    if (action === "save") {
      const { state, expectedVersion } = body as SaveStateRequest;
      const existing = await this.readRecord();
      if (existing && expectedVersion !== undefined && existing.version !== expectedVersion) {
        return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
      }

      return jsonResponse({ ok: true, record: await this.writeRecord(state, existing?.version || 0) });
    }

    if (action === "lock-report-submission") {
      const { expectedVersion } = body as { expectedVersion?: number };
      const existing = await this.readRecord();
      if (!existing) {
        return jsonResponse({ ok: false, error: "state_not_found" }, 404);
      }

      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
      }

      if (existing.state.status !== "report_waiting" || existing.reportSubmissionLockedAtIso) {
        return jsonResponse({ ok: false, error: "report_submission_not_available", record: existing }, 409);
      }

      return jsonResponse({
        ok: true,
        record: await this.writeRecord(existing.state, existing.version, new Date().toISOString())
      });
    }

    if (action === "clear-report-submission-lock") {
      const { expectedVersion } = body as { expectedVersion?: number };
      const existing = await this.readRecord();
      if (!existing) {
        return jsonResponse({ ok: false, error: "state_not_found" }, 404);
      }

      if (expectedVersion !== undefined && existing.version !== expectedVersion) {
        return jsonResponse({ ok: false, error: "version_conflict", record: existing }, 409);
      }

      return jsonResponse({ ok: true, record: await this.writeRecord(existing.state, existing.version, undefined) });
    }

    return jsonResponse({ ok: false, error: "not_found" }, 404);
  }

  private async readRecord(): Promise<RequestStateRecord | null> {
    return (await this.durableState.storage.get<RequestStateRecord>("state")) || null;
  }

  private async writeRecord(state: BookReportMetadata, previousVersion: number, reportSubmissionLockedAtIso?: string): Promise<RequestStateRecord> {
    const record: RequestStateRecord = {
      state,
      version: previousVersion + 1,
      updatedAtIso: new Date().toISOString(),
      reportSubmissionLockedAtIso
    };
    await this.durableState.storage.put("state", record);
    return record;
  }
}

export async function getRequestState(env: Env, requestId: string): Promise<RequestStateRecord | null> {
  const result = await requestStateRequest(env, requestId, "get", {});
  if (result.ok) {
    return result.record;
  }

  throw new Error(`Request state get failed: ${result.error}`);
}

export async function seedRequestState(env: Env, state: BookReportMetadata): Promise<RequestStateRecord> {
  const result = await requestStateRequest(env, state.requestId, "seed", { state });
  if (result.ok && result.record) {
    return result.record;
  }

  throw new Error(`Request state seed failed: ${result.ok ? "empty_record" : result.error}`);
}

export async function saveRequestState(
  env: Env,
  state: BookReportMetadata,
  expectedVersion?: number
): Promise<{ ok: true; record: RequestStateRecord } | { ok: false; error: string; record?: RequestStateRecord | null }> {
  const result = await requestStateRequest(env, state.requestId, "save", { state, expectedVersion });
  if (result.ok) {
    if (result.record) {
      return { ok: true, record: result.record };
    }

    throw new Error("Request state save failed: empty_record");
  }

  return result;
}

export async function lockReportSubmission(
  env: Env,
  requestId: string,
  expectedVersion?: number
): Promise<{ ok: true; record: RequestStateRecord } | { ok: false; error: string; record?: RequestStateRecord | null }> {
  const result = await requestStateRequest(env, requestId, "lock-report-submission", { expectedVersion });
  if (result.ok) {
    if (result.record) {
      return { ok: true, record: result.record };
    }

    throw new Error("Request state lock-report-submission failed: empty_record");
  }

  return result;
}

export async function clearReportSubmissionLock(env: Env, requestId: string, expectedVersion?: number): Promise<void> {
  const result = await requestStateRequest(env, requestId, "clear-report-submission-lock", { expectedVersion });
  if (!result.ok) {
    throw new Error(`Request state clear-report-submission-lock failed: ${result.error}`);
  }
}

async function requestStateRequest(env: Env, requestId: string, action: string, body: unknown): Promise<StateResponse> {
  const namespace = env.BOOK_PURCHASE_REQUESTS;
  const stub =
    typeof namespace.getByName === "function"
      ? namespace.getByName(requestId)
      : namespace.get(namespace.idFromName(requestId));
  const response = await stub.fetch(`https://book-purchase-request-state/${action}`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  });
  const result = (await response.json()) as StateResponse;

  if (response.ok || !result.ok) {
    return result;
  }

  return { ok: false, error: "unknown_error" };
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
