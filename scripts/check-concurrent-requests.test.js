const { test } = require('node:test');
const assert = require('node:assert');
const { checkConcurrentRequests } = require('./check-concurrent-requests.js');

test('checkConcurrentRequests allows execution if no other issues exist', async (t) => {
  const mockGithub = {
    rest: {
      issues: {
        listForRepo: async () => ({ data: [{ number: 123 }] }), // 現在の Issue のみ
        createComment: async () => {},
        update: async () => {}
      }
    }
  };
  const mockContext = {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    payload: {
      issue: { number: 123, user: { login: 'test-user' } }
    }
  };
  const mockCore = {
    setFailed: (msg) => { throw new Error(`setFailed called: ${msg}`); }
  };

  await checkConcurrentRequests({ github: mockGithub, context: mockContext, core: mockCore });
  assert.ok(true, 'エラーなしで完了すべき');
});

test('checkConcurrentRequests closes issue if duplicates exist', async (t) => {
  let commentCreated = false;
  let issueClosed = false;
  let failedMsg = '';

  const mockGithub = {
    rest: {
      issues: {
        listForRepo: async () => ({
          data: [
            { number: 100, html_url: 'http://old' }, // 以前の Issue
            { number: 123, html_url: 'http://new' }  // 現在の Issue
          ]
        }),
        createComment: async ({ body }) => {
          commentCreated = true;
          assert.match(body, /すでに進行中の書籍選定依頼があります/);
        },
        update: async ({ state }) => {
          if (state === 'closed') issueClosed = true;
        }
      }
    }
  };
  const mockContext = {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    payload: {
      issue: { number: 123, user: { login: 'test-user' } }
    }
  };
  const mockCore = {
    setFailed: (msg) => { failedMsg = msg; }
  };

  await checkConcurrentRequests({ github: mockGithub, context: mockContext, core: mockCore });

  assert.strictEqual(commentCreated, true, '警告コメントを作成すべき');
  assert.strictEqual(issueClosed, true, '現在の Issue をクローズすべき');
  assert.strictEqual(failedMsg, 'Concurrent request limit exceeded.', 'アクションを失敗としてマークすべき');
});
