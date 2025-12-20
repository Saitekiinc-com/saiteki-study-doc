import { test } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { main } from './update-vectors.js';

test('update-vectors.ts のメインロジックテスト', async (t) => {
  // 1. テスト用の作業ディレクトリを作成
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'update-vectors-test-'));
  const reportsDir = path.join(tmpDir, 'reports');
  const outputFile = path.join(tmpDir, 'vectors.json');

  fs.mkdirSync(reportsDir);

  // 2. ダミーのレポートファイルを作成
  const dummyFile1 = path.join(reportsDir, 'report1.md');
  const dummyContent1 = '# Report 1\nThis is a test report.';
  fs.writeFileSync(dummyFile1, dummyContent1);

  // 3. モックのモデルを作成
  const mockEmbedding = [0.1, 0.2, 0.3];
  const mockModel = {
    embedContent: async (content: string) => {
      // 呼び出されたことの確認（簡易的）
      assert.strictEqual(typeof content, 'string');
      return {
        embedding: { values: mockEmbedding }
      };
    }
  };

  try {
    // 4. main関数を実行 (APIキーはダミー, フォルダは一時ディレクトリ, モデルはモック)
    // tsx handles extension resolution, but arguably we should point to .ts or .js depending on config.
    // Using .js is standard ESM practice for TS source mapping if module resolution is NodeNext.
    // But since we are running via tsx, it might look for .ts if .js is missing?
    // Let's rely on standard resolution.
    await main('dummy-api-key', reportsDir, outputFile, mockModel);

    // 5. 出力されたJSONを検証
    const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

    assert.strictEqual(result.length, 1, 'ベクトル化されたファイル数が1であること');
    assert.strictEqual(result[0].id, 'report1.md', 'ファイル名が正しいこと');
    assert.strictEqual(result[0].content, dummyContent1, 'コンテンツが正しいこと');
    assert.deepStrictEqual(result[0].embedding, mockEmbedding, '埋め込みベクトルが正しいこと');
    assert.deepStrictEqual(result[0].metadata.source, dummyFile1, 'メタデータが正しいこと');

  } finally {
    // 6. クリーンアップ
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
