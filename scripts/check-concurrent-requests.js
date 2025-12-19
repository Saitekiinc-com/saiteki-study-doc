/**
 * 同一ユーザーによる同時並行の書籍探索リクエストをチェックします。
 * 重複が見つかった場合、現在の Issue をクローズし、コメントを投稿します。
 *
 * @param {object} args - actions/github-script によって提供される引数。
 * @param {object} args.github - 認証済みの octokit クライアント。
 * @param {object} args.context - github コンテキスト。
 * @param {object} args.core - actions core ライブラリ。
 */
async function checkConcurrentRequests({ github, context, core }) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.issue.number;
  const username = context.payload.issue.user.login;
  const label = 'book-search-request';

  console.log(`Checking concurrent requests for user: ${username}, Issue: ${issue_number}`);

  try {
    // ユーザー作成のオープンな Issue (指定ラベル付き) をリストアップ
    // 注: creator パラメータは Issue を作成したユーザーでフィルタリングします
    const { data: issues } = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      creator: username,
      labels: label,
      per_page: 100
    });

    // *他の* Issue を見つけるために、現在の Issue 自体を除外します
    const otherIssues = issues.filter(issue => issue.number !== issue_number);

    if (otherIssues.length > 0) {
      const previousIssue = otherIssues[0];
      const commentBody = `@${username} さん、すでに進行中の書籍選定依頼があります (${previousIssue.html_url})。\n\n原則としてお一人様1件ずつの対応とさせていただいております。完了してから新しい依頼を作成してください。\n\nこのIssueは自動的にクローズされます。`;

      console.log(`Found duplicate issue: ${previousIssue.number}. Closing current issue ${issue_number}.`);

      // コメントを投稿
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody
      });

      // 現在の Issue をクローズ
      await github.rest.issues.update({
        owner,
        repo,
        issue_number,
        state: 'closed'
      });

      core.setFailed('Concurrent request limit exceeded.');
    } else {
      console.log('No concurrent requests found.');
    }
  } catch (error) {
    console.error('Error in checkConcurrentRequests:', error);
    core.setFailed(`Error checking concurrent requests: ${error.message}`);
  }
}

module.exports = { checkConcurrentRequests };
