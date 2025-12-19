
/**
 * Renames the issue based on the objective and user name.
 *
 * @param {Object} params
 * @param {Object} params.github - The GitHub API client
 * @param {Object} params.context - The GitHub Actions context
 * @param {Object} params.core - The Actions core library
 * @param {string} params.userName - The display name of the user
 * @param {string} params.objective - The user's objective
 */
async function renameIssue({ github, context, core, userName, objective }) {
  const issue_number = context.payload.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Format: 📚 書籍探索: {Objective} ({UserName}さん)
  // Ensure the title is not too long? GitHub limits to 256 chars.
  // Maybe truncate objective?

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
