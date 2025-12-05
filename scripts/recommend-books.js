const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const glob = require('glob');

const VECTORS_FILE = 'vectors.json';

// Simple Cosine Similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  // User input from command line args or environment variable
  const userRequest = process.env.USER_REQUEST || process.argv[2];
  if (!userRequest) {
    console.error('Error: User request details are required.');
    process.exit(1);
  }

  // Check for empty fields in the request string (simple heuristic)
  console.log("--- Debug: Received USER_REQUEST ---");
  console.log(userRequest);
  console.log("-----------------------------------");

  if (userRequest.includes('【役割】: \n') || userRequest.includes('【達成したい目標】: \n')) {
      console.warn('Warning: Some user request fields appear to be empty. Check issue parsing logic.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

  // 1. Load Vectors
  if (!fs.existsSync(VECTORS_FILE)) {
    console.error(`Error: ${VECTORS_FILE} not found. Run update-vectors.js first.`);
    process.exit(1);
  }
  const vectors = JSON.parse(fs.readFileSync(VECTORS_FILE, 'utf-8'));

  // 2. Embed Query
  const queryEmbeddingResult = await embeddingModel.embedContent(userRequest);
  const queryVector = queryEmbeddingResult.embedding.values;

  // 3. Vector Search
  const scoredVectors = vectors.map(vec => ({
    ...vec,
    score: cosineSimilarity(queryVector, vec.embedding)
  }));

  // Sort by score descending and take top K
  scoredVectors.sort((a, b) => b.score - a.score);
  const topK = scoredVectors.slice(0, 3); // Top 3 relevant reports

  console.error("--- Relevant Reports Found ---");
  topK.forEach(v => console.error(`[${v.score.toFixed(3)}] ${v.id}`));

  // 4. Generate Roadmap
  const context = topK.map(v => `File: ${v.id}\nContent:\n${v.content}`).join('\n---\n');

  // Read Learning Policy Guide - DISABLED
  const guideContent = '';
  // const guidePath = 'docs/training/personalization/guide.md';
  // if (fs.existsSync(guidePath)) {
  //   guideContent = fs.readFileSync(guidePath, 'utf-8');
  // } else {
  //   console.warn(`Warning: Learning policy guide not found at ${guidePath}`);
  // }

  // List available documentation for linking - DISABLED
  const docList = '';
  // const docFiles = glob.sync('docs/**/*.md');
  // const docList = docFiles.map(f => `- ${f}`).join('\n');

  const prompt = `
あなたはエンジニアリングマネージャーです。
以下の「チームメンバーによる読書感想文（ナレッジベース）」、「ユーザーのバックグラウンド」を元に、このユーザーに最適な**書籍**を提案してください。

## ユーザー情報
${userRequest}

## ナレッジベース
${context}

## 指示
1. **日本語**で出力してください。
2. **【最重要】ユーザー情報の優先**:
    *   提案は**必ず**上記の「ユーザー情報」に基づいて行ってください。
3. **ステップ0: ユーザープロファイルの確認**:
    *   回答の冒頭で、あなたが認識した「ユーザーの役割」、「経験年数」、「達成したい目標」、「わかっていること」「わかっていないこと」を復唱してください。
4. **ギャップ分析 (引き算方式)**:
    *   **Step 1: 目標の定義 (全体像)**: ユーザーの「達成したい目標」を達成するために必要な知識・スキル・経験を網羅的にリストアップしてください（これを「100」とします）。
    *   **Step 2: 現状の除外 (引き算)**: ユーザーの「わかっていること」や「経験年数」から、既に持っている知識を Step 1 のリストから除外してください（例としてこれを「20」とします）。
    *   **Step 3: ギャップの特定 (残りの課題)**: Step 1 から Step 2 を引いて残った項目を、このユーザーが今埋めるべき具体的な「ギャップ」として定義してください（例としてこれが「80」です）。
    *   **ステップ4**: この「80（例）」のギャップを埋めるための書籍選定に移ってください。
5. **書籍の選定プロセス (重要)**:
    *   **ステップ1 (ツール使用)**: ユーザーのギャップを埋めるのに適した書籍を探すために、必ず提供されたツール **\`searchGoogleBooks\`** を使用してください。
    *   **ステップ2**: ツールから返された書籍データ（タイトル、著者、説明、URL）を使って、書籍を推薦してください。
        *   **注意**: ツールが返す情報は「実在する書籍」の確実な証拠です。**ツールが返さなかった書籍を勝手に捏造してはいけません。**
        *   もし最初の検索で良い本が見つからなければ、キーワードを変えて何度か検索を行っても構いません。
6. **書籍の紹介方法**:
    *   書籍名には、ツールから取得した **GoogleブックスのページURL (\`infoLink\` または \`previewLink\`)** をリンクさせてください。
    *   形式: \`[{書籍名}]({URL})\`
    *   各書籍について、**「どのギャップが埋まるのか」**を具体的に記述してください。
7. 出力形式は **GitHub Issue** の本文としてそのまま使えるMarkdown形式にしてください。

## 出力フォーマット例
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
* {要素1}
* {要素2}

**現状の理解 (除外項目)**:
* {理解していること}

**埋めるべきギャップ (課題)**:
1. **{知識領域A}**: {具体的な不足内容}
2. **{知識領域B}**: {具体的な不足内容}

## 📚 推奨書籍 (Recommended Books)

### 1. 📖 [{書籍名}]({URL})
*   **著者**: {著者名}
*   **ポイント**: {この本の選定理由と埋められるギャップ}

**(以下同様)**
`;

  // Function Declaration for Google Books API
  const searchGoogleBooksDeclaration = {
    name: "searchGoogleBooks",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search query for finding books (e.g., 'project management', 'javascript beginner')."
        }
      },
      required: ["query"]
    }
  };

  const tools = [
    {
      functionDeclarations: [searchGoogleBooksDeclaration]
    }
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: tools
  });

  const chat = model.startChat({
      history: [
          {
              role: "user",
              parts: [{ text: prompt }]
          }
      ]
  });

  let generatedText = "";

  try {
    console.error(`Starting chat with model: gemini-2.5-flash...`);
    let result = await chat.sendMessage("おすすめの書籍を教えてください。");

    // Handle specific function calls loop
    // Note: The simple `generateContent` might not loop automatically for tools without recursion loop logic manually,
    // but `startChat` + `sendMessage` usually handles function calling turns IF we provide the response.
    // Let's implement a simple loop to handle function calls.

    // Max turns to prevent infinite loops
    let maxTurns = 5;
    let turn = 0;

    while (result.response.functionCalls() && turn < maxTurns) {
        turn++;
        const call = result.response.functionCalls()[0];
        if (call.name === "searchGoogleBooks") {
            const query = call.args.query;
            console.error(`[Tool Call] Searching Google Books for: "${query}"`);

            // Execute API Call
            const apiRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&langRestrict=ja`);
            const data = await apiRes.json();

            const books = data.items ? data.items.map(item => ({
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors,
                description: item.volumeInfo.description ? item.volumeInfo.description.substring(0, 200) + "..." : "No description",
                infoLink: item.volumeInfo.infoLink
            })) : [];

            console.error(`[Tool Result] Found ${books.length} books.`);

            // Send result back to model
            result = await chat.sendMessage([
                {
                    functionResponse: {
                        name: "searchGoogleBooks",
                        response: { books: books }
                    }
                }
            ]);
        }
    }

    const response = await result.response;
    generatedText = response.text();
    console.error(`Success!`);

  } catch (error) {
    console.error(`Failed to generate content. Error: ${error.message}`);
    process.exit(1);
  }

  if (!generatedText) {
     console.error("Failed to generate text after tool execution.");
     process.exit(1);
  }

  // No need for post-verification logic anymore!
  console.error("\n--- Generated Roadmap ---\n");
  console.log(generatedText);

  // Output to a file for GitHub Actions to pick up reliably
  fs.writeFileSync('roadmap_body.md', generatedText);
}
// Removed legacy checkLinksInText and isUrlAlive functions


main();
