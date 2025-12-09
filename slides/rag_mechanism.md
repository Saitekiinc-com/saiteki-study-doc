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
  grid-template-rows: 1fr 40px 1fr; /* 縦幅を縮小 */
  gap: 10px;
  text-align: center;
  margin-top: 10px; /* マージンを削減 */
  transform: scale(0.9); /* 全体を少し縮小して見切れ防止 */
  transform-origin: top center;
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

ただ漫然と読むのではなく、 **「自分は何を解決したいのか？」** を意識して読みましょう。

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

✅ Submitするだけで、あなたの学びが **チームの知識 (Knowledge Base)** として蓄積されます。

---

## 2. ✍️ 書く：未来の誰かのために (内容)

Issueテンプレートには、以下の項目を入力します。
**「目的」と「学び」** が検索のフック（鍵）となり、詳細な感想文全体を引き出します。

<div class="columns">
  <div class="col-text">
    <ul>
      <li>基本情報 (書籍名 / 著者 / リンク)</li>
      <li><span class="marker-key">🔑 読む前の目的</span> ➡️ <strong>「悩み」</strong>でヒット</li>
      <li><span class="marker-key">🔑 得られた知識</span> ➡️ <strong>「解決策」</strong>でヒット</li>
      <li>要約・Positive / Negative感想</li>
      <li>どんな人におすすめ？</li>
    </ul>
  </div>

  <div class="col-visual">
    <div class="mechanism-box">
      <div class="mech-keys">
        <div class="key-item">🔑 目的</div>
        <div class="key-item">🔑 知識</div>
      </div>
      <div class="mech-arrow">➡️ 検索ヒット ➡️</div>
      <div class="mech-doc">
        <div class="doc-header">📄 感想文 (全体)</div>
        <div class="doc-body">
          ・書籍情報<br>
          ・要約<br>
          ・良い点 / 悪い点<br>
          ・おすすめユーザー
        </div>
      </div>
    </div>
    <div class="mech-caption">鍵で見つけて、中身を詳しく読む</div>
  </div>
</div>

<style>
.columns {
  display: flex;
  gap: 20px;
  align-items: center;
}
.col-text { flex: 1; font-size: 24px; }
.col-text li { margin-bottom: 10px; list-style: none; }
.marker-key {
  background: #fff3cd;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  border: 1px solid #ffeeba;
}

