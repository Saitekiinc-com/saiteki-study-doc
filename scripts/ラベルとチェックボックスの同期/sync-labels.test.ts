import { test } from 'node:test';
import * as assert from 'node:assert';
import { syncLabels } from './sync-labels.js';

// GitHub API をモックするためのヘルパー
const createMockGithub = (initialBody: string, initialLabels: string[], action: string) => {
  let body = initialBody;
  let labels = [...initialLabels];

  const context = {
    payload: {
      action,
      issue: { number: 1, body, labels: initialLabels.map(name => ({ name })) }
    },
    repo: { owner: 'o', repo: 'r' }
  } as any;

  const github = {
    rest: {
      issues: {
        get: async () => ({ data: { body, labels: labels.map(name => ({ name })) } }),
        update: async ({ body: newBody }: any) => { body = newBody; return { status: 200 }; },
        createLabel: async () => ({ status: 201 }),
        getLabel: async () => ({ status: 200 }),
        addLabels: async ({ labels: newLabels }: any) => { labels.push(...newLabels); return { status: 200 }; },
        removeLabel: async ({ name }: any) => { labels = labels.filter(l => l !== name); return { status: 204 }; },
        listLabelsOnIssue: async () => ({ data: labels.map(name => ({ name })) })
      }
    }
  } as any;

  const core = {
    info: () => {},
    error: () => {},
    setOutput: () => {},
    setFailed: () => {}
  } as any;

  return {
    context,
    github,
    core,
    getFinalState: () => ({ body, labels })
  };
};

test('syncLabels appends checklist if missing (Trigger: opened)', async (t) => {
  const { github, context, core, getFinalState } = createMockGithub('Original Body', [], 'opened');

  await syncLabels({ github, context, core });

  const { body } = getFinalState();
  assert.ok(body.includes('## ステータス管理 (Status)'));
  assert.ok(body.includes('- [ ] 購入したい書籍の商品リンクを添付した（申請者）')); // 新規チェックボックス
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'));
  assert.ok(body.includes('- [ ] 承認済み (上長)'));
});

test('syncLabels adds label when checkbox is checked (Trigger: edited)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [x] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, core, getFinalState } = createMockGithub(CHECKED_BODY, [], 'edited');

  await syncLabels({ github, context, core });

  const { labels } = getFinalState();
  assert.ok(labels.includes('領収書あり'));
});

test('syncLabels removes label when checkbox is unchecked (Trigger: edited)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, core, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'edited');

  await syncLabels({ github, context, core });

  const { labels } = getFinalState();
  assert.ok(!labels.includes('領収書あり'));
});

test('syncLabels checks checkbox when label is added (Trigger: labeled)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, core, getFinalState } = createMockGithub(UNCHECKED_BODY, ['領収書あり'], 'labeled');

  await syncLabels({ github, context, core });

  const { body } = getFinalState();
  assert.ok(body.includes('- [x] 領収書を添付した (申請者)'));
});

test('syncLabels unchecks checkbox when label is removed (Trigger: unlabeled)', async (t) => {
  const CHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [x] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, core, getFinalState } = createMockGithub(CHECKED_BODY, [], 'unlabeled');

  await syncLabels({ github, context, core });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'));
});

test('syncLabels DOES NOT check checkbox if label is unrelated (Trigger: labeled)', async (t) => {
  const UNCHECKED_BODY = 'Original Body\n\n## ステータス管理 (Status)\n- [ ] 購入したい書籍の商品リンクを添付した（申請者）\n- [ ] 領収書を添付した (申請者)\n- [ ] 承認済み (上長)';
  const { github, context, core, getFinalState } = createMockGithub(UNCHECKED_BODY, ['book-search-request'], 'labeled');

  await syncLabels({ github, context, core });

  const { body } = getFinalState();
  assert.ok(body.includes('- [ ] 領収書を添付した (申請者)'), '無関係なラベルの場合、チェックボックスは未チェックのままであるべき');
});
