/**
 * ワークフロートリガーのロジック検証テスト
 * このスクリプトは GitHub Action のイベントペイロードをシミュレートし、"if" 条件のロジックを検証します。
 */
import { test, describe } from 'node:test';
import assert from 'node:assert';

type EventPayload = {
  action: string;
  label?: { name: string };
  issue?: { labels: { name: string }[] };
};

// shouldRunWorkflow: workflow "if" 条件のシミュレーション
function shouldRunWorkflow(event: EventPayload): boolean {
  const { action, label } = event;

  // .github/workflows/ingest-book-report.yml の新しいロジック
  // トリガー: types: [labeled]
  // if: github.event.label.name == 'book-report'
  const condition = action === 'labeled' && label !== undefined && label.name === 'book-report';

  return condition;
}

// モックデータ
const issueWithLabel = { labels: [{ name: 'book-report' }] };
const issueWithoutLabel = { labels: [] };
const issueWithOtherLabel = { labels: [{ name: 'book-report' }, { name: 'other' }] };

describe('ワークフロートリガーロジック検証', () => {

    test('ケース 1: book-report ラベル付きで Issue が開かれた (opened イベント)', () => {
        // opened トリガーを削除したため、opened イベントでは実行されない（直後の labeled で実行される）
        const event = { action: 'opened', issue: issueWithLabel };
        const result = shouldRunWorkflow(event);
        assert.strictEqual(result, false);
    });

    test('ケース 2: ラベルなしで Issue が開かれた', () => {
        const event = { action: 'opened', issue: issueWithoutLabel };
        const result = shouldRunWorkflow(event);
        assert.strictEqual(result, false);
    });

    test('ケース 3: "book-report" ラベルが手動で追加された（または作成時の labeled イベント）', () => {
        const event = { action: 'labeled', issue: issueWithLabel, label: { name: 'book-report' } };
        const result = shouldRunWorkflow(event);
        assert.strictEqual(result, true);
    });

    test('ケース 4: "other" ラベルが手動で追加された', () => {
        // ユーザーが 'other' ラベルを追加したが、Issue には既に 'book-report' がある場合でも、
        // トリガーイベントのラベルが 'book-report' でなければ実行されない
        const event = { action: 'labeled', issue: issueWithOtherLabel, label: { name: 'other' } };
        const result = shouldRunWorkflow(event);
        assert.strictEqual(result, false);
    });
});
