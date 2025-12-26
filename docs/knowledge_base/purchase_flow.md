# 書籍購入・レポート投稿フロー

書籍購入補助を受ける場合の手順と、書籍レポートのみを投稿する場合の手順について説明します。

## 1. 書籍購入補助を受ける場合

書籍レポートを投稿するには、GitHubでIssueを作成します。
会社から書籍購入の補助を受ける場合は、以下のフローに従ってください。

| <span style="white-space: nowrap;">ステップ</span> | <span style="white-space: nowrap;">担当者</span> | アクション |
|:---:|:---:|---|
| 1 | <span style="white-space: nowrap;">**あなた**</span> | [📖 書籍探索Issueを作成](./issue_book_search)（学びたい内容を入力） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171)) |
| 2 | <span style="white-space: nowrap;">**自動**</span> | AIが適切な書籍を推薦（**あくまで参考**） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677022878)) |
| 3 | <span style="white-space: nowrap;">**あなた**</span> | 購入する書籍を決定し、**書籍探索Issueにコメント**で報告<br>（書籍を特定できるように商品リンクを添付） ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677026877)) |
| 4 | <span style="white-space: nowrap;">**あなた**</span> | [購入したい書籍の商品リンクを添付した（申請者）]にチェックを入れる |
| 5 | <span style="white-space: nowrap;">**あなた**</span> | 書籍を購入する |
| 6 | <span style="white-space: nowrap;">**あなた**</span> | Issueに領収書を添付してコメントし、[領収書を添付した (申請者)]にチェックを入れる ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/issues/171#issuecomment-3677031542)) |
| 7 | <span style="white-space: nowrap;">**上長**</span> | 領収書を確認し、[承認済み (上長)]にチェックを入れる |
| 8 | <span style="white-space: nowrap;">**あなた**</span> | 書籍を読了 |
| 9 | <span style="white-space: nowrap;">**あなた**</span> | [📚 書籍レポートを作成](./issue_book_report) |
| 10 | <span style="white-space: nowrap;">**自動**</span> | PRが自動作成される ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/pull/173)) |
| 11 | <span style="white-space: nowrap;">**上長**</span> | PRを上長がレビュー・マージ |
| 12 | <span style="white-space: nowrap;">**自動**</span> | Slackに通知 ＆ ページが公開 |

> 💡 **補足**: AIの推薦はあくまで参考です。推薦以外の書籍を購入しても問題ありません。

## 2. 書籍レポートのみ投稿する場合（購入補助なし）

自分で購入した本や、既に読んだ本について感想を投稿する場合のフローです。

| ステップ | 担当者 | アクション |
|---------|--------|-----------|
| 1 | **あなた** | [📚 書籍レポートを作成](./issue_book_report) |
| 2 | **自動** | PRが自動作成される |
| 3 | **上長** | PRをレビュー・マージ ([例](https://github.com/Saitekiinc-com/saiteki-study-doc/pull/173)) |
| 4 | **自動** | Slackに通知 ＆ ページが公開 |
