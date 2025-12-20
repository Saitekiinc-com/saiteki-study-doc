import { test, describe } from 'node:test';
import assert from 'node:assert';

// テストのために notify-slack.yml からロジックを抽出
// 本来は共通モジュール化すべきですが、Workflow内ロジックの単体テストとしてここに記述します
function extract(body: string, label: string): string {
  const regex = new RegExp("### " + label + "[^\\n]*\\n+([\\s\\S]*?)(?=(?:###|$))");
  const m = body.match(regex);
  return m ? m[1].trim() : 'なし';
}

describe('Slack 通知コンテンツの抽出', () => {
    const sampleBody = `
### 書籍名
AI時代に強い質問力

### 著者
マツダミヒロ

### 読む前の目的
質問力を高めたい

### 得られた知識
良い質問は人生を変える

### 実務における活用
チームでの1on1に使う

### 良かった点
実例が多くて分かりやすい

### 難しかった点・合わなかった点
特になし

### 💡 どんな人におすすめ？
リーダー層
`;

    test('"読む前の目的" が正しく抽出されること', () => {
        const result = extract(sampleBody, '読む前の目的');
        assert.strictEqual(result, '質問力を高めたい');
    });

    test('"得られた知識" が正しく抽出されること', () => {
        const result = extract(sampleBody, '得られた知識');
        assert.strictEqual(result, '良い質問は人生を変える');
    });

     test('"難しかった点・合わなかった点" が正しく抽出されること', () => {
        const result = extract(sampleBody, '難しかった点・合わなかった点');
        assert.strictEqual(result, '特になし');
    });

    test('"💡 どんな人におすすめ？" が正しく抽出されること', () => {
        // 注: YAML ではラベルとして '💡 どんな人におすすめ？' を使用している
        const result = extract(sampleBody, '💡 どんな人におすすめ？');
        assert.strictEqual(result, 'リーダー層');
    });

    test('存在しないフィールドには "なし" を返すこと', () => {
        const result = extract(sampleBody, '存在しないフィールド');
        assert.strictEqual(result, 'なし');
    });
});
