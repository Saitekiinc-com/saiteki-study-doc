# Slack状態管理強化 Worker設定 設計書

## 目的

Slack申請フローの正本をDurable Objectに置くため、Workerの設定と運用メモをソース実装と同じ粒度で追従させる。

## 対象範囲

- `workers/slack-book-gateway/wrangler.jsonc`
- `workers/slack-book-gateway/README.md`
- `workers/slack-book-gateway/src/worker-configuration.d.ts`

## 方針

1. `BOOK_PURCHASE_REQUESTS` Durable Object bindingを追加する。
2. 初回migrationで `BookPurchaseRequestState` を作成する。
3. READMEには、Slackボタンが `requestId` と `version` だけを持ち、状態本体はDurable Objectに保存されることを記載する。
4. `/book setup` は対象チャンネルでのみランチャーを投稿し、可能ならピン留めすることを明記する。
5. `worker-configuration.d.ts` はWrangler生成物のため、行数制限の例外として扱う。
