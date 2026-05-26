# Slack由来レポートPR通知連携 設計書

## 目的

Slackから提出された書籍レポートPRを、GitHub Actionsの公開通知対象に含める。

## 対象範囲

- 対象: `workers/slack-book-gateway/src/github.ts`
- 対象外: Slackの状態遷移、レポートMarkdownの項目、PRマージ処理

## 主要な処理の流れ

1. Slackのレポート提出から書籍レポートMarkdownを作る。
2. `docs/knowledge_base/book_reports/*.md` を含むPRを作る。
3. 作成したPRに `book-report` ラベルを付ける。
4. 上長がSlackで完了ボタンを押すと、既存処理でPRをマージする。
5. Pages公開後、`.github/workflows/notify-slack.yml` が `book-report` ラベル付きPRとして通知する。

## 変更するファイル

- `workers/slack-book-gateway/src/github.ts`
- `workers/slack-book-gateway/README.md`
- `tests/workers/slack-book-gateway-http.test.ts`
- `tests/workers/slack-book-gateway-test-helpers.ts`

## 確認方法

- `npx tsx --test tests/workers/slack-book-gateway-http.test.ts tests/workers/slack-book-gateway-report-edit.test.ts`
- `npx wrangler deploy --dry-run --config workers/slack-book-gateway/wrangler.jsonc`
