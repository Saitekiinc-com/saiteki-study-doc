interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  GITHUB_TOKEN: string;
  BOOK_PURCHASE_REQUESTS: DurableObjectNamespace;
}
