import { buildBookReportMarkdown, type BookReportInput, type BookReportMetadata } from "./format";
import type { CreatedReportPullRequest, GitHubBlob, GitHubCommit, GitHubPullRequest, GitHubRef, GitHubRepository, GitHubTree } from "./types";
import { dateInJapan, sanitizeBranchSegment, sanitizeFilename, slackThreadUrl } from "./utils";

export async function createBookReportPullRequest(
  env: Env,
  report: BookReportInput,
  state: BookReportMetadata
): Promise<CreatedReportPullRequest> {
  const sourceUrl = slackThreadUrl(state);
  const date = dateInJapan(report.submittedAtIso);
  const markdown = buildBookReportMarkdown(report, sourceUrl, date);
  const reportPath = `docs/knowledge_base/book_reports/${date}-${sanitizeFilename(report.slackDisplayName)}-${sanitizeFilename(report.bookTitle)}-${state.requestId.slice(-8)}.md`;
  const branch = `book-report/slack-${sanitizeBranchSegment(state.requestId)}-${Date.now()}`;

  const repo = await githubRequest<GitHubRepository>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`, {
    method: "GET"
  });
  const baseBranch = repo.default_branch || "main";
  const baseRef = await githubRequest<GitHubRef>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/ref/heads/${baseBranch}`, {
    method: "GET"
  });
  const baseCommit = await githubRequest<GitHubCommit>(
    env,
    `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/commits/${baseRef.object.sha}`,
    {
      method: "GET"
    }
  );
  const blob = await githubRequest<GitHubBlob>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/blobs`, {
    method: "POST",
    body: JSON.stringify({
      content: markdown,
      encoding: "utf-8"
    })
  });
  const tree = await githubRequest<GitHubTree>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: [
        {
          path: reportPath,
          mode: "100644",
          type: "blob",
          sha: blob.sha
        }
      ]
    })
  });
  const newCommit = await githubRequest<GitHubCommit>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: `feat: add book report for ${report.bookTitle}`,
      tree: tree.sha,
      parents: [baseRef.object.sha]
    })
  });

  await githubRequest<GitHubRef>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: newCommit.sha
    })
  });

  const pullRequest = await githubRequest<GitHubPullRequest>(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `feat: add book report for ${report.bookTitle}`,
      head: branch,
      base: baseBranch,
      body: [
        "Slackから提出された書籍レポートです。",
        "",
        `- 申請者: ${report.slackDisplayName} (<@${report.slackUserId}>)`,
        `- Slack thread: ${sourceUrl}`,
        `- Request ID: ${state.requestId}`
      ].join("\n")
    })
  });

  return {
    ...pullRequest,
    reportPath
  };
}

export async function mergePullRequest(env: Env, state: BookReportMetadata): Promise<void> {
  await githubRequest(env, `/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/pulls/${state.prNumber}/merge`, {
    method: "PUT",
    body: JSON.stringify({
      commit_title: `merge: add book report for ${state.bookTitle}`,
      merge_method: "squash"
    })
  });
}

async function githubRequest<T>(env: Env, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "content-type": "application/json",
      "user-agent": "slack-book-gateway",
      "x-github-api-version": "2022-11-28",
      ...init.headers
    }
  });

  if (!response.ok) {
    await response.text();
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
