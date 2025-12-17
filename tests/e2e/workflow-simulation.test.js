const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('E2E: Workflow Simulation', () => {

    // Cleanup function
    const clean = () => {
        if (fs.existsSync('dummy_roadmap.md')) fs.unlinkSync('dummy_roadmap.md');
        if (fs.existsSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md')) {
             fs.unlinkSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md');
        }
    };

    it('should fail recommend-books if no input provided', () => {
        try {
            execSync('node scripts/recommend-books.js');
            assert.fail('Should have failed');
        } catch (e) {
            assert.ok(e.status !== 0); // Exit code should be non-zero
        }
    });

    it('should generate a book report file via ingest-book-report', () => {
        // Setup env vars mimicking GitHub Actions
        const env = Object.assign({}, process.env, {
            ISSUE_TITLE: 'E2E Test Book',
            ISSUE_BODY: `
### 書籍名
E2E Test Book

### 著者
Test Author

### 読む前の目的 (Objective)
Verify E2E flow.
            `,
            ISSUE_NUMBER: '9999',
            ISSUE_URL: 'http://example.com/issue/9999',
            ISSUE_AUTHOR: 'e2e-bot',
            GITHUB_OUTPUT: 'dummy_output.txt' // Mock output file
        });

        // We need to ensure we don't mess up real index.md too badly.
        // The script appends to 'docs/knowledge_base/index.md'.
        // We might want to backup and restore it.
        const indexPath = 'docs/knowledge_base/index.md';
        let indexBackup = null;
        if (fs.existsSync(indexPath)) {
             indexBackup = fs.readFileSync(indexPath, 'utf8');
        }

        try {
            // Run ingest script
            execSync('node scripts/ingest-book-report.js', { env });

            // Verify file creation
            const expectedFile = `docs/knowledge_base/book_reports/${new Date().toISOString().split('T')[0]}-e2e-test-book-9999.md`;
            assert.ok(fs.existsSync(expectedFile), 'Report file should be created');

            // Clean up report file
            fs.unlinkSync(expectedFile);
            if (fs.existsSync('dummy_output.txt')) fs.unlinkSync('dummy_output.txt');

        } finally {
            // Restore index.md
            if (indexBackup !== null) {
                fs.writeFileSync(indexPath, indexBackup);
            }
        }
    });
});
