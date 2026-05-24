# Slack状態管理強化 設計書

## 目的

Slackで完結する書籍購入補助フローについて、Slackボタンの `value` だけを状態の正本にしない。古いボタン、連打、古いモーダル送信で現在状態が壊れないようにする。

あわせて、`/book setup` を対象チャンネル以外で実行したときに、誤って申請ランチャーを作らないようにする。

## 対象範囲

- 対象: `workers/slack-book-gateway/src`
- 対象外: 承認者権限チェック、Slack領収書添付イベントの自動検知、AI推薦

## 主要な処理の流れ

1. 申請モーダル送信後、Slack親投稿を作る。
2. 親投稿の `channel` / `ts` を含めた申請状態を Durable Object に保存する。
3. Slackボタンには状態全体ではなく、`requestId` と `version` だけを入れる。
4. ボタン押下時は Durable Object から最新状態を読み、payloadの `version` と一致する場合だけ状態を更新する。
5. 古いversionの場合は状態変更せず、スレッドに「古いボタン」であることを投稿する。
6. 既存投稿との互換のため、旧形式の状態JSONが来た場合は Durable Object に未保存なら初回だけ保存する。
7. レポート提出は状態が `report_waiting` のときだけ初回PRを作る。提出中ロックで二重PR作成を抑止する。
8. 状態が `report_review_waiting` のときは、レポート編集モーダルから既存PRブランチの同じMarkdownファイルを更新する。
9. `report_review_waiting` 以降では `一つ前に戻す` を表示しない。
10. `/book` と `/book setup` は `BOOK_REQUEST_CHANNEL_ID` 以外では申請モーダルやランチャー投稿を作らない。

## 変更するソースファイル

- `workers/slack-book-gateway/src/index.ts`
- `workers/slack-book-gateway/src/launcher.ts`
- `workers/slack-book-gateway/src/report-modal.ts`
- `workers/slack-book-gateway/src/workflow.ts`
- `workers/slack-book-gateway/src/workflow-state.ts`
- `workers/slack-book-gateway/src/state.ts`
- `workers/slack-book-gateway/src/request-state.ts`
- `workers/slack-book-gateway/src/secrets.d.ts`

## 確認方法

- `npm run slack:worker:types`
- `npx tsx --test tests/workers/*.test.ts`
- `npm test`
- `git diff --check`
- `/book setup` を対象外チャンネルで実行して、ランチャー投稿されないことを確認する。
- 古いボタン操作とレポート二重送信で、Slack状態やGitHub PRが重複しないことを確認する。
