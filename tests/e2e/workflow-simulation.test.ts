import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import * as fs from 'fs';

describe('E2E: ワークフローシミュレーション', () => {

    // テスト用のクリーンアップ関数
    // 作成されたダミーファイルなどを削除します
    const clean = () => {
        if (fs.existsSync('dummy_roadmap.md')) fs.unlinkSync('dummy_roadmap.md');
        if (fs.existsSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md')) {
             fs.unlinkSync('docs/knowledge_base/book_reports/2099-01-01-e2e-test-book.md');
        }
    };

    it('入力がない場合、recommend-books は失敗すること', () => {
        try {
            // 入力なしでスクリプトを実行し、エラーになることを期待します
            execSync('npx tsx scripts/書籍の推薦/recommend-books.ts', { encoding: 'utf-8' });
            assert.fail('失敗するはずです');
        } catch (e: any) {
            // 終了コードが 0 以外であることを確認
            assert.ok(e.status !== 0);
        }
    });

    it('ingest-book-report 経由で書籍レポートファイルが生成されること', () => {
        // GitHub Actions の環境変数を模倣します
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

        try {
            // GITHUB_OUTPUT のファイルを作成しておく必要があります
            fs.writeFileSync('dummy_output.txt', '');

            // ingest-book-report.ts スクリプトを実行します
            execSync('npx tsx scripts/書籍レポートの取り込み/ingest-book-report.ts', { env });

            // 期待されるファイルパス
            const expectedFile = `docs/knowledge_base/book_reports/${new Date().toISOString().split('T')[0]}-e2e-bot-e2e-test-book-9999.md`;

            // ファイルが作成されたことを確認
            assert.ok(fs.existsSync(expectedFile), 'レポートファイルが作成されるべきです');

            // レポートの中身を検証します
            const content = fs.readFileSync(expectedFile, 'utf8');
            assert.match(content, /title: "E2E Test Book"/, 'Frontmatter にタイトルが含まれていること');
            assert.match(content, /author: e2e-bot/, 'Frontmatter に著者が含まれていること');
            assert.ok(content.includes('Verify E2E flow.'), '本文に目的が含まれていること');

            // 生成ファイルのクリーンアップ
            fs.unlinkSync(expectedFile);
            if (fs.existsSync('dummy_output.txt')) fs.unlinkSync('dummy_output.txt');

        } finally {
            // catch ブロックがなくても finally は実行されます
        }
    });
});
