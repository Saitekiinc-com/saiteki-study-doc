const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { getSidebarBooks } = require('./debug-sidebar.js');

describe('debug-sidebar.js 単体テスト', () => {
  let consoleLogMock;

  beforeEach(() => {
    consoleLogMock = mock.method(console, 'log', () => {});
  });

  afterEach(() => {
    consoleLogMock.mock.restore();
  });

  it('ファイルが見つかり、著者マッピングが存在する場合、正しくグループ化されること', () => {
    const dummyFiles = [
      'docs/knowledge_base/book_reports/book1.md',
      'docs/knowledge_base/book_reports/book2.md'
    ];

    // Glob モック
    const mockGlobFn = mock.fn(() => dummyFiles);

    // fs モック
    const mockFs = {
      readFileSync: mock.fn((filePath) => {
        if (filePath.endsWith('book1.md')) {
          return `
title: "Book One"
author: "koxtuichi"
          `;
        }
        if (filePath.endsWith('book2.md')) {
          return `
title: "Book Two"
author: "sugimotokouichi"
          `;
        }
        return '';
      })
    };

    const result = getSidebarBooks(mockGlobFn, mockFs);

    // 検証
    assert.strictEqual(result.length, 1, '同一著者(マッピング後)なので1グループになるべき');

    const group = result[0];
    assert.strictEqual(group.text, '杉本 光一'); // マッピングされた名前
    assert.strictEqual(group.items.length, 2);

    const item1 = group.items.find(i => i.text === 'Book One');
    assert.ok(item1);
    assert.strictEqual(item1.link, '/knowledge_base/book_reports/book1');
  });

  it('マッピングにない著者の場合、そのままのIDが表示名になること', () => {
    const mockGlobFn = mock.fn(() => ['docs/knowledge_base/book_reports/other.md']);
    const mockFs = {
      readFileSync: mock.fn(() => `
title: "Other Book"
author: "unknown-author"
      `)
    };

    const result = getSidebarBooks(mockGlobFn, mockFs);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'unknown-author');
    assert.strictEqual(result[0].items[0].text, 'Other Book');
  });

  it('著者がフロントマターにない場合、Other として扱われること', () => {
    const mockGlobFn = mock.fn(() => ['docs/knowledge_base/book_reports/no-author.md']);
    const mockFs = {
      readFileSync: mock.fn(() => `
title: "No Author Book"
      `) // author なし
    };

    const result = getSidebarBooks(mockGlobFn, mockFs);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'Other');
    assert.strictEqual(result[0].items[0].text, 'No Author Book');
  });

  it('@マーク付きの著者IDが正規化されること', () => {
    const mockGlobFn = mock.fn(() => ['docs/knowledge_base/book_reports/at-author.md']);
    const mockFs = {
      readFileSync: mock.fn(() => `
author: "@user"
      `)
    };

    const result = getSidebarBooks(mockGlobFn, mockFs);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].text, 'user');
  });

  it('ファイルが見つからない場合、空配列を返すこと', () => {
    const mockGlobFn = mock.fn(() => []);
    const mockFs = { readFileSync: mock.fn() };

    const result = getSidebarBooks(mockGlobFn, mockFs);

    assert.strictEqual(result.length, 0);
  });
});
