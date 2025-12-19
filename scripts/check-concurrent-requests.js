/**
 * Checks for concurrent open book search requests by the same user.
 * If a duplicate is found, it closes the current issue and posts a comment.
 *
 * @param {object} args - The arguments provided by actions/github-script.
 * @param {object} args.github - The authenticated octokit client.
 * @param {object} args.context - The github context.
 * @param {object} args.core - The actions core library.
 */
async function checkConcurrentRequests({ github, context, core }) {
  const { owner, repo } = context.repo;
  const issue_number = context.payload.issue.number;
  const username = context.payload.issue.user.login;
  const label = 'book-search-request';

  console.log(`Checking concurrent requests for user: ${username}, Issue: ${issue_number}`);

  try {
    // List open issues with the label created by the user
    // Note: creator parameter filters by the user who created the issue
    const { data: issues } = await github.rest.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      creator: username,
      labels: label,
      per_page: 100
    });

    // Filter out the current issue itself to find *other* open issues
    const otherIssues = issues.filter(issue => issue.number !== issue_number);

    if (otherIssues.length > 0) {
      const previousIssue = otherIssues[0];
      const commentBody = `@${username} さん、すでに進行中の書籍選定依頼があります (${previousIssue.html_url})。\n\n原則としてお一人様1件ずつの対応とさせていただいております。完了してから新しい依頼を作成してください。\n\nこのIssueは自動的にクローズされます。`;

      console.log(`Found duplicate issue: ${previousIssue.number}. Closing current issue ${issue_number}.`);

      // Post comment
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: commentBody
      });

      // Close current issue
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
