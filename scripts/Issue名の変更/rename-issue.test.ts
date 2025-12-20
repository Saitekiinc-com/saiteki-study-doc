import { test } from 'node:test';
import * as assert from 'node:assert';
import { renameIssue } from './rename-issue.js';

// 正常系: タイトルが正しくフォーマットされ、APIが呼び出されることを確認
test('renameIssue formats title correctly and calls API (正常系)', async (t) => {
  const mockContext = {
    payload: { issue: { number: 123 } },
    repo: { owner: 'test-owner', repo: 'test-repo' }
  } as any;

  let updateParams: any = {};
  const mockGithub = {
    rest: {
      issues: {
        update: async (params: any) => {
          updateParams = params;
          return { status: 200 };
        }
      }
    }
  } as any;

  const mockCore = {
    setFailed: (msg: string) => { assert.fail(`Should not fail: ${msg}`); }
  } as any;

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
  } as any;

  const mockGithub = {
    rest: {
      issues: {
        update: async () => {
          throw new Error('API Error');
        }
      }
    }
  } as any;

  let failureMessage = '';
  const mockCore = {
    setFailed: (msg: string) => { failureMessage = msg; }
  } as any;

  await renameIssue({
    github: mockGithub,
    context: mockContext,
    core: mockCore,
    userName: 'User',
    objective: 'Obj'
  });

  assert.match(failureMessage, /Issue 名の変更に失敗しました: API Error/);
});
