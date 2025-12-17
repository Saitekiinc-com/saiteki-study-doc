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

        it('括弧を含むラベル（リンク (任意)）を抽出できること', () => {
            const bodyWithParens = `
### リンク (任意)
https://example.com
### 次の項目
`;
            const result = extractField(bodyWithParens, 'リンク \\(任意\\)');
            assert.strictEqual(result, 'https://example.com');
        });

        it('存在しないフィールドの場合はnullを返すこと', () => {
            const result = extractField(sampleBody, 'NonExistent');
            assert.strictEqual(result, null);
        });

        // 境界値テスト (Boundary Testing)
        it('空の本文から抽出を試みた場合nullを返すこと', () => {
            const result = extractField('', '書籍名');
            assert.strictEqual(result, null);
        });

        it('値が空のフィールドを正しく空文字として抽出できること', () => {
            const bodyWithEmptyField = `
### 空フィールド

### 次のフィールド
値あり
`;
            const result = extractField(bodyWithEmptyField, '空フィールド');
            // 現在の実装では改行までを取得するため、空行が含まれる可能性があるか要確認。
            // extractFieldの実装: ([\\s\\S]*?)(?=(?:###|$))
            // ### 空フィールド\n\n### 次のフィールド
            // なので、\n\n がマッチする。 trim() されるので '' になるはず。
            assert.strictEqual(result, '');
        });
    });

    describe('sanitizeFilename (境界値)', () => {
        it('空文字の場合は空文字を返すこと', () => {
            const result = sanitizeFilename('');
            assert.strictEqual(result, '');
        });

        it('禁止文字のみの場合は空文字を返すこと', () => {
            const result = sanitizeFilename('!@#$%^&*()');
            assert.strictEqual(result, '');
        });

        it('非常に長いタイトルは50文字に切り詰められること', () => {
            const longTitle = 'a'.repeat(100);
            const result = sanitizeFilename(longTitle);
            assert.strictEqual(result.length, 50);
            assert.strictEqual(result, 'a'.repeat(50));
        });
    });
});
