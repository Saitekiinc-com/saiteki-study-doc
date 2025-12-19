
/**
 * Syncs the checkboxes in the issue body with the issue labels.
 * Also appends the status checklist if it's missing.
 *
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - Actions context
 * @param {Object} params.core - Actions core
 */
async function syncLabels({ github, context, core }) {
  const issue_number = context.payload.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // Fetch latest issue data to avoid race conditions with local payload
  const { data: issue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number
  });

  let body = issue.body || '';
  const currentLabels = issue.labels.map(l => l.name);
  let bodyChanged = false;

  const STATUS_HEADER = '## ステータス管理 (Status)';
  const CHECKBOX_RECEIPT = '- [ ] 領収書を添付した';
  const CHECKBOX_APPROVED = '- [ ] 承認済み';

  // NOTE: We do not support mixed states properly if we blindly append.
  // But strictly speaking, if header is missing, we append.

  if (!body.includes(STATUS_HEADER)) {
    console.log('Status section missing. Appending...');
    body += `\n\n${STATUS_HEADER}\n以下のチェックボックスは、進捗に応じてチェックを入れてください。\n${CHECKBOX_RECEIPT}\n${CHECKBOX_APPROVED}`;
    bodyChanged = true;
  }

  // --- Bidirectional Sync Logic ---

  // 1. Checkboxes -> Labels (If checkbox is checked in body, ensure label exists)
  const isReceiptChecked = body.includes('- [x] 領収書を添付した');
  const isApprovedChecked = body.includes('- [x] 承認済み');

  const labelsToAdd = [];
  const labelsToRemove = [];

  // 2. Labels -> Checkboxes (If label exists, ensure checkbox is checked)
  // This logic is tricky. If user JUST clicked checkbox, body has [x]. Label needs to be added.
  // If user JUST added label, body has [ ]. Checkbox needs to be updated to [x].
  // We prioritize the EVENT source if possible, but here we just sync state.
  // "True" state is easier to treat as union? Or prioritize one?
  // User said "勝手にチェックされる" (Automatically checked).
  // This implies: Label was present -> Checkbox got checked.
  // IF the label was NOT present, but workflow added it?

  // Let's implement robust sync:
  // - If Checkbox is [x] -> Add Label
  // - If Label is present -> Mark Checkbox [x]
  // - If Checkbox is [ ] -> Remove Label (User unchecked it)
  // - If Label is missing -> Mark Checkbox [ ] (User removed label)

  // Wait, if I uncheck valid [x], label should be removed.
  // If I remove label, [x] should become [ ].

  // To distinguish direction, we ideally check the trigger.
  // Trigger: 'labeled' -> Propagate to Checkbox
  // Trigger: 'edited' (Checkbox change) -> Propagate to Label
  // Trigger: 'opened' -> Init

  const action = context.payload.action;

  // LOGIC:
  // If action is 'labeled' or 'unlabeled': Verify consistency from Label -> Checkbox
  // If action is 'edited' (body change): Verify consistency from Checkbox -> Label

  if (action === 'labeled' || action === 'unlabeled') {
     console.log(`Action is ${action}. Syncing Label -> Checkbox`);
     // Sync L -> C
     // Receipt
     if (currentLabels.includes('領収書あり')) {
       if (body.includes('- [ ] 領収書を添付した')) {
         body = body.replace('- [ ] 領収書を添付した', '- [x] 領収書を添付した');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 領収書を添付した')) {
         body = body.replace('- [x] 領収書を添付した', '- [ ] 領収書を添付した');
         bodyChanged = true;
       }
     }

     // Approved
     if (currentLabels.includes('承認済み')) {
       if (body.includes('- [ ] 承認済み')) {
         body = body.replace('- [ ] 承認済み', '- [x] 承認済み');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 承認済み')) {
         body = body.replace('- [x] 承認済み', '- [ ] 承認済み');
         bodyChanged = true;
       }
     }

  } else {
    // Action is 'opened', 'edited', or 'reopened'.
    // We prioritize the Checkbox state in the body (User interaction).
    console.log(`Action is ${action}. Syncing Checkbox -> Label`);

    // Receipt
    if (isReceiptChecked) {
      if (!currentLabels.includes('領収書あり')) labelsToAdd.push('領収書あり');
    } else {
      if (currentLabels.includes('領収書あり')) labelsToRemove.push('領収書あり');
    }

    // Approved
    if (isApprovedChecked) {
      if (!currentLabels.includes('承認済み')) labelsToAdd.push('承認済み');
    } else {
      if (currentLabels.includes('承認済み')) labelsToRemove.push('承認済み');
    }
  }

  // --- Execution ---

  // Update Body if needed
  if (bodyChanged) {
    console.log('Updating issue body...');
    await github.rest.issues.update({
      owner, repo, issue_number, body
    });
  }

  // Define Helper
  const ensureLabel = async (name, color) => {
    try {
      await github.rest.issues.getLabel({ owner, repo, name });
    } catch (e) {
      if (e.status === 404) {
        await github.rest.issues.createLabel({ owner, repo, name, color });
      }
    }
  };

  // Process Labels
  if (labelsToAdd.length > 0) {
    // Ensure existence first
    if (labelsToAdd.includes('領収書あり')) await ensureLabel('領収書あり', '1D76DB');
    if (labelsToAdd.includes('承認済み')) await ensureLabel('承認済み', '0E8A16');

    console.log(`Adding labels: ${labelsToAdd.join(', ')}`);
    await github.rest.issues.addLabels({
      owner, repo, issue_number, labels: labelsToAdd
    });
  }

  if (labelsToRemove.length > 0) {
    console.log(`Removing labels: ${labelsToRemove.join(', ')}`);
    for (const label of labelsToRemove) {
      try {
        await github.rest.issues.removeLabel({
          owner, repo, issue_number, name: label
        });
      } catch (e) {
        // Ignore checking 404
        console.log(`Failed to remove label ${label}: ${e.message}`);
      }
    }
  }
}

module.exports = { syncLabels };