.col-visual { flex: 1; }
.mechanism-box {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}
.mech-keys { display: flex; flex-direction: column; gap: 8px; }
.key-item {
  background: #fff;
  border: 2px solid #f1c40f;
  padding: 8px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.mech-arrow {
  color: #aaa;
  font-weight: bold;
  font-size: 16px;
  margin: 0 10px;
  text-align: center;
}
.mech-doc {
  background: #fff;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  flex: 1;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.doc-header {
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 18px;
  text-align: center;
}
.doc-body {
  font-size: 14px;
  line-height: 1.6;
  color: #555;
}
.mech-caption {
  text-align: center;
  font-size: 16px;
  color: #666;
  margin-top: 10px;
  font-weight: bold;
}
</style>


---

## 3. 🤖 繋ぐ：AIによる情報の整理 (裏側)

AIが、あなたの感想文を読み取り、検索可能な**ベクトルデータ**に変換します。

<div class="pipeline-container">
  <!-- Input Phase -->
  <div class="phase input">
    <div class="phase-label">1. Input (Markdown)</div>
    <div class="file-icon">📄 読書感想文</div>
    <div class="code-snippet">
      ## 目的<br>
      テストが...<br>
      ## 学び<br>
      KISS原則が...
    </div>
  </div>

  <div class="arrow">➡️</div>

  <!-- Processing Phase -->
  <div class="phase processing">
    <div class="phase-label">2. ベクトル化 (AI)</div>
    <div class="process-step">
      <div class="step-box">🧩 悩みChunk</div>
      <div class="step-arrow">➡️ 🤖 Embedding API ➡️</div>
      <div class="step-box vector">[0.1, 0.5, ...]</div>
    </div>
    <div class="process-step">
      <div class="step-box">💡 解決Chunk</div>
      <div class="step-arrow">➡️ 🤖 Embedding API ➡️</div>
      <div class="step-box vector">[0.8, 0.2, ...]</div>
    </div>
  </div>

  <div class="arrow">➡️</div>

  <!-- Output Phase -->
  <div class="phase output">
    <div class="phase-label">3. Indexing (JSON)</div>
    <div class="db-icon">🗄️ vectors.json</div>
    <div class="desc">意味検索用インデックス</div>
  </div>
</div>

<div class="caption">
<span class="reason-highlight">仕組み:</span>
感想文を <strong>「悩みコンテキスト」</strong> と <strong>「解決策コンテキスト」</strong> に分割し、それぞれを数値（ベクトル）化。<br>
これにより、「言葉が違っても意味が似ている」ものを探せるようになります。
</div>

<style>
.pipeline-container {
  display: flex;
  align-items: stretch; /* Make all boxes same height */
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  font-size: 14px;
}
.phase {
  background: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Center content vertically */
  min-height: 250px;
  flex: 1; /* Equal width */
}
.input { border-color: #3498db; background: #ebf5fb; }
.processing { border-color: #9b59b6; background: #f5eef8; }
.output { border-color: #2ecc71; background: #eafaf1; }

.phase-label {
  font-weight: bold;
  margin-bottom: 10px;
  color: #555;
  border-bottom: 2px solid rgba(0,0,0,0.1);
  width: 100%;
  text-align: center;
}

.file-icon { font-size: 40px; margin-bottom: 5px; }
.code-snippet {
  background: #fff;
  border: 1px solid #ccc;
  padding: 5px;
  font-family: monospace;
  font-size: 10px;
  text-align: left;
  width: 90%;
  color: #333;
}

.process-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 10px;
  background: #fff;
  padding: 5px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.step-box { font-weight: bold; font-size: 12px; }
.step-box.vector { font-family: monospace; color: #e67e22; }
.step-arrow { font-size: 10px; color: #999; }

.db-icon { font-size: 40px; margin-top: 20px; }
.desc { font-size: 12px; color: #666; text-align: center; }

.arrow {
  align-self: center; /* Center vertically relative to container */
  margin: 0 5px;
  color: #666;
  white-space: nowrap;
  font-size: 24px;
}
.caption {
  text-align: center;
  margin-top: 40px; /* Added space */
  font-size: 18px;
  color: #555;
}
</style>



---

## 3-2. 活用例：なぜ分けるのか？

感想文を**2つのカード**に分けることで、目的に応じて使い分けることができます。

<div class="use-cases">
  <div class="use-case case-analysis">
    <div class="case-title">🅰️ 組織課題の分析</div>
    <div class="case-visual">
      <div class="card-stack card-objective">😫悩み</div>
      <div class="card-stack card-objective">😫悩み</div>
      <div class="card-stack card-objective">😫悩み</div>
    </div>
    <div class="case-desc">全社員の<strong>「悩みカード」</strong>だけを集めれば、<br>「今、組織で何が起きているか？」<br>が一目瞭然になります。</div>
  </div>
  <div class="use-case case-solution">
    <div class="case-title">🅱️ ピンポイント解決</div>
    <div class="case-visual">
      <div class="query-box">Q. バグが治らない...</div>
      <div class="arrow-down">⬇ Match!</div>
      <div class="card-single card-solution">💡解決策カード</div>
    </div>
    <div class="case-desc">特定の悩みに対して、<br>最適な<strong>「解決策カード」</strong>だけを<br>ヒットさせることができます。</div>
  </div>
</div>

<style>
.use-cases {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 30px;
}
.use-case {
  background: #fff;
  border: 4px solid #eee;
  border-radius: 16px;
  padding: 20px;
  width: 45%;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.case-title {
  font-weight: bold;
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}
.case-visual {
  height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  background: #fafafa;
  border-radius: 8px;
  position: relative;
}
.card-stack {
  width: auto;
  min-width: 180px;
  padding: 10px 20px;
  border-radius: 8px;
  text-align: center;
  color: #c0392b;
  background: #fdedec;
  border: 2px solid #e74c3c;
  margin-top: -35px; /* 重ねる */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  font-weight: bold;
  white-space: nowrap; /* 改行禁止 */
}
.card-stack:first-child { margin-top: 0; }
.card-single {
  width: auto;
  min-width: 180px;
  padding: 15px 20px;
  border-radius: 8px;
  text-align: center;
  color: #27ae60;
  background: #eafaf1;
  border: 2px solid #2ecc71;
  font-weight: bold;
  white-space: nowrap; /* 改行禁止 */
}
.query-box {
  background: #eee;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 16px;
  margin-bottom: 5px;
}
.arrow-down { font-weight: bold; color: #ccc; margin-bottom: 5px; }
.case-desc {
  font-size: 18px;
  color: #555;
  text-align: center;
  line-height: 1.5;
}
</style>

---

## 4. 🤝 助ける：組織課題の分析 (全体)

蓄積された「悩みカード」をAIで**類似検索**することで、チーム全体の **「隠れたボトルネック」** を発見できます。

<div class="analysis-visual">
  <div class="search-phase">
    <div class="search-box">🔍 "最近、みんな何に困ってる？"</div>
    <div class="ai-process">
      <div class="ai-icon">🤖</div>
      <div class="process-arrow">類似した悩みを収集...</div>
    </div>
  </div>

  <div class="result-phase">
    <div class="result-cluster">
      <div class="cluster-label">🚨 傾向を発見！</div>
      <div class="cards-cluster">
        <div class="mini-card">😫 テストが難しい...</div>
        <div class="mini-card">😫 テストが終わらない...</div>
        <div class="mini-card">😫 テスト環境が重い...</div>
      </div>
      <div class="insight-box">
        課題は<strong>「テスト環境」</strong>にありそうです！
      </div>
    </div>
  </div>
</div>

<style>
.analysis-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin-top: 30px;
  background: #fdfefe;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #eee;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}
.search-phase {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.search-box {
  background: #fff;
  border: 2px solid #555;
  padding: 10px 20px;
  border-radius: 30px;
  font-weight: bold;
  font-size: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  color: #333;
}
.ai-process { display: flex; flex-direction: column; align-items: center; }
.ai-icon { font-size: 50px; }
.process-arrow { font-size: 16px; color: #666; font-weight: bold; margin-top: 5px; }

.result-phase {
  background: #fff;
  border: 3px solid #e74c3c;
  padding: 20px;
  border-radius: 12px;
  width: 320px;
  box-shadow: 0 4px 15px rgba(231, 76, 60, 0.2);
  position: relative;
}
.cluster-label {
  color: #e74c3c;
  font-weight: bold;
  font-size: 24px;
  margin-bottom: 15px;
  text-align: center;
}
.cards-cluster {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding: 10px;
  background: #fdedec;
  border-radius: 8px;
}
.mini-card {
  background: #fff;
  border: 1px solid #e74c3c;
  padding: 8px 12px;
  font-size: 18px;
  border-radius: 6px;
  color: #c0392b;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.insight-box {
  text-align: center;
  font-weight: bold;
  font-size: 20px;
  color: #333;
  line-height: 1.4;
}
.insight-box strong { color: #e74c3c; border-bottom: 3px solid #e74c3c; }
</style>

---

## 5. 🤝 助ける：書籍探索依頼

困ったときは、**Issue** でAIに相談できます。

1.  `Issues` タブ ➡️ `New issue` をクリック
2.  **「🔍 書籍探索依頼 (Book Search Request)」** を選択
3.  「〜〜について知りたい」と入力してSubmit！
4.  数秒後、AIが**コメント**で解決策となる本を教えてくれます。

✅ 誰でも見れるIssueで相談することで、チーム全体への知識共有にもなります。

---

## 6. 🤝 助ける：仲間を救う (実例)

例えば、後輩のエンジニアが...
「コードが複雑になりすぎて、改修が怖いです...」
とAIに相談したとします。

AIは、あなたが過去に書いた **『プリンシプル オブ プログラミング』** の感想文を見つけ出し、こう答えます。

> 「それなら、〇〇さんが読んだ『プリンシプル オブ プログラミング』がおすすめです。
> **KISS（シンプルにしておけ、愚か者よ）** という原則が参考になりますよ。」

あなたの過去の学びが、**時を超えて仲間を助ける瞬間**です。

---

<!-- _class: lead -->
## まとめ

<div class="summary-box">
  <div class="summary-line">「読む」を<strong>資産</strong>に。</div>
  <div class="summary-line">「書く」を<strong>救い</strong>に。</div>
</div>

<div class="summary-sub">
  あなたの1冊が、いつかチームの課題を解決する鍵になります。<br>
  ぜひ、積極的なアウトプットをお願いします！
</div>

<style>
.summary-box {
  background: #f8f9fa;
  border-left: 10px solid #0066cc;
  padding: 30px;
  margin: 40px auto;
  width: 80%;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.summary-line {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin: 10px 0;
  line-height: 1.4;
}
.summary-line strong {
  color: #0066cc;
  border-bottom: 4px solid #aaccff;
}
.summary-sub {
  text-align: center;
  font-size: 24px;
  color: #666;
  line-height: 1.6;
}
</style>


