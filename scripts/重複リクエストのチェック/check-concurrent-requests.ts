import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

type Octokit = ReturnType<typeof github.getOctokit>;

type CheckParams = {
  github: Octokit;
  context: Context;
  core: typeof core;
};

/**
 * 同一ユーザーによる同時並行の書籍探索リクエストをチェックします。
 * 重複が見つかった場合、現在の Issue をクローズし、コメントを投稿します。
 */
export async function checkConcurrentRequests({ github: octokit, context, core }: CheckParams) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.issue?.number;
  const username = context.payload.issue?.user?.login;

  if (!issue_number || !username) {
    throw new Error('コンテキストに Issue 番号またはユーザー名が含まれていません');
  }

  const label = 'book-search-request';

  console.log(`ユーザー ${username} の重複リクエストを確認中... Issue: ${issue_number}`);

  try {
    // ユーザー作成のオープンな Issue (指定ラベル付き) をリストアップ
    // 注: creator パラメータは Issue を作成したユーザーでフィルタリングします
    const { data: issues } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      creator: username,
      labels: label,
      per_page: 100
    });

    // *他の* Issue を見つけるために、現在の Issue 自体を除外します
    const otherIssues = issues.filter((issue: any) => issue.number !== issue_number);

    if (otherIssues.length > 0) {
      const previousIssue = otherIssues[0];
      const commentBody = `@${username} さん、すでに進行中の書籍選定依頼があります (${previousIssue.html_url})。\n\n原則としてお一人様1件ずつの対応とさせていただいております。完了してから新しい依頼を作成してください。\n\nこのIssueは自動的にクローズされます。`;

      console.log(`重複する Issue が見つかりました: ${previousIssue.number}。現在の Issue ${issue_number} をクローズします。`);

      // コメントを投稿
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody
      });

      // 現在の Issue をクローズ
      await octokit.rest.issues.update({
        owner,
        repo,
        issue_number,
        state: 'closed'
      });

      core.setFailed('重複リクエストの制限を超過しました。');
    } else {
      console.log('重複リクエストは見つかりませんでした。');
    }
  } catch (error: any) {
    console.error('checkConcurrentRequests 内でエラーが発生しました:', error);
    core.setFailed(`重複リクエストの確認中にエラーが発生しました: ${error.message}`);
  }
}

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN が必要です');
    }
    const octokit = github.getOctokit(token);
    const context = github.context;

    await checkConcurrentRequests({ github: octokit, context, core });

  } catch (error: any) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}
