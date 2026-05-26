# Slackレポート公開通知 設計書

## 目的

GitHub Pagesへ公開された書籍レポートを、Slackの公開チャンネルへ自動通知する。

## 対象範囲

- 対象: `.github/workflows/notify-slack.yml`
- 対象外: Slack申請フロー、GitHub Pagesのビルド、旧Issue作成導線の廃止

## 主要な処理の流れ

1. `Deploy VitePress site to Pages` の成功を `workflow_run` で受ける。
2. `workflow_run.head_sha` に紐づくPRを取得する。
3. `book-report` ラベル付き、かつ `merge_commit_sha` が一致するPRだけを通知対象にする。
4. PR内の `docs/knowledge_base/book_reports/*.md` を同じSHAから取得する。
5. Markdownのfrontmatterと見出しから通知本文を作る。
6. `SLACK_WEBHOOK` に投稿する。投稿先チャンネルはWebhookの向き先で管理する。
7. Slack webhookがHTTPエラー、または `ok` 以外を返した場合はworkflowを失敗させる。

## 変更するファイル

- `.github/workflows/notify-slack.yml`
- `tests/workflows/notify-slack.test.ts`

## 確認方法

- `npx tsx --test tests/workflows/notify-slack.test.ts`
- `npm test`
- `npm run docs:build`
