
const { test } = require('node:test');
const assert = require('node:assert');
const { renameIssue } = require('./rename-issue.js');

// 正常系: タイトルが正しくフォーマットされ、APIが呼び出されることを確認
test('renameIssue formats title correctly and calls API (正常系)', async (t) => {
  const mockContext = {
    payload: { issue: { number: 123 } },
    repo: { owner: 'test-owner', repo: 'test-repo' }
  };

  let updateParams = {};
  const mockGithub = {
    rest: {
      issues: {
        update: async (params) => {
          updateParams = params;
          return { status: 200 };
        }
      }
    }
  };

  const mockCore = {
    setFailed: (msg) => { assert.fail(`Should not fail: ${msg}`); }
  };

  await renameIssue({
    github: mockGithub,
    context: mockContext,
    core: mockCore,
    userName: '杉本',
    objective: 'RAGを構築したい'
  });

  assert.strictEqual(updateParams.owner, 'test-owner');
  assert.strictEqual(updateParams.repo, 'test-repo');
  assert.strictEqual(updateParams.issue_number, 123);
  assert.strictEqual(updateParams.title, '📚 書籍探索: RAGを構築したい (杉本さん)');
});

// 異常系: API呼び出しが失敗した場合、core.setFailedが呼ばれることを確認
test('renameIssue handles API errors gracefully (異常系)', async (t) => {
  const mockContext = {
    payload: { issue: { number: 123 } },
    repo: { owner: 'test-owner', repo: 'test-repo' }
  };

  const mockGithub = {
    rest: {
      issues: {
        update: async () => {
          throw new Error('API Error');
        }
      }
    }
  };

  let failureMessage = '';
  const mockCore = {
    setFailed: (msg) => { failureMessage = msg; }
  };

  await renameIssue({
    github: mockGithub,
    context: mockContext,
    core: mockCore,
    userName: 'User',
    objective: 'Obj'
  });

  assert.match(failureMessage, /Failed to rename issue: API Error/);
});
