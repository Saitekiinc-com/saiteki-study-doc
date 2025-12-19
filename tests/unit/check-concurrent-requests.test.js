const { test } = require('node:test');
const assert = require('node:assert');
const { checkConcurrentRequests } = require('../../scripts/check-concurrent-requests.js');

test('checkConcurrentRequests allows execution if no other issues exist', async (t) => {
  const mockGithub = {
    rest: {
      issues: {
        listForRepo: async () => ({ data: [{ number: 123 }] }), // Only the current issue
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
  assert.ok(true, 'Should finish without error');
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
            { number: 100, html_url: 'http://old' }, // Previous issue
            { number: 123, html_url: 'http://new' }  // Current issue
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

  assert.strictEqual(commentCreated, true, 'Should create a warning comment');
  assert.strictEqual(issueClosed, true, 'Should close the current issue');
  assert.strictEqual(failedMsg, 'Concurrent request limit exceeded.', 'Should mark action as failed');
});
