
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

  const STATUS_HEADER = '## ステータス管理 (Status)';
  const CHECKBOX_RECEIPT = '- [ ] 領収書を添付した';
  const CHECKBOX_APPROVED = '- [ ] 承認済み';

  // 注: 単純に追加する場合、混合状態を適切にサポートできません。
  // しかし厳密には、ヘッダーがない場合は追加します。

  if (!body.includes(STATUS_HEADER)) {
    console.log('Status section missing. Appending...');
    body += `\n\n${STATUS_HEADER}\n以下のチェックボックスは、進捗に応じてチェックを入れてください。\n${CHECKBOX_RECEIPT}\n${CHECKBOX_APPROVED}`;
    bodyChanged = true;
  }

  // --- 双方向同期ロジック ---

  // 1. チェックボックス -> ラベル (本文でチェックボックスがオンの場合、ラベルが存在することを確認)
  const isReceiptChecked = body.includes('- [x] 領収書を添付した');
  const isApprovedChecked = body.includes('- [x] 承認済み');

  const labelsToAdd = [];
  const labelsToRemove = [];

  // 2. ラベル -> チェックボックス (ラベルが存在する場合、チェックボックスがオンであることを確認)
  // このロジックは注意が必要です。ユーザーがチェックボックスをクリックしたばかりの場合、本文は [x] です。ラベルを追加する必要があります。
  // ユーザーがラベルを追加したばかりの場合、本文は [ ] です。チェックボックスを [x] に更新する必要があります。
  // 可能であればイベントのソースを優先しますが、ここでは状態を同期するだけです。
  // "True" state is easier to treat as union? Or prioritize one?
  // User said "勝手にチェックされる" (Automatically checked).
  // This implies: Label was present -> Checkbox got checked.
  // IF the label was NOT present, but workflow added it?

  // Let's implement robust sync:
  // - If Checkbox is [x] -> Add Label
  // - If Label is present -> Mark Checkbox [x]
  // - If Checkbox is [ ] -> Remove Label (User unchecked it)
  // - If Label is missing -> Mark Checkbox [ ] (User removed label)

  // 有効な [x] のチェックを外すと、ラベルは削除されるべきです。
  // ラベルを削除すると、[x] は [ ] になるべきです。
  //
  // 方向を区別するために、トリガーを確認するのが理想的です。
  // トリガー: 'labeled' -> チェックボックスへ伝播
  // トリガー: 'edited' (チェックボックス変更) -> ラベルへ伝播
  // トリガー: 'opened' -> 初期化

  const action = context.payload.action;

  // ロジック:
  // アクションが 'labeled' または 'unlabeled' の場合: ラベル -> チェックボックスの一貫性を検証
  // アクションが 'edited' (本文変更) の場合: チェックボックス -> ラベルの一貫性を検証

  if (action === 'labeled' || action === 'unlabeled') {
     console.log(`Action is ${action}. Syncing Label -> Checkbox`);
     // ラベル -> チェックボックス同期
     // 領収書
     if (currentLabels.includes('領収書あり')) {
       if (body.includes('- [ ] 領収書を添付した')) {
         body = body.replace('- [ ] 領収書を添付した', '- [x] 領収書を添付した');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 領収書を添付した')) {
         body = body.replace('- [x] 領収書を添付した', '- [ ] 領収書を添付した');
         bodyChanged = true;
       }
     }

     // 承認済み
     if (currentLabels.includes('承認済み')) {
       if (body.includes('- [ ] 承認済み')) {
         body = body.replace('- [ ] 承認済み', '- [x] 承認済み');
         bodyChanged = true;
       }
     } else {
       if (body.includes('- [x] 承認済み')) {
         body = body.replace('- [x] 承認済み', '- [ ] 承認済み');
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
