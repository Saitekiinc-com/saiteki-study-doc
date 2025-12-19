
const { test } = require('node:test');
const assert = require('node:assert');
const { syncLabels } = require('../../scripts/sync-labels.js');

// GitHub API をモックするためのヘルパー
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
  assert.ok(body.includes('- [ ] 購入したい書籍の商品リンクを添付した（申請者）')); // 新規チェックボックス
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'));
  assert.ok(body.includes('- [ ] 承認済み (上長)'));
});

// 新しいチェックボックスのマイグレーションテスト
test('syncLabels inserts new checkbox if missing (Trigger: edited)', async (t) => {
  // 既存のチェックボックスはあるが、リンク添付チェックがないケース
  const OLD_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(OLD_BODY, [], 'edited');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 購入したい書籍の商品リンクを添付した（申請者）'));
  // 順序確認: リンク添付 -> 領収書
  const linkIndex = body.indexOf('- [ ] 購入したい書籍の商品リンクを添付した（申請者）');
  const receiptIndex = body.indexOf('- [ ] 領収書を添付した (申請者)');
  assert.ok(linkIndex < receiptIndex, 'リンク添付チェックボックスは領収書チェックボックスの上にあるべき');
});

test('syncLabels migrates older link checkbox format (Trigger: edited)', async (t) => {
  // 古い形式のリンク添付チェックがあるケース
  const OLD_LINK_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(OLD_LINK_BODY, [], 'edited');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 購入したい書籍の商品リンクを添付した（申請者）'), '古い形式は新しい形式に置換されるべき');
});

test('syncLabels adds label when checkbox is checked (Trigger: edited)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [x] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(CHECKED_BODY, [], 'edited');

  await syncLabels({ github, context });

  const { labels } = getFinalState();
  assert.ok(labels.includes('領収書あり'));
});

test('syncLabels removes label when checkbox is unchecked (Trigger: edited)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'edited');

  await syncLabels({ github, context });

  const { labels } = getFinalState();
  assert.ok(!labels.includes('領収書あり'));
});

test('syncLabels checks checkbox when label is added (Trigger: labeled)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'labeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [x] 領収書を添付した (申請者)'));
});

test('syncLabels unchecks checkbox when label is removed (Trigger: unlabeled)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [x] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(CHECKED_BODY, [], 'unlabeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'));
});

test('syncLabels DOES NOT check checkbox if label is unrelated (Trigger: labeled)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, getFinalState } = createMockGithub(UNCHECKED_BODY, ['book-search-request'], 'labeled');

  await syncLabels({ github, context });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'), '無関係なラベルの場合、チェックボックスは未チェックのままであるべき');
});

test('syncLabels migrates old checkbox format to new format (Trigger: opened)', async (t) => {
  const OLD_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [x] 領収書を添付した\n- [ ] 承認済み';
  const { github, context, getFinalState } = createMockGithub(OLD_BODY, [], 'opened');

  await syncLabels({ github, context });

  const { body, labels } = getFinalState();
  assert.ok(body.includes('- [x] 領収書を添付した (申請者)'), '旧形式[x]は新形式[x]に置換されるべき');
  assert.ok(body.includes('- [ ] 承認済み (上長)'), '旧形式[ ]は新形式[ ]に置換されるべき');
  assert.ok(body.includes('- [ ] 購入したい書籍の商品リンクを添付した（申請者）'), '新しいチェックボックスも追加されるべき');
});

