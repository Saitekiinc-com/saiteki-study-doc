
const { test } = require('node:test');
const assert = require('node:assert');
const { syncLabels } = require('../../scripts/sync-labels.js');

// Helper to mock GitHub API
const createMockGithub = (initialBody, initialLabels, action) => {
  let body = initialBody;
  let labels = [...initialLabels];

  return {
    context: {
      payload: {
        action,
        issue: { number: 1, body, labels: initialLabels.map(name => ({ name })) }
      },
      repo: { owner: 'o', repo: 'r' }
    },
    github: {
      rest: {
        issues: {
          get: async () => ({ data: { body, labels: labels.map(name => ({ name })) } }),
          update: async ({ body: newBody }) => { body = newBody; return { status: 200 }; },
          createLabel: async () => ({ status: 201 }),
          getLabel: async () => ({ status: 200 }),
          addLabels: async ({ labels: newLabels }) => { labels.push(...newLabels); return { status: 200 }; },
          removeLabel: async ({ name }) => { labels = labels.filter(l => l !== name); return { status: 204 }; },
          listLabelsOnIssue: async () => ({ data: labels.map(name => ({ name })) })
        }
      }
    },
    getFinalState: () => ({ body, labels })
  };
};

test('syncLabels appends checklist if missing (Trigger: opened)', async (t) => {
  const { github, context, getFinalState } = createMockGithub('Original Body', [], 'opened');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('## ステータス管理 (Status)'));
  assert.ok(body.includes('- [ ] 領収書を添付した'));
  assert.ok(!body.includes('(Receipt Attached)')); // Ensure English removed
});

test('syncLabels adds label when checkbox is checked (Trigger: edited)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [x] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(CHECKED_BODY, [], 'edited');

  await syncLabels({ github, context });

  const { labels } = getFinalState();
  assert.ok(labels.includes('領収書あり'));
});

test('syncLabels removes label when checkbox is unchecked (Trigger: edited)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'edited');

  await syncLabels({ github, context });

  const { labels } = getFinalState();
  assert.ok(!labels.includes('領収書あり'));
});

test('syncLabels checks checkbox when label is added (Trigger: labeled)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'labeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [x] 領収書を添付した'));
});

test('syncLabels unchecks checkbox when label is removed (Trigger: unlabeled)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [x] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(CHECKED_BODY, [], 'unlabeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した'));
});

test('syncLabels DOES NOT check checkbox if label is unrelated (Trigger: labeled)', async (t) => {
  // Case: User adds 'book-search-request' label. This triggers 'labeled'.
  // We must ensure this does NOT check 'Receipt Attached'.
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['book-search-request'], 'labeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した'), 'Checkbox should remain unchecked for unrelated label');
});

