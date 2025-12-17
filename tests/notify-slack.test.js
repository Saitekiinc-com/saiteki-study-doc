const assert = require('assert');

// The extraction logic from notify-slack.yml
function extract(body, label) {
  const regex = new RegExp(`### ${label}[^\\n]*\\n+([\\s\\S]*?)(?=(?:###|$))`);
  const m = body.match(regex);
  return m ? m[1].trim() : 'なし';
}

// Test cases
function testExtraction() {
  const issueBody = `### 書籍名
Test Book Notification 2

### 著者
Auto Tester

### リンク
https://example.com

### 読む前の目的 (Objective)
再テスト。環境変数修正後のSlack通知を確認する。

### 得られた知識・気づき (Key Takeaways)
シークレット名は正確に合わせる必要がある。

### 👍 Positive (良かった点・学び)
失敗から学ぶことは多い。

### 👎 Negative (難しかった点・合わなかった点)
特になし。

### 💡 どんな人におすすめ？
CI/CDエンジニア。
`;

  console.log("Testing Parsing Logic...");

  const objective = extract(issueBody, '読む前の目的 \\(Objective\\)');
  console.log(`Objective: ${objective}`);
  assert.strictEqual(objective, '再テスト。環境変数修正後のSlack通知を確認する。');

  const takeaways = extract(issueBody, '得られた知識・気づき \\(Key Takeaways\\)');
  console.log(`Takeaways: ${takeaways}`);
  assert.strictEqual(takeaways, 'シークレット名は正確に合わせる必要がある。');

  const positive = extract(issueBody, '👍 Positive \\(良かった点・学び\\)');
  console.log(`Positive: ${positive}`);
  assert.strictEqual(positive, '失敗から学ぶことは多い。');

  const recommend = extract(issueBody, '💡 どんな人におすすめ？');
  console.log(`Recommend: ${recommend}`);
  assert.strictEqual(recommend, 'CI/CDエンジニア。');

  console.log("ALL TESTS PASSED");
}

testExtraction();
