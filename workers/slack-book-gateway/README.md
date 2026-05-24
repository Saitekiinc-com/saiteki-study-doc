# Slack Book Purchase Gateway

書籍購入補助制度のフェーズ1用Slack Gatewayです。

利用者はSlackの `/book` から申請します。

購入補助の状態管理はSlackスレッドを正本にします。GitHubは読了後の書籍レポートをAI用データとして保存するためにだけ使います。

## できること

- `/book` で申請モーダルを開く
- `/book setup` でチャンネルに申請ボタン付きの案内投稿を作り、ピン留めする
- 「本が決まっている」申請を受け付ける
- `C0B5FKHTTCK` に状態ボードになる親投稿を作る
- Slackボタンで購入承認、領収書貼付済み、領収書確認、レポート提出へ進める
- 誤操作時に `一つ前に戻す` で状態履歴を1つずつ戻す
- `レポート確認待ち` 以降は `一つ前に戻す` を表示しない
- ボタン操作の履歴を、操作した人のSlackメンション付きでスレッドに残す
- 親投稿のボタンを現在状態に合わせて切り替える
- 現在状態を Durable Object に保存し、古いボタンや古いレポートフォームからの更新を防ぐ
- 既存項目の書籍レポートをSlackモーダルで受け付ける
- 申請時・レポート提出時に入力された氏名を、書籍レポートMarkdownのAuthorとして使う
- 書籍レポートをSlackスレッドへ投稿する
- 書籍レポートMarkdownを追加するGitHub PRを作る
- `レポートを編集` から書籍レポートを修正し、既存PRブランチのMarkdownを更新する
- 上長の `レポートを確認して完了` ボタンで確認ダイアログを出し、承認後にPRをsquash mergeする
- 完了後はSlackから `一つ前に戻す` をできないようにする
- 完了時に親投稿へ `white_check_mark` リアクションを付ける

## Slack App設定

Slack Appで次を設定します。

| 設定 | 値 |
|---|---|
| Slash command | `/book` |
| Slash command request URL | `https://book-purchase-slack-gateway.koichi-sugimoto.workers.dev/slack/commands` |
| Interactivity request URL | `https://book-purchase-slack-gateway.koichi-sugimoto.workers.dev/slack/interactions` |
| Events request URL | `https://book-purchase-slack-gateway.koichi-sugimoto.workers.dev/slack/events` |
| Global shortcut callback ID | `open_book_request` |

Events APIはURL verification用に設定します。領収書添付は自動同期せず、上長がSlackスレッド上で確認します。

必要なBot Token Scopes:

- `commands`
- `chat:write`
- `users:read`
- `users.profile:read`
- `reactions:write`
- `pins:write`

`users.profile:read` は、申請モーダルの氏名欄の初期値をSlackプロフィールの `real_name` から取得する用途で使います。取得できない場合、氏名欄は空欄のまま必須入力になります。スコープを追加した場合は、Slack Appを再インストールしてください。最終的なAuthorは、モーダルの氏名欄に入力された値を優先します。

`users:read` は、レポート提出時などにSlackユーザー情報を補助的に取得する用途で使います。

`reactions:write` は、完了した申請の親投稿へ `white_check_mark` リアクションを付ける用途で使います。スコープが不足していても完了処理自体は止めません。

`pins:write` は、`/book setup` で作成した申請ボタン付きの案内投稿をチャンネルにピン留めする用途で使います。スコープが不足していても案内投稿の作成自体は止めません。

Events APIはURL verification用です。現時点では添付イベントを自動同期せず、利用者がスレッドに領収書を貼った後に `領収書を貼り付けました` を押します。

メンバーに `/book` を覚えてもらう代わりに、管理者が対象チャンネルで一度だけ `/book setup` を実行すると、申請ボタン付きの案内投稿を作り、その投稿をチャンネルにピン留めします。対象外チャンネルではランチャー投稿を作りません。スコープ追加後はSlack Appを再インストールしてください。

## Cloudflare設定

Workerは `koichi_sugimoto@saitekiinc.com` のCloudflareアカウントにデプロイします。

```json
"account_id": "f92a794e947dbfa6f132dba9f13e1867"
```

本番URL:

```text
https://book-purchase-slack-gateway.koichi-sugimoto.workers.dev
```

`wrangler.jsonc` のチャンネルIDは設定済みです。

```json
"BOOK_REQUEST_CHANNEL_ID": "C0B5FKHTTCK"
```

申請状態は Durable Object `BookPurchaseRequestState` に保存します。Slackボタンには `requestId` と `version` だけを入れ、ボタン押下時にWorker側の最新状態と照合します。

GitHubは台帳ではなく、読了後の書籍レポート保存先として使います。現在の初期値は既存リポジトリです。

```json
"GITHUB_OWNER": "Saitekiinc-com",
"GITHUB_REPO": "saiteki-study-doc"
```

## Secrets

次のsecretsをCloudflare Workersに設定します。

```bash
npx wrangler secret put SLACK_SIGNING_SECRET --config workers/slack-book-gateway/wrangler.jsonc
npx wrangler secret put SLACK_BOT_TOKEN --config workers/slack-book-gateway/wrangler.jsonc
npx wrangler secret put GITHUB_TOKEN --config workers/slack-book-gateway/wrangler.jsonc
```

`GITHUB_TOKEN` には、書籍レポートMarkdown用ブランチとPRを作成し、確認後にPRをマージできる権限が必要です。

Fine-grained tokenの場合の目安:

- Repository contents: Read and write
- Pull requests: Read and write

Classic tokenの場合は対象リポジトリに書き込みできる `repo` 相当の権限が必要です。

## Slackでの確認手順

1. チャンネルで `/book` を実行する。
2. モーダルから書名、URL、目的、対象月を送信する。
3. 親投稿で `購入を承認` を押し、状態が `購入・領収書貼付待ち` に変わることを確認する。
4. スレッドに領収書画像を貼り、親投稿の `領収書を貼り付けました` を押す。
5. `領収書を確認済みにする` を押し、`レポートを書く` が表示されることを確認する。
6. レポートを提出し、スレッドに本文とGitHub PR URLが投稿されることを確認する。
7. 必要であれば `レポートを編集` から内容を修正し、既存PRが更新されることを確認する。
8. `レポートを確認して完了` を押し、PRがマージされて状態が `完了` になることを確認する。

## ローカル起動

```bash
npm run slack:worker:dev
```

ローカル検証には `.dev.vars` を `workers/slack-book-gateway/.dev.vars` に置きます。

```dotenv
SLACK_SIGNING_SECRET=...
SLACK_BOT_TOKEN=xoxb-...
GITHUB_TOKEN=github_pat_...
```

## デプロイ

```bash
npm run slack:worker:deploy
```
