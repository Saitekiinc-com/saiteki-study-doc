const fs = require('fs');
const aiClient = require('./lib/ai-client');
const store = require('./lib/store');
const googleBooks = require('./lib/google-books');
const vectorSearch = require('./lib/vector-search');

/**
 * メイン処理
 */
async function main() {
  // 1. 入力チェック
  const userRequest = process.env.USER_REQUEST || process.argv[2];
  if (!userRequest) {
    console.error('[Error] User request details are required.');
    process.exit(1);
  }

  console.log("--- Debug: Received USER_REQUEST ---");
  console.log(userRequest);
  console.log("-----------------------------------");

  if (userRequest.includes('【役割】: \n')) {
      console.warn('[Warn] Input fields might be empty.');
  }

  // 2. ナレッジベースの読み込み
  const { vectors, documentsMap } = store.loadKnowledgeBase();

  // 3. コンテキストガイドの読み込み
  let aiNativeGuide = "";
  try {
    if (fs.existsSync('docs/training/ai_native_guide.md')) {
        aiNativeGuide = fs.readFileSync('docs/training/ai_native_guide.md', 'utf-8');
    }
  } catch (e) {
      console.warn("[Warn] Failed to read context guides:", e);
  }

  // 4. システムプロンプト定義
  const systemInstruction = `
你是企業の成長とメンバーの幸福を最大化するための学習ロードマップを作成する、世界最高の人材育成責任者（CLO）です。

## 出力フォーマット (Output Format)
以下のフォーマットを**一言一句違わず遵守**すること。勝手な見出しや挨拶文を追加しないこと。

# 📚 書籍提案: {達成したい目標}編

## 👤 ユーザープロファイル確認
* **役割**: {認識した役割}
* **経験年数**: {認識した経験年数}
* **目標**: {認識した目標}
* **わかっていること**: {認識したわかっていること}
* **わかっていないこと**: {認識したわかっていないこと}

## 🎯 目標 (Objective)
**{ユーザーの目標}**

## 📊 ギャップ分析 (Gap Analysis)
**目標達成に必要な要素 (全体像)**:
* {要素1} (※組織のコンテキストに基づき具体化)

**現状の理解 (除外項目)**:
* {理解していること}

**埋めるべきギャップ (課題)**:
1. **{知識領域A}**: {具体的な不足内容}

## 📚 推奨書籍 (Recommended Books)

### 1. 📖 [{書籍名}]({URL})
*   **著者**: {著者名}
*   **ポイント**: {この本の選定理由と埋められるギャップ}
*   **チームメンバーのレビュー**:社内ナレッジ（読書感想文）が見つかった場合、**上位1〜2件に絞って**以下の形式で記述してください。
    *   [レビューの要約] ({Original Issue URL})
    *   (例: 「朝会のネタに困っていたが、この本のアイスブレイク集が役立った」 (https://github.com/.../issues/123))
    **ナレッジが見つからない場合は、この項目自体を絶対に表示しないでください。**

**(以下同様)**

## 絶対的なルール (Absolute Rules)
1. 提供されたツール \`searchGoogleBooks\` を必ず使用して、実在する書籍情報のみを使用すること。
2. **広範囲な探索**: まず複数のキーワードで検索を行い、**少なくとも10冊以上の候補**を見つけてください。その中から「ギャップを埋めるのに最適」な書籍を**上限を設けずにすべて**提案してください。該当する本が多ければ多いほど良いです。
3. 書籍が見つかったら、必ずツール \`searchKnowledgeBase\` を使用して、社内のナレッジベース（読書感想文など）にその本に関する情報がないか確認すること。
4. **ギャップ分析のプロセス（思考手順）**:
    *   **Step 1: 目標の定義 (全体像)**: ユーザーの「達成したい目標」を達成するために必要な知識・スキル・経験を網羅的にリストアップしてください（これを「100」とします）。**この際、後述する「組織のコンテキスト」の方針に沿って、具体的な目標を設定してください。**
    *   **Step 2: 現状の除外 (引き算)**: ユーザーの「わかっていること」や「経験年数」から、既に持っている知識を Step 1 のリストから除外してください（例としてこれを「20」とします）。
    *   **Step 3: ギャップの特定 (残りの課題)**: Step 1 から Step 2 を引いて残った項目を、このユーザーが今埋めるべき具体的な「ギャップ」として定義してください（例としてこれが「80」です）。
    *   **Step 4: 適合性チェック (Match)**: 検索で見つかった書籍（特に社内レビュー）については、その「おすすめ対象（Recommend To）」を確認し、今回のユーザー（役割・経験年数）にマッチするか判断してください。明らかにミスマッチな場合（例: シニアに超初心者本）は除外または注釈を入れてください。
    *   **Step 5**: これらの分析に基づき、最適な書籍を選定・提案してください。

## 組織のコンテキスト (Organization Context)
以下の指針を**深く理解し、遵守**してください。書籍選定や目標設定の際は、これらの指針に合致するものを高く評価してください。

<organization_guide>
${aiNativeGuide}
</organization_guide>
`;

  // 5. ツールの準備とチャット開始
  const toolDeclarations = [
    googleBooks.declaration,
    vectorSearch.kbDeclaration,
    vectorSearch.reviewDeclaration
  ];

  const chat = aiClient.getChatModel(toolDeclarations, systemInstruction).startChat({
      history: [
          {
              role: "user",
              parts: [{ text: `以下のユーザーリクエストに基づいて、最適な学習ロードマップと書籍を提案してください。\n\n## ユーザーリクエスト\n${userRequest}\n\n## 手順\n1. プロファイル分析\n2. searchGoogleBooks と searchInternalReviews で書籍探索\n3. ギャップ分析と推奨リスト作成\n4. searchKnowledgeBase で詳細確認（任意）\n5. フォーマット通りに出力` }]
          }
      ]
  });

  // 6. メインループ (Tool Execution Loop)
  try {
    console.error(`Starting chat with model: gemini-2.5-flash...`);
    let result = await chat.sendMessage("おすすめの書籍を教えてください。");
    let maxTurns = 15;
    let turn = 0;
    let generatedText = "";

    while (result.response.functionCalls() && turn < maxTurns) {
        turn++;
        const calls = result.response.functionCalls();
        const functionResponses = [];

        for (const call of calls) {
            let response = {};
            // ツールごとの処理を分岐
            if (call.name === "searchGoogleBooks") {
                response = await googleBooks.searchBooks(call.args.query);
            } else if (call.name === "searchKnowledgeBase") {
                response = await vectorSearch.searchKnowledgeBase(call.args.bookTitle, vectors, documentsMap);
            } else if (call.name === "searchInternalReviews") {
                response = await vectorSearch.searchInternalReviews(call.args.topic, vectors, documentsMap);
            }

            // 結果を詰める
            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: response
                }
            });
        }

        // ツール結果をAIに返して次のターンへ
        result = await chat.sendMessage(functionResponses);
    }

    // 規定回数を超えた場合の強制終了処理
    if (result.response.functionCalls()) {
        console.warn("[Warn] Max tool turns reached. Forcing response generation.");
        result = await chat.sendMessage("検索はこれで十分です。ここまでに見つかった書籍情報だけを使って、今すぐ回答を作成してください。");
    }

    const response = await result.response;
    generatedText = response.text();
    console.error(`Success!`);

    if (!generatedText) throw new Error("Generated text is empty.");

    // 7. 結果出力
    console.error("\n--- Generated Roadmap ---\n");
    console.log(generatedText);
    fs.writeFileSync('roadmap_body.md', generatedText);

  } catch (error) {
    console.error(`[Fatal Error] Failed to generate content: ${error.message}`);
    process.exit(1);
  }
}

main();
