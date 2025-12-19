
/**
 * Issue 本文のチェックボックスと Issue ラベルを同期させます。
 * また、ステータスチェックリストが不足している場合は追加します。
 *
 * @param {Object} params
 * @param {Object} params.github - GitHub API クライアント
 * @param {Object} params.context - Actions コンテキスト
 * @param {Object} params.core - Actions core
 */
async function syncLabels({ github, context, core }) {
  const issue_number = context.payload.issue.number;
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  // ローカルペイロードとの競合状態を避けるため、最新の Issue データを取得
  const { data: issue } = await github.rest.issues.get({
    owner,
    repo,
    issue_number
  });

  let body = issue.body || '';
  const currentLabels = issue.labels.map(l => l.name);
  let bodyChanged = false;

  // --- チェックボックス定義 ---
  const STATUS_HEADER = '## ステータス管理 (Status)';
  // 新しいチェックボックス: 購入リンク添付
  const CHECKBOX_LINK = '- [ ] 購入したい書籍の商品リンクを添付した（申請者）';
  const CHECKBOX_RECEIPT = '- [ ] 領収書を添付した (申請者)';
  const CHECKBOX_APPROVED = '- [ ] 承認済み (上長)';

  // --- 旧形式からの移行 (Migration) ---

  // 1. 古い表記の置換
  // 以前の "購入したい書籍の商品リンクを添付した" (申請者なし) を置換
  if (body.includes('- [ ] 購入したい書籍の商品リンクを添付した') && !body.includes(CHECKBOX_LINK)) {
    body = body.replace('- [ ] 購入したい書籍の商品リンクを添付した', CHECKBOX_LINK);
    bodyChanged = true;
  }
  if (body.includes('- [x] 購入したい書籍の商品リンクを添付した') && !body.includes(CHECKBOX_LINK)) {
    body = body.replace('- [x] 購入したい書籍の商品リンクを添付した', '- [x] 購入したい書籍の商品リンクを添付した（申請者）');
    bodyChanged = true;
  }

  if (body.includes('- [ ] 領収書を添付した') && !body.includes(CHECKBOX_RECEIPT) && !body.includes('- [ ] 領収書を添付した (申請者)')) {
    body = body.replace('- [ ] 領収書を添付した', CHECKBOX_RECEIPT);
    bodyChanged = true;
  }
  if (body.includes('- [x] 領収書を添付した') && !body.includes(CHECKBOX_RECEIPT) && !body.includes('- [x] 領収書を添付した (申請者)')) {
    body = body.replace('- [x] 領収書を添付した', '- [x] 領収書を添付した (申請者)');
    bodyChanged = true;
  }
  if (body.includes('- [ ] 承認済み') && !body.includes(CHECKBOX_APPROVED) && !body.includes('- [ ] 承認済み (上長)')) {
    body = body.replace('- [ ] 承認済み', CHECKBOX_APPROVED);
    bodyChanged = true;
  }
  if (body.includes('- [x] 承認済み') && !body.includes(CHECKBOX_APPROVED) && !body.includes('- [x] 承認済み (上長)')) {
    body = body.replace('- [x] 承認済み', '- [x] 承認済み (上長)');
    bodyChanged = true;
  }

  // 2. 新しいチェックボックスの挿入 (領収書チェックの前)
  // 既に存在するか確認 (完了状態も含む)
  const isLinkMsgPresent = body.includes('購入したい書籍の商品リンクを添付した（申請者）');

  if (!isLinkMsgPresent) {
     if (body.includes(CHECKBOX_RECEIPT)) {
         body = body.replace(CHECKBOX_RECEIPT, `${CHECKBOX_LINK}\n${CHECKBOX_RECEIPT}`);
         bodyChanged = true;
     } else if (body.includes('- [x] 領収書を添付した (申請者)')) {
         body = body.replace('- [x] 領収書を添付した (申請者)', `${CHECKBOX_LINK}\n- [x] 領収書を添付した (申請者)`);
         bodyChanged = true;
     }
  }

  // 注: 単純に追加する場合、混合状態を適切にサポートできません。
  // しかし厳密には、ヘッダーがない場合は追加します。

  if (!body.includes(STATUS_HEADER)) {
    console.log('Status section missing. Appending...');
    // 順番: リンク添付 -> 領収書 -> 承認
    body += `\n\n${STATUS_HEADER}\n以下のチェックボックスは、進捗に応じてチェックを入れてください。\n${CHECKBOX_LINK}\n${CHECKBOX_RECEIPT}\n${CHECKBOX_APPROVED}`;
    bodyChanged = true;
  }


  // --- 双方向同期ロジック ---

  // 1. チェックボックス -> ラベル (本文でチェックボックスがオンの場合、ラベルが存在することを確認)
  const isReceiptChecked = body.includes('- [x] 領収書を添付した (申請者)');
  const isApprovedChecked = body.includes('- [x] 承認済み (上長)');

  const labelsToAdd = [];
  const labelsToRemove = [];

  const action = context.payload.action;

  // ロジック:
  // アクションが 'labeled' または 'unlabeled' の場合: ラベル -> チェックボックスの一貫性を検証

  if (action === 'labeled' || action === 'unlabeled') {
     console.log(`Action is ${action}. Syncing Label -> Checkbox`);
     // ラベル -> チェックボックス同期
     // 領収書
     if (currentLabels.includes('領収書あり')) {
       if (body.includes('- [ ] 領収書を添付した (申請者)')) {
         body = body.replace('- [ ] 領収書を添付した (申請者)', '- [x] 領収書を添付した (申請者)');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 領収書を添付した (申請者)')) {
         body = body.replace('- [x] 領収書を添付した (申請者)', '- [ ] 領収書を添付した (申請者)');
         bodyChanged = true;
       }
     }

     // 承認済み
     if (currentLabels.includes('承認済み')) {
       if (body.includes('- [ ] 承認済み (上長)')) {
         body = body.replace('- [ ] 承認済み (上長)', '- [x] 承認済み (上長)');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 承認済み (上長)')) {
         body = body.replace('- [x] 承認済み (上長)', '- [ ] 承認済み (上長)');
         bodyChanged = true;
       }
     }

  } else {
    // アクションは 'opened', 'edited', または 'reopened'。
    // 本文のチェックボックスの状態（ユーザーインタラクション）を優先します。
    console.log(`Action is ${action}. Syncing Checkbox -> Label`);

    // 領収書
    if (isReceiptChecked) {
      if (!currentLabels.includes('領収書あり')) labelsToAdd.push('領収書あり');
    } else {
      if (currentLabels.includes('領収書あり')) labelsToRemove.push('領収書あり');
    }

    // 承認済み
    if (isApprovedChecked) {
      if (!currentLabels.includes('承認済み')) labelsToAdd.push('承認済み');
    } else {
      if (currentLabels.includes('承認済み')) labelsToRemove.push('承認済み');
    }
  }

  // --- 実行 ---

  // 必要に応じて本文を更新
  if (bodyChanged) {
    console.log('Updating issue body...');
    await github.rest.issues.update({
      owner, repo, issue_number, body
    });
  }

  // ヘルパー定義
  const ensureLabel = async (name, color) => {
    try {
      await github.rest.issues.getLabel({ owner, repo, name });
    } catch (e) {
      if (e.status === 404) {
        await github.rest.issues.createLabel({ owner, repo, name, color });
      }
    }
  };

  // ラベルの処理
  if (labelsToAdd.length > 0) {
    // 最初に存在確認
    if (labelsToAdd.includes('領収書あり')) await ensureLabel('領収書あり', '1D76DB');
    if (labelsToAdd.includes('承認済み')) await ensureLabel('承認済み', '0E8A16');

    console.log(`Adding labels: ${labelsToAdd.join(', ')}`);
    await github.rest.issues.addLabels({
      owner, repo, issue_number, labels: labelsToAdd
    });
  }

  if (labelsToRemove.length > 0) {
    console.log(`Removing labels: ${labelsToRemove.join(', ')}`);
    for (const label of labelsToRemove) {
      try {
        await github.rest.issues.removeLabel({
          owner, repo, issue_number, name: label
        });
      } catch (e) {
        // 404 は無視してチェックしない
        console.log(`Failed to remove label ${label}: ${e.message}`);
      }
    }
  }
}

module.exports = { syncLabels };
