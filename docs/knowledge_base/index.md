# 📚 読書感想文 (Books Review)

チームメンバーが読んだ本の感想・学びをまとめています。
新しく読書感想文を投稿すると、Slackに自動で通知されます。

---

## 🚀 はじめる前に：GitHubプロフィールの設定

読書感想文の投稿者名を日本語で表示するには、GitHubプロフィールに名前を設定してください。

### 手順

1. **GitHubプロフィールページにアクセス**
   - GitHubにログイン → 右上のアイコンをクリック → 「**Your profile**」を選択

2. **プロフィールを編集**
   - 左側の「**Edit profile**」ボタンをクリック

3. **名前を入力**
   - 「**Name**」欄に日本語の名前を入力（例：杉本 光一）
   - 「**Save**」をクリック

> 💡 この設定は一度だけ行えばOKです。

---

## 📖 読書感想文の投稿方法

読書感想文を投稿するには、GitHubでIssueを作成します。

### Flow A：書籍補助を受けて読む場合

会社から書籍購入の補助を受ける場合は、以下のフローに従ってください。

| ステップ | 担当者 | アクション |
|---------|--------|-----------|
| 1 | **あなた** | [📖 書籍探索Issueを作成](#書籍探索の方法)（学びたい内容を入力） |
| 2 | **自動** | AIが適切な書籍を推薦（**あくまで参考**） |
| 3 | **あなた** | 購入する書籍を決定し、**書籍探索Issueにコメント**で報告 |
| 4 | **あなた** | 上長に購入申請 |
| 5 | **上長** | 申請を承認 |
| 6 | **あなた** | 書籍を購入・読了 |
| 7 | **あなた** | [📚 読書感想文を作成](#読書感想文の投稿手順)（**元の書籍探索Issueを参照**） |
| 8 | **自動** | PRが自動作成される |
| 9 | **上長** | PRをレビュー・マージ |
| 10 | **自動** | Slackに通知 ＆ ページが公開 |

> 💡 **補足**: AIの推薦はあくまで参考です。推薦以外の書籍を購入しても問題ありません。


---

### Flow B：自己負担で読む場合

自分で購入した本や、既に読んだ本について感想を投稿する場合。

| ステップ | 担当者 | アクション |
|---------|--------|-----------|
| 1 | **あなた** | [📚 読書感想文をGitHubで作成](#投稿手順) |
| 2 | **自動** | PRが自動作成される |
| 3 | **あなた** | PRを自分でマージ（セルフレビュー） |
| 4 | **自動** | Slackに通知 ＆ ページが公開 |

---

## 📖 書籍探索の方法

学びたいスキルや目標を入力すると、AIが適切な書籍を推薦します。
既存ナレッジベースの読書感想文も参照して、チームに合った本を提案します。

### Step 1: Issue作成ページを開く

1. [**saiteki-study-doc リポジトリ**](https://github.com/Saitekiinc-com/saiteki-study-doc) にアクセス
2. 上部の「**Issues**」タブをクリック
3. 緑色の「**New issue**」ボタンをクリック
4. 「**📚 書籍探索リクエスト (Book Search Request)**」をクリック

### Step 2: フォームに入力

| 項目 | 説明 | 例 |
|-----|------|-----|
| **目指すこと** | 学びたいスキルや目標 | フロントエンドのパフォーマンス改善 |
| **現在のスキルレベル** | 今の知識レベル | React基礎は分かる、最適化は未経験 |
| **職種・役割** | あなたの役割 | フロントエンドエンジニア |

### Step 3: Issueを送信

1. 入力が完了したら、緑色の「**Submit new issue**」ボタンをクリック
2. AIがコメントで書籍を推薦（1-2分お待ちください）
3. 推薦された書籍を上長に申請

> 💡 このIssue番号を控えておきましょう。後で読書感想文を書く際に参照します。

---

## 📝 読書感想文の投稿手順


### Step 1: Issue作成ページを開く

1. [**saiteki-study-doc リポジトリ**](https://github.com/Saitekiinc-com/saiteki-study-doc) にアクセス
2. 上部の「**Issues**」タブをクリック
3. 緑色の「**New issue**」ボタンをクリック
4. 「**📚 読書感想文 (Book Report)**」をクリック

### Step 2: フォームに入力

以下の項目を入力してください：

| 項目 | 説明 | 例 |
|-----|------|-----|
| **書籍名** | 本のタイトル | AI時代に強い質問力 |
| **著者** | 著者名 | 鈴木 太郎 |
| **リンク** | Amazonリンクなど（任意） | https://amazon.co.jp/... |
| **読む前の目的** | なぜこの本を読んだか | AI活用の質問スキルを向上させたい |
| **得られた知識・気づき** | 読んで学んだこと | 質問の構造化が重要 |
| **実務における活用** | 仕事でどう使えるか | プロンプト設計に応用 |
| **良かった点・学び** | ポジティブな感想 | 実践的な例が豊富 |
| **難しかった点・合わなかった点** | 課題や改善点 | 専門用語が多い |
| **どんな人におすすめ？** | 読んでほしい人 | AIツールを使う全員 |

### Step 3: Issueを送信

1. 入力が完了したら、緑色の「**Submit new issue**」ボタンをクリック
2. 自動でPRが作成されます（1分ほどお待ちください）

### Step 4: PRをマージ

1. リポジトリの「**Pull requests**」タブを開く
2. 自分のPR（`feat: add book report '書籍名'`）をクリック
3. 内容を確認し、緑色の「**Merge pull request**」ボタンをクリック
4. 「**Confirm merge**」をクリック

> ⏳ マージから約1分後、Slackに通知が届き、ページが公開されます！

---

## 📖 Book Reports

- [Ai時代に強い質問力 読書感想文 (Issue 10)](./book_reports/2025-12-03-ai時代に強い質問力-読書感想文-10.md)
- [Ai駆動開発の教科書 読書感想文 (Issue 12)](./book_reports/2025-12-03-ai駆動開発の教科書-読書感想文-12.md)
- [書籍名 読書感想文 (Issue 66)](./book_reports/2025-12-05-書籍名-読書感想文-66.md)
- [Aaaaa (Issue 94)](./book_reports/2025-12-16-aaaaa-94.md)
- [Aaaaaa (Issue 85)](./book_reports/2025-12-16-aaaaaa-85.md)
- [Ai時代に強い質問力 (Issue 92)](./book_reports/2025-12-16-ai時代に強い質問力-92.md)
- [プログラマのためのgoogle Cloud Platform入門 (Issue 80)](./book_reports/2025-12-16-プログラマのためのgoogle-cloud-platform入門-サービスの全体像からクラウドネイテ-80.md)
- [Sssss (Issue 96)](./book_reports/2025-12-17-sssss-96.md)
- [Test Book Notification 10 (Issue 116)](./book_reports/2025-12-17-test-book-notification-10-116.md)
- [Test Book Notification 2 (Issue 100)](./book_reports/2025-12-17-test-book-notification-2-100.md)
- [Test Book Notification 3 (Issue 102)](./book_reports/2025-12-17-test-book-notification-3-102.md)
- [Test Book Notification 4 (Issue 104)](./book_reports/2025-12-17-test-book-notification-4-104.md)
- [Test Book Notification 5 (Issue 106)](./book_reports/2025-12-17-test-book-notification-5-106.md)
- [Test Book Notification 6 (Issue 108)](./book_reports/2025-12-17-test-book-notification-6-108.md)
- [Test Book Notification 7 (Issue 110)](./book_reports/2025-12-17-test-book-notification-7-110.md)
- [Test Book Notification 8 (Issue 112)](./book_reports/2025-12-17-test-book-notification-8-112.md)
- [Test Book Notification 9 (Issue 114)](./book_reports/2025-12-17-test-book-notification-9-114.md)
- [Test Book Notification 98 (Issue 98)](./book_reports/2025-12-17-test-book-notification-98.md)
- [Test Book Notification 12 (Issue 120)](./book_reports/2025-12-17-test-book-notification-12-120.md)
- [Test Book Notification 13 (Issue 122)](./book_reports/2025-12-17-test-book-notification-13-122.md)
- [Test Book Notification 14 (Issue 124)](./book_reports/2025-12-17-test-book-notification-14-124.md)
- [Test Book Notification 15 (Issue 126)](./book_reports/2025-12-17-test-book-notification-15-126.md)
- [Test Book Notification 16 (Issue 128)](./book_reports/2025-12-17-test-book-notification-16-128.md)
- [Test Book Notification 17 (Issue 130)](./book_reports/2025-12-17-test-book-notification-17-130.md)
- [Test Book Notification 18 (Issue 132)](./book_reports/2025-12-17-test-book-notification-18-132.md)
- [Test Book Notification 19 (Issue 134)](./book_reports/2025-12-17-test-book-notification-19-134.md)