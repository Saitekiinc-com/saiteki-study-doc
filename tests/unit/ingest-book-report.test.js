const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { sanitizeFilename, extractField } = require('../../scripts/ingest-book-report.js');

describe('ingest-book-report.js 単体テスト', () => {

    describe('sanitizeFilename (ファイル名サニタイズ)', () => {
        it('通常の英語タイトルをサニタイズできること', () => {
            const result = sanitizeFilename('Thinking Fast and Slow');
            assert.strictEqual(result, 'thinking-fast-and-slow');
        });

        it('日本語文字を扱えること', () => {
            const result = sanitizeFilename('AI駆動開発の教科書');
            assert.strictEqual(result, 'ai駆動開発の教科書');
        });

        it('特殊文字を削除すること', () => {
            const result = sanitizeFilename('Active Directory [第3版]');
            assert.strictEqual(result, 'active-directory-第3版');
        });

        it('空白をトリムして短縮すること', () => {
            const result = sanitizeFilename('  Multi   Space  ');
            assert.strictEqual(result, 'multi-space');
        });
    });

    describe('extractField (フィールド抽出)', () => {
        const sampleBody = `
### 書籍名
The Pragmatic Programmer

### 著者
David Thomas

### 読む前の目的 (Objective)
Learn best practices.
`;

        it('存在するフィールドを抽出できること', () => {
            const result = extractField(sampleBody, '書籍名');
            assert.strictEqual(result, 'The Pragmatic Programmer');
        });

        it('ラベルにエスケープが必要な文字が含まれていても抽出できること', () => {
            const result = extractField(sampleBody, '読む前の目的 \\(Objective\\)');
            assert.strictEqual(result, 'Learn best practices.');
        });

        it('存在しないフィールドの場合はnullを返すこと', () => {
            const result = extractField(sampleBody, 'NonExistent');
            assert.strictEqual(result, null);
        });
    });
});
