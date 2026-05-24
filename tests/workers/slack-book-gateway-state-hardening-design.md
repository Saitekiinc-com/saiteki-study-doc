# Slack状態管理強化 テスト設計書

## 目的

Slackで完結する書籍購入補助フローについて、古いボタン、古いモーダル、レポートPR作成後の状態保存失敗、`/book setup` の誤操作をテストで固定する。

## 対象範囲

- `tests/workers/slack-book-gateway-http.test.ts`
- `tests/workers/slack-book-gateway-test-helpers.ts`

## 方針

1. HTTPテスト本体はユーザー操作と期待結果に集中させる。
2. Slack API、GitHub API、Durable Objectのモックはヘルパーに分ける。
3. 旧形式のSlackボタンpayloadは、Durable Objectに状態がない場合だけ互換として扱う。
4. Durable Objectに状態がある場合は、旧形式payloadを古い操作として扱う。
5. レポート提出中ロックと保存競合の回復をテストし、PRだけ作られてSlack状態が止まる事故を防ぐ。
