import { test } from 'node:test';
import * as assert from 'node:assert';
import { checkConcurrentRequests } from './check-concurrent-requests.js';

test('checkConcurrentRequests allows execution if no other issues exist', async (t) => {
  const mockGithub = {
    rest: {
      issues: {
        listForRepo: async () => ({ data: [{ number: 123 }] }), // 現在の Issue のみ
        createComment: async () => {},
        update: async () => {}
      }
    }
  } as any;
  const mockContext = {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    payload: {
      issue: { number: 123, user: { login: 'test-user' } }
    }
  } as any;
  const mockCore = {
    setFailed: (msg: string) => { throw new Error(`setFailed called: ${msg}`); }
  } as any;

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
        createComment: async ({ body }: any) => {
          commentCreated = true;
          assert.match(body, /すでに進行中の書籍選定依頼があります/);
        },
        update: async ({ state }: any) => {
          if (state === 'closed') issueClosed = true;
        }
      }
    }
  } as any;
  const mockContext = {
    repo: { owner: 'test-owner', repo: 'test-repo' },
    payload: {
      issue: { number: 123, user: { login: 'test-user' } }
    }
  } as any;
  const mockCore = {
    setFailed: (msg: string) => { failedMsg = msg; }
  } as any;

  await checkConcurrentRequests({ github: mockGithub, context: mockContext, core: mockCore });

  assert.strictEqual(commentCreated, true, '警告コメントを作成すべき');
  assert.strictEqual(issueClosed, true, '現在の Issue をクローズすべき');
  assert.strictEqual(failedMsg, '重複リクエストの制限を超過しました。', 'アクションを失敗としてマークすべき');
});
