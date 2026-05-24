import type { BookReportMetadata } from "./format";
import { getRequestState, seedRequestState } from "./request-state";
import {
  compactState,
  hydrateStateFromPayload,
  isStateReference,
  parseStateActionValue,
  type StateActionValue
} from "./state";
import type { SlackInteractionPayload } from "./types";

export type LoadedState = {
  state: BookReportMetadata;
  version: number;
  stale: boolean;
};

export async function loadActionState(env: Env, payload: SlackInteractionPayload): Promise<LoadedState> {
  const actionValue = parseStateActionValue(payload.actions?.[0]?.value);
  if (!actionValue) {
    throw new Error("Slackボタンの状態情報を読み取れませんでした。");
  }

  return loadStateFromActionValue(env, actionValue, payload);
}

export async function loadViewState(env: Env, payload: SlackInteractionPayload): Promise<LoadedState> {
  const actionValue = parseStateActionValue(payload.view?.private_metadata);
  if (!actionValue) {
    throw new Error("レポート提出元の申請情報が見つかりませんでした。");
  }

  return loadStateFromActionValue(env, actionValue, payload);
}

export async function stateForError(env: Env, payload: SlackInteractionPayload): Promise<BookReportMetadata | null> {
  const actionValue = parseStateActionValue(payload.actions?.[0]?.value || payload.view?.private_metadata);
  if (!actionValue) {
    return null;
  }

  if (isStateReference(actionValue)) {
    const record = await getRequestState(env, actionValue.requestId).catch(() => null);
    return record?.state || null;
  }

  return compactState(hydrateStateFromPayload(actionValue, payload));
}

async function loadStateFromActionValue(env: Env, actionValue: StateActionValue, payload: SlackInteractionPayload): Promise<LoadedState> {
  if (isStateReference(actionValue)) {
    const record = await getRequestState(env, actionValue.requestId);
    if (!record) {
      throw new Error("保存済みの申請状態が見つかりませんでした。");
    }

    return {
      state: compactState(hydrateStateFromPayload(record.state, payload)),
      version: record.version,
      stale: actionValue.version !== record.version
    };
  }

  const hydratedState = compactState(hydrateStateFromPayload(actionValue, payload));
  const existing = await getRequestState(env, hydratedState.requestId);
  if (existing) {
    return {
      state: compactState(hydrateStateFromPayload(existing.state, payload)),
      version: existing.version,
      stale: true
    };
  }

  const record = await seedRequestState(env, hydratedState);
  return {
    state: record.state,
    version: record.version,
    stale: false
  };
}
