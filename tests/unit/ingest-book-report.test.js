const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { sanitizeFilename, extractField } = require('../../scripts/ingest-book-report.js');

describe('ingest-book-report.js Unit Tests', () => {

    describe('sanitizeFilename', () => {
        it('should sanitize regular english title', () => {
            const result = sanitizeFilename('Thinking Fast and Slow');
            assert.strictEqual(result, 'thinking-fast-and-slow');
        });

        it('should handle japanese characters', () => {
            const result = sanitizeFilename('AI駆動開発の教科書');
            assert.strictEqual(result, 'ai駆動開発の教科書');
        });

        it('should remove special characters', () => {
            const result = sanitizeFilename('Active Directory [第3版]');
            assert.strictEqual(result, 'active-directory-第3版');
        });

        it('should trim and collapse spaces', () => {
            const result = sanitizeFilename('  Multi   Space  ');
            assert.strictEqual(result, 'multi-space');
        });
    });

    describe('extractField', () => {
        const sampleBody = `
### 書籍名
The Pragmatic Programmer

### 著者
David Thomas

### 読む前の目的 (Objective)
Learn best practices.
`;

        it('should extract existing field', () => {
            const result = extractField(sampleBody, '書籍名');
            assert.strictEqual(result, 'The Pragmatic Programmer');
        });

        it('should extract field with escape characters in label', () => {
            const result = extractField(sampleBody, '読む前の目的 \\(Objective\\)');
            assert.strictEqual(result, 'Learn best practices.');
        });

        it('should return null for missing field', () => {
            const result = extractField(sampleBody, 'NonExistent');
            assert.strictEqual(result, null);
        });
    });
});
