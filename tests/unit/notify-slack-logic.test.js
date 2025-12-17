const { test, describe } = require('node:test');
const assert = require('node:assert');

// Logic extracted from notify-slack.yml for testing
function extract(body, label) {
  const regex = new RegExp("### " + label + "[^\\n]*\\n+([\\s\\S]*?)(?=(?:###|$))");
  const m = body.match(regex);
  return m ? m[1].trim() : 'なし';
}

describe('Slack Notification Content Extraction', () => {
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

    test('extracts "読む前の目的" correctly', () => {
        const result = extract(sampleBody, '読む前の目的');
        assert.strictEqual(result, '質問力を高めたい');
    });

    test('extracts "得られた知識" correctly', () => {
        const result = extract(sampleBody, '得られた知識');
        assert.strictEqual(result, '良い質問は人生を変える');
    });

     test('extracts "難しかった点・合わなかった点" correctly', () => {
        const result = extract(sampleBody, '難しかった点・合わなかった点');
        assert.strictEqual(result, '特になし');
    });

    test('extracts "💡 どんな人におすすめ？" correctly', () => {
        // Note: The YAML uses '💡 どんな人におすすめ？' as label
        const result = extract(sampleBody, '💡 どんな人におすすめ？');
        assert.strictEqual(result, 'リーダー層');
    });

    test('returns "なし" for missing fields', () => {
        const result = extract(sampleBody, '存在しないフィールド');
        assert.strictEqual(result, 'なし');
    });
});
