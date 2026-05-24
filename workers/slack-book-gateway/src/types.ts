import type { BookReportMetadata } from "./format";

export type SlackCommand = {
  trigger_id: string;
  user_id: string;
  user_name?: string;
  channel_id?: string;
  text?: string;
};

export type SlackUser = {
  id: string;
  username?: string;
  name?: string;
};

export type SlackContainer = {
  channel_id?: string;
  message_ts?: string;
  thread_ts?: string;
};

export type SlackAction = {
  action_id: string;
  value?: string;
};

export type SlackView = {
  id: string;
  callback_id: string;
  private_metadata?: string;
  state?: {
    values?: Record<string, Record<string, { value?: string }>>;
  };
};

export type SlackInteractionPayload = {
  type: "block_actions" | "view_submission" | "shortcut";
  callback_id?: string;
  trigger_id?: string;
  user: SlackUser;
  channel?: {
    id: string;
  };
  container?: SlackContainer;
  actions?: SlackAction[];
  view?: SlackView;
};

export type SlackApiResponse = {
  ok: boolean;
  error?: string;
};

export type SlackPostMessageResponse = SlackApiResponse & {
  channel?: string;
  ts?: string;
};

export type SlackProfile = {
  real_name?: string;
  real_name_normalized?: string;
  display_name?: string;
  display_name_normalized?: string;
  first_name?: string;
  last_name?: string;
};

export type SlackUserInfoResponse = SlackApiResponse & {
  user?: {
    id: string;
    name?: string;
    real_name?: string;
    profile?: SlackProfile;
  };
};

export type SlackUserProfileResponse = SlackApiResponse & {
  profile?: SlackProfile;
};

export type GitHubRepository = {
  default_branch: string;
};

export type GitHubRef = {
  object: {
    sha: string;
  };
};

export type GitHubCommit = {
  sha: string;
  tree: {
    sha: string;
  };
};

export type GitHubBlob = {
  sha: string;
};

export type GitHubTree = {
  sha: string;
};

export type GitHubPullRequest = {
  number: number;
  html_url: string;
  head: {
    ref: string;
  };
};

export type CreatedReportPullRequest = GitHubPullRequest & {
  reportPath: string;
};

export type SlackBlock = Record<string, unknown>;

export type StatefulSlackBlock = SlackBlock & {
  value?: string;
  state?: BookReportMetadata;
};
