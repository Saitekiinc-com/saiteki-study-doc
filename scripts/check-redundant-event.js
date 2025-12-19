
function checkRedundantEvent({ context, core }) {
  console.log(`Checking for redundant event. Action: ${context.payload.action}`);

  // If the event is 'labeled', check if the issue was created very recently.
  // If so, we assume the 'opened' trigger already handled it, and this is a duplicate.
  if (context.payload.action === 'labeled') {
    const created_at_iso = context.payload.issue.created_at;
    if (!created_at_iso) {
      console.log('No created_at found in payload. Proceeding.');
      core.setOutput('skip', 'false');
      return;
    }

    const created_at = new Date(created_at_iso).getTime();
    const now = Date.now();
    const diff = now - created_at; // milliseconds

    console.log(`Issue created at: ${created_at_iso} (${diff}ms ago)`);

    // If created within last 60 seconds, skip.
    if (diff < 60000) {
       console.log(`Issue created ${diff}ms ago. Skipping 'labeled' event to avoid duplicate run with 'opened'.`);
       core.setOutput('skip', 'true');
       return;
    }
  }

  core.setOutput('skip', 'false');
}

module.exports = { checkRedundantEvent };
