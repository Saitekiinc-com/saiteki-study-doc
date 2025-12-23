# 書籍購入補助を受けるときのフロー

書籍購入補助を受ける場合の手順と、AIによる書籍選定の方法について説明します。

## 📖 書籍購入補助を受ける手順

書籍レポートを投稿するには、GitHubでIssueを作成します。
会社から書籍購入の補助を受ける場合は、以下のフローに従ってください。

| <span style="white-space: nowrap;">ステップ</span> | <span style="white-space: nowrap;">担当者</span> | アクション |
|:---:|:---:|---|
| 1 | <span style="white-space: nowrap;">**あなた**</span> | [📖 書籍探索Issueを作成](#how-to-search-book)（学びたい内容を入力） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171)) |
| 2 | <span style="white-space: nowrap;">**自動**</span> | AIが適切な書籍を推薦（**あくまで参考**） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677022878)) |
| 3 | <span style="white-space: nowrap;">**あなた**</span> | 購入する書籍を決定し、**書籍探索Issueにコメント**で報告<br>（書籍を特定できるように商品リンクを添付） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677026877)) |
| 4 | <span style="white-space: nowrap;">**あなた**</span> | [購入したい書籍の商品リンクを添付した（申請者）]にチェックを入れる |
| 5 | <span style="white-space: nowrap;">**あなた**</span> | 書籍を購入する |
| 6 | <span style="white-space: nowrap;">**あなた**</span> | Issueに領収書を添付してコメントし、[領収書を添付した (申請者)]にチェックを入れる ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677031542)) |
| 7 | <span style="white-space: nowrap;">**上長**</span> | 領収書を確認し、[承認済み (上長)]にチェックを入れる |
| 8 | <span style="white-space: nowrap;">**あなた**</span> | 書籍を読了 |
| 9 | <span style="white-space: nowrap;">**あなた**</span> | [📚 書籍レポートを作成](#how-to-post-report) |
| 10 | <span style="white-space: nowrap;">**自動**</span> | PRが自動作成される ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/pull/173)) |
| 11 | <span style="white-space: nowrap;">**上長**</span> | PRを上長がレビュー・マージ |
| 12 | <span style="white-space: nowrap;">**自動**</span> | Slackに通知 ＆ ページが公開 |

> 💡 **補足**: AIの推薦はあくまで参考です。推薦以外の書籍を購入しても問題ありません。

---

<a id="how-to-search-book"></a>
## 📖 AIによる書籍選定（購入補助申請）の方法

学びたいスキルや目標を入力すると、AIが適切な書籍を推薦します。
既存ナレッジベースの書籍レポートも参照して、その人に合った本を提案します。

### Step 1: Issue作成ページを開く

1. [**saiteki-study-doc リポジトリ**](https://github.com/Saitekiinc-com/saiteki-study-doc) にアクセス
2. 上部の「**Issues**」タブをクリック
3. 緑色の「**New issue**」ボタンをクリック
4. 「**AIによる書籍選定（購入補助申請）**」をクリック

### Step 2: フォームに入力

| 項目 | 説明 | 例 |
|-----|------|-----|
| **役割** | 現在の職種や役割 | Frontend Engineer |
| **経験年数** | エンジニア経験 | 3年 |
| **達成したい目標** | 作りたいもの、成し遂げたいこと | 個人開発でメモアプリを作りたい |
| **わかっていること** | 現在理解している技術・できること | Reactのコンポーネント作成、Props/Stateの管理 |
| **わかっていないこと** | 課題・苦手なこと | useEffectの依存配列の挙動が怪しい |

### Step 3: Issueを送信

1. 入力が完了したら、緑色の「**Create**」ボタンをクリック
2. AIがコメントで書籍を推薦（1-2分お待ちください）
3. 推薦された書籍を参考に購入を検討

---

<a id="how-to-post-report"></a>
## 📝 書籍レポートの投稿手順（購入補助あり）

**重要:** 新規Issue作成ではなく、**「AIによる書籍選定（購入補助申請）」Issueの子Issue (Sub-issue)** として作成してください。

1. 自身が作成した **「AIによる書籍選定（購入補助申請）」Issue** を開く
2. Issue内のサブタスク（またはCreate sub-issueボタン）から「書籍レポート」を作成する

以降のフォーム入力手順は「[書籍レポートを蓄積のみを行う場合](./report_only.md#post-report)」と同様です。
