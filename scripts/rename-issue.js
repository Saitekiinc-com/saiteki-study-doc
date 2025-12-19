
/**
 * 目標とユーザー名に基づいて Issue のタイトルを変更します。
 *
 * @param {Object} params
 * @param {Object} params.github - GitHub API クライアント
 * @param {Object} params.context - GitHub Actions コンテキスト
 * @param {Object} params.core - Actions core ライブラリ
 * @param {string} params.userName - ユーザーの表示名
 * @param {string} params.objective - ユーザーの目標
 */
async function renameIssue({ github, context, core, userName, objective }) {
  const issue_number = context.payload.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // フォーマット: 📚 書籍探索: {Objective} ({UserName}さん)
  // タイトルが長くなりすぎないか確認が必要ですか？ GitHubの制限は256文字です。
  // 目標を切り詰める必要があるかもしれません。

  const title = `📚 書籍探索: ${objective} (${userName}さん)`;

  console.log(`Renaming issue #${issue_number} to: ${title}`);

  try {
    await github.rest.issues.update({
      owner,
      repo,
      issue_number,
      title
    });
    console.log('Successfully renamed issue.');
  } catch (error) {
    console.error('Failed to rename issue:', error);
    core.setFailed(`Failed to rename issue: ${error.message}`);
  }
}

module.exports = { renameIssue };
