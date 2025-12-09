---
marp: true
theme: gaia
paginate: true
backgroundColor: #fefefe
header: 'Saiteki Study Doc'
footer: 'Reading Cycle'
style: |
  section {
    font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
    font-size: 30px; /* 少しフォントサイズを落として見切れ防止 */
  }
  h1 { color: #0066cc; }
  strong { color: #d63384; }
  img { box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px; }
---

<!-- _class: lead -->

# 読書を「チームの武器」に変える
## 知識循環サイクルとAI検索の役割

---

## 🔄 読書感想文の「知識サイクル」

このドキュメントサイトは、単なる「感想文置き場」ではありません。
あなたの**個人の学び**を、**チーム全体の課題解決**につなげるシステムです。

<div class="cycle-container">
  <div class="step step-1">
    <div class="icon">📖</div>
    <div class="label">1. 読む (Input)</div>
    <div class="desc">課題解決のヒントを探す</div>
  </div>
  <div class="arrow arrow-right">➡</div>
  <div class="step step-2">
    <div class="icon">✍️</div>
    <div class="label">2. 書く (Output)</div>
    <div class="desc">学びをIssueに投稿</div>
  </div>
  <div class="arrow arrow-down">⬇</div>
  <div class="step step-4">
    <div class="icon">🤝</div>
    <div class="label">4. 助ける (Impact)</div>
    <div class="desc">仲間の悩みを解決！</div>
  </div>
  <div class="arrow arrow-left">⬅</div>
  <div class="step step-3">
    <div class="icon">🤖</div>
    <div class="label">3. 繋ぐ (Connect)</div>
    <div class="desc">AIが悩みと解決策を整理</div>
  </div>
</div>

<style>
.cycle-container {
  display: grid;
  grid-template-columns: 1fr 50px 1fr;
  grid-template-rows: 1fr 50px 1fr;
  gap: 10px;
  text-align: center;
  margin-top: 20px;
}
.step {
  border: 4px solid #e0e0e0;
  border-radius: 16px;
  padding: 20px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.step-1 { border-color: #3498db; background: #eaf6ff; }
.step-2 { border-color: #e67e22; background: #fff5e6; }
.step-3 { border-color: #9b59b6; background: #f3e5f5; }
.step-4 { border-color: #2ecc71; background: #e8f5e9; }

.icon { font-size: 50px; margin-bottom: 10px; }
.label { font-weight: bold; font-size: 24px; margin-bottom: 5px; color: #333; }
.desc { font-size: 18px; color: #666; }

.arrow {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 40px;
  color: #ccc;
  font-weight: bold;
}
/* Grid Placement */
.step-1 { grid-column: 1; grid-row: 1; }
.arrow-right { grid-column: 2; grid-row: 1; }
.step-2 { grid-column: 3; grid-row: 1; }

.arrow-down { grid-column: 3; grid-row: 2; }

.step-3 { grid-column: 3; grid-row: 3; }
.arrow-left { grid-column: 2; grid-row: 3; transform: rotate(180deg); } /* Left arrow trick if standard char missing */
.step-4 { grid-column: 1; grid-row: 3; }

</style>

---

## 0. 📖 読む：目的意識を持つ

ただ漫然と読むのではなく、**「自分は何を解決したいのか？」**を意識して読みましょう。

*   **課題解決のための読書**:
    *   ❌ 「なんとなく有名だから読む」
    *   ⭕️ 「チームの雰囲気を良くするヒントを得るために読む」
*   **アクティブ・リーディング**:
    *   本に問いかけながら読む。「自分のチームならどう適用できる？」
    *   答えが見つかったら、それがそのまま **「解決策 (Solution)」** になります。

---

## 1. ✍️ 書く：投稿の手順

感想文は **GitHub Issue** として投稿します。

1.  GitHubのリポジトリを開く
2.  `Issues` タブ ➡️ `New issue` をクリック
3.  **「📚 読書感想文 (Book Report)」** テンプレートを選択
4.  フォームに沿って、「目的」「学び」などを入力してSubmit！

✅ 自動的にドキュメントサイトに変換され、AIの知識として登録されます。

---

## 2. ✍️ 書く：未来の誰かのために (内容)

Issueを書くとき、以下の2つが重要な「検索キー」になります。

*   **読む前の目的 (Objective)**:
    *   「〜〜で困っている」「〜〜を良くしたい」
    *   ➡️ 同じ悩みを持つ人が検索した時にヒットします。
*   **得られた知識 (Takeaways)**:
    *   「〜〜が解決策だ」「〜〜という考え方が大事」
    *   ➡️ 解決策を探している人にヒットします。


---

## 3. 🤖 繋ぐ：AI司書の仕事 (裏側)

<div class="split-container">
  <div class="source-doc">
    <div class="icon">📄</div>
    <div class="label">読書感想文</div>
    <div class="sub">（全文）</div>
  </div>
  <div class="split-arrow">
    <div class="scissors">✂️</div>
    <div class="arrow-line">➡</div>
    <div class="reason-label">検索用に<br>切り分け</div>
  </div>
  <div class="cards">
    <div class="card-group">
      <div class="card card-objective">
        <div class="card-icon">😫</div>
        <div class="card-content">
          <div class="card-title">悩みカード</div>
          <div class="card-desc">「〜〜で困っている」</div>
        </div>
      </div>
      <div class="match-arrow">⬅ <strong>「困った...」</strong> で検索した時にヒット</div>
    </div>
    <div class="card-group">
      <div class="card card-solution">
        <div class="card-icon">💡</div>
        <div class="card-content">
          <div class="card-title">解決策カード</div>
          <div class="card-desc">「〜〜が効果的だ」</div>
        </div>
      </div>
      <div class="match-arrow">⬅ <strong>「知りたい！」</strong> で検索した時にヒット</div>
    </div>
  </div>
</div>

<div class="caption">
  <span class="reason-highlight">理由: 検索意図に合わせるため</span><br>
  「悩み」と「解決策」を分けることで、ノイズのない検索が可能になります。
</div>

<style>
.split-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px; /* ギャップを広げる */
  margin-top: 10px;
}
.source-doc {
  background: #fdfefe;
  border: 2px solid #ccc;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  width: 140px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  flex-shrink: 0;
}
.split-arrow {
  text-align: center;
  font-size: 30px;
  color: #ccc;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.reason-label { font-size: 14px; color: #666; font-weight: bold; margin-top: -10px;}
.scissors { font-size: 40px; }
.cards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.card-group {
  display: flex;
  align-items: center;
  gap: 15px;
}
.card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 20px;
  border-radius: 12px;
  width: auto; /* 幅を自動調整 */
  min-width: 320px; /* 最低幅を確保 */
  white-space: nowrap; /* 改行禁止 */
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-left: 8px solid;
  background: #fff;
}
.card-objective { border-color: #e74c3c; background: #fdedec; }
.card-solution { border-color: #2ecc71; background: #eafaf1; }

.match-arrow {
  font-size: 18px;
  color: #555;
  background: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
}

.card-icon { font-size: 30px; }
.card-title { font-weight: bold; font-size: 20px; color: #333; }
.card-desc { font-size: 18px; color: #555; margin-left: auto; } /* 説明を右寄せ */
.caption {
  text-align: center;
  margin-top: 20px;
  font-size: 20px;
  color: #555;
}
.reason-highlight {
  color: #d63384;
  font-weight: bold;
  border-bottom: 2px solid #d63384;
}
</style>

---

## 4. 🤝 助ける：書籍探索依頼

困ったときは、**Issue** でAI司書に相談できます。

1.  `Issues` タブ ➡️ `New issue` をクリック
2.  **「🔍 書籍探索依頼 (Book Search Request)」** を選択
3.  「〜〜について知りたい」と入力してSubmit！
4.  数秒後、AIが**コメント**で解決策となる本を教えてくれます。

✅ 誰でも見れるIssueで相談することで、チーム全体への知識共有にもなります。

---

## 5. 🤝 助ける：仲間を救う (実例)

例えば、半年後に新しく入ったメンバーが...
「チームの雰囲気が悪くて悩んでいるんです...」
とAIに相談したとします。

AIは、あなたが過去に書いた **『Team Geek』という書籍** の感想文を見つけ出し、こう答えます。

> 「それなら、〇〇さんが読んだ書籍『Team Geek』がおすすめです。
> **HRT（謙虚・尊敬・信頼）**という考え方が役立つようですよ。」

あなたの過去の学びが、**時を超えて仲間を助ける瞬間**です。

---

<!-- _class: lead -->
## まとめ

### 読んだら、書こう。
### 書けば、誰かが助かる。

あなたの1冊が、チームの課題を解決する鍵になります。

**「あなたの悩み」は、いつか「誰かの悩み」になります。**

ぜひ、積極的なアウトプットをお願いします！

---
