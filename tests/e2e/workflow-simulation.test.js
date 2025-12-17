const { test, describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('E2E: ワークフローシミュレーション', () => {

    // クリーンアップ関数
    const clean = () => {
        if (fs.existsSync('dummy_roadmap.md')) fs.unlinkSync('dummy_roadmap.md');
        if (fs.existsSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md')) {
             fs.unlinkSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md');
        }
    };

    it('入力がない場合、recommend-books は失敗すること', () => {
        try {
            execSync('node scripts/recommend-books.js');
            assert.fail('失敗するはずです');
        } catch (e) {
            assert.ok(e.status !== 0); // 終了コードは非ゼロであるべき
        }
    });

    it('ingest-book-report 経由で読書感想文ファイルが生成されること', () => {
        // GitHub Actions を模倣した環境変数の設定
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
            GITHUB_OUTPUT: 'dummy_output.txt' // モック出力ファイル
        });

        // 実際の index.md を破壊しないように事前バックアップ
        // スクリプトは 'docs/knowledge_base/index.md' に追記します。
        const indexPath = 'docs/knowledge_base/index.md';
        let indexBackup = null;
        if (fs.existsSync(indexPath)) {
             indexBackup = fs.readFileSync(indexPath, 'utf8');
        }

        try {
            // スクリプト実行
            execSync('node scripts/ingest-book-report.js', { env });

            // ファイル作成確認
            const expectedFile = `docs/knowledge_base/book_reports/${new Date().toISOString().split('T')[0]}-e2e-test-book-9999.md`;
            assert.ok(fs.existsSync(expectedFile), 'レポートファイルが作成されるべきです');

            // レポートの中身の検証 (Strengthen E2E)
            const content = fs.readFileSync(expectedFile, 'utf8');
            assert.match(content, /title: "E2E Test Book"/, 'Frontmatter should contain title');
            assert.match(content, /author: e2e-bot/, 'Frontmatter should contain author'); // author is likely e2e-bot from ISSUE_AUTHOR or GitHub lookup falling back
            assert.ok(content.includes('Verify E2E flow.'), 'Body should contain objective');

            // 生成ファイルのクリーンアップ
            fs.unlinkSync(expectedFile);
            if (fs.existsSync('dummy_output.txt')) fs.unlinkSync('dummy_output.txt');

        } finally {
            // index.md の復元
            if (indexBackup !== null) {
                fs.writeFileSync(indexPath, indexBackup);
            }
        }
    });
});
