import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';

type Octokit = ReturnType<typeof github.getOctokit>;

type RenameParams = {
  github: Octokit;
  context: Context;
  core: typeof core;
  userName: string;
  objective: string;
};

/**
 * 目標とユーザー名に基づいて Issue のタイトルを変更します。
 */
export async function renameIssue({ github: octokit, context, core, userName, objective }: RenameParams) {
  const issue_number = context.payload.issue?.number;
  if (!issue_number) {
    throw new Error('コンテキストに Issue 番号が見つかりません');
  }
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // フォーマット: 📚 書籍探索: {Objective} ({UserName}さん)
  // タイトルが長くなりすぎないか確認が必要ですか？ GitHubの制限は256文字です。
  // 目標を切り詰める必要があるかもしれません。

  const title = `📚 書籍探索: ${objective} (${userName}さん)`;

  console.log(`Issue #${issue_number} のタイトルを以下に変更します: ${title}`);

  try {
    await octokit.rest.issues.update({
      owner,
      repo,
      issue_number,
      title
    });
    console.log('Issue 名の変更に成功しました。');
  } catch (error: any) {
    console.error('Issue 名の変更に失敗しました:', error);
    core.setFailed(`Issue 名の変更に失敗しました: ${error.message}`);
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

    // 元の github-script では引数として渡されていましたが、
    // CLI スクリプトとして実行するため、環境変数から値を取得します。
    // workflow ファイル側で env コンテキストを使用して値を渡す必要があります。

    const userName = process.env.USER_NAME;
    const objective = process.env.OBJECTIVE;

    if (!userName || !objective) {
      throw new Error('USER_NAME および OBJECTIVE 環境変数が必要です');
    }

    await renameIssue({ github: octokit, context, core, userName, objective });

  } catch (error: any) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}
