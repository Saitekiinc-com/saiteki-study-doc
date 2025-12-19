/**
 * ワークフロートリガーのロジック検証テスト
 * このスクリプトは GitHub Action のイベントペイロードをシミュレートし、"if" 条件のロジックを検証します。
 */

function shouldRunWorkflow(event) {
  const { action, label } = event;

  // .github/workflows/ingest-book-report.yml の新しいロジック（opened は削除済み）
  // トリガー: types: [labeled]
  // if: github.event.label.name == 'book-report'
  const condition = action === 'labeled' && label && label.name === 'book-report';

  return condition;
}

// モックデータ
const issueWithLabel = { labels: [{ name: 'book-report' }] };
const issueWithoutLabel = { labels: [] };
const issueWithOtherLabel = { labels: [{ name: 'book-report' }, { name: 'other' }] };

const tests = [
  {
    name: 'ケース 1: book-report ラベル付きで Issue が開かれた (opened イベント)',
    event: { action: 'opened', issue: issueWithLabel },
    expected: false // opened トリガーを削除したため、opened イベントでは実行されない（直後の labeled で実行される）
  },
  {
    name: 'ケース 2: ラベルなしで Issue が開かれた',
    event: { action: 'opened', issue: issueWithoutLabel },
    expected: false
  },
  {
    name: 'ケース 3: "book-report" ラベルが手動で追加された（または作成時の labeled イベント）',
    event: { action: 'labeled', issue: issueWithLabel, label: { name: 'book-report' } },
    expected: true
  },
  {
    name: 'ケース 4: "other" ラベルが手動で追加された (既存のバグケース)',
    // ユーザーが 'other' ラベルを追加したが、Issue には既に 'book-report' がある
    event: { action: 'labeled', issue: issueWithOtherLabel, label: { name: 'other' } },
    expected: false
  }
];

// テストの実行
console.log('--- ワークフロートリガーロジック検証 ---\n');
let failed = false;

tests.forEach(test => {
  const result = shouldRunWorkflow(test.event);
  const status = result === test.expected ? 'PASS' : 'FAIL';
  if (result !== test.expected) failed = true;

  console.log(`[${status}] ${test.name}`);
  console.log(`       Expected: ${test.expected}, Got: ${result}\n`);
});

if (failed) {
  console.error('❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('✅ 全てのロジックテストに合格しました。修正により重複実行が効果的に抑制されています。');
}
