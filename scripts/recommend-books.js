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


  // 1. Define System Instruction (Role & Strict Format)
  const systemInstruction = `
あなたは、企業の成長とメンバーの幸福を最大化するための学習ロードマップを作成する、世界最高の人材育成責任者（CLO）です。

**絶対的なルール**:
1. 提供されたツール \`searchGoogleBooks\` を必ず使用して、実在する書籍情報のみを使用すること。
2. **広範囲な探索**: まず複数のキーワードで検索を行い、**少なくとも10冊以上の候補**を見つけてください。その中から「ギャップを埋めるのに最適」な**上位3冊**を厳選して提案してください。
3. 書籍が見つかったら、必ずツール \`searchKnowledgeBase\` を使用して、社内のナレッジベース（読書感想文など）にその本に関する情報がないか確認すること。
4. **ギャップ分析のプロセス（思考手順）**:
    *   **Step 1: 目標の定義 (全体像)**: ユーザーの「達成したい目標」を達成するために必要な知識・スキル・経験を網羅的にリストアップしてください（これを「100」とします）。
    *   **Step 2: 現状の除外 (引き算)**: ユーザーの「わかっていること」や「経験年数」から、既に持っている知識を Step 1 のリストから除外してください（例としてこれを「20」とします）。
    *   **Step 3: ギャップの特定 (残りの課題)**: Step 1 から Step 2 を引いて残った項目を、このユーザーが今埋めるべき具体的な「ギャップ」として定義してください（例としてこれが「80」です）。
    *   **Step 4**: この「80（例）」のギャップを埋めるための書籍選定に移ってください。
5. 以下の「出力フォーマット（Markdown）」を**一言一句違わず遵守**すること。勝手な見出しや挨拶文を追加しないこと。

## 出力フォーマット
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

**現状の理解 (除外項目)**:
* {理解していること}

**埋めるべきギャップ (課題)**:
1. **{知識領域A}**: {具体的な不足内容}

## 📚 推奨書籍 (Recommended Books) ← ここには厳選した3冊のみ記載

### 1. 📖 [{書籍名}]({URL})
*   **著者**: {著者名}
*   **ポイント**: {この本の選定理由と埋められるギャップ}
*   **チームメンバーのレビュー**: {searchKnowledgeBaseで見つかった場合にのみ記述。見つからなければこの行ごと削除}

**(以下同様に3冊程度)**
`;

  // Function Declaration for Knowledge Base Search
  const searchKnowledgeBaseDeclaration = {
    name: "searchKnowledgeBase",
    parameters: {
        type: "OBJECT",
        properties: {
            bookTitle: {
                type: "STRING",
                description: "Title of the book to search in the knowledge base."
            }
        },
        required: ["bookTitle"]
    }
  };

  const tools = [
    {
      functionDeclarations: [searchGoogleBooksDeclaration, searchKnowledgeBaseDeclaration]
    }
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: tools,
    systemInstruction: systemInstruction
  });

  // 2. User Prompt (Task specific context)
  const userPrompt = `
以下のユーザーリクエストに基づいて、最適な学習ロードマップと書籍を提案してください。

## ユーザーリクエスト
${userRequest}

## 手順
1. ユーザーのプロファイルを分析し、目標と現状のギャップを特定する。
2. そのギャップを埋めるのに最適な書籍を \`searchGoogleBooks\` ツールを使って探す（複数回検索しても良い）。
3. 書籍が見つかったら、\`searchKnowledgeBase\` で社内レビューがあるか確認する。
4. 検索結果を元に、**System Instructionで指定されたフォーマットに従って**出力する。
`;

  const chat = model.startChat({
      history: [
          {
              role: "user",
              parts: [{ text: userPrompt }]
          }
      ]
  });

  let generatedText = "";



  // Load vectors if available
  let vectors = [];
  try {
      if (fs.existsSync('vectors.json')) {
          vectors = JSON.parse(fs.readFileSync('vectors.json', 'utf8'));
          console.error(`Loaded ${vectors.length} vectors from vectors.json`);
      } else {
          console.warn("vectors.json not found. KB search will return empty.");
      }
  } catch (e) {
      console.error("Failed to load vectors.json:", e);
  }

  // Embedding Model for KB Search
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

  try {
    console.error(`Starting chat with model: gemini-2.5-flash...`);
    let result = await chat.sendMessage("おすすめの書籍を教えてください。");

    let maxTurns = 15; // Increased for multiple checks
    let turn = 0;

    while (result.response.functionCalls() && turn < maxTurns) {
        turn++;
        const calls = result.response.functionCalls();
        const functionResponses = [];

        for (const call of calls) {
            if (call.name === "searchGoogleBooks") {
                const query = call.args.query;
                console.error(`[Tool Call] Searching Google Books for: "${query}"`);

                // Execute Google Books API Call
                try {
                    const apiRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=ja`);
                    const data = await apiRes.json();

                    const books = data.items ? data.items.map(item => ({
                        title: item.volumeInfo.title,
                        authors: item.volumeInfo.authors,
                        description: item.volumeInfo.description ? item.volumeInfo.description.substring(0, 200) + "..." : "No description",
                        infoLink: item.volumeInfo.infoLink
                    })) : [];
                    console.error(`[Tool Result] Found ${books.length} books.`);
                    functionResponses.push({
                        functionResponse: {
                            name: "searchGoogleBooks",
                            response: { books: books }
                        }
                    });
                } catch (e) {
                    console.error("Google Books Search Failed:", e);
                     functionResponses.push({
                        functionResponse: {
                            name: "searchGoogleBooks",
                            response: { error: "Search failed" }
                        }
                    });
                }
            } else if (call.name === "searchKnowledgeBase") {
                const bookTitle = call.args.bookTitle;
                console.error(`[Tool Call] Searching KB for: "${bookTitle}"`);

                try {
                    // Embed query
                    const embResult = await embeddingModel.embedContent(bookTitle);
                    const queryVec = embResult.embedding.values;

                    // Find best match
                    let bestMatch = null;
                    let maxScore = -1;

                    for (const vec of vectors) {
                        const score = cosineSimilarity(queryVec, vec.embedding);
                        if (score > maxScore) {
                            maxScore = score;
                            bestMatch = vec;
                        }
                    }

                    // Threshold (e.g., 0.65 for semantic match)
                    if (maxScore > 0.65 && bestMatch) {
                        console.error(`[Tool Result] KB Match Found: ${bestMatch.id} (Score: ${maxScore.toFixed(3)})`);
                        functionResponses.push({
                            functionResponse: {
                                name: "searchKnowledgeBase",
                                response: {
                                    found: true,
                                    score: maxScore,
                                    summary: bestMatch.content.substring(0, 500) // Truncate content for context
                                }
                            }
                        });
                    } else {
                        console.error(`[Tool Result] No KB Match (Max Score: ${maxScore.toFixed(3)})`);
                        functionResponses.push({
                             functionResponse: {
                                name: "searchKnowledgeBase",
                                response: { found: false }
                            }
                        });
                    }
                } catch (e) {
                    console.error("KB Search Failed:", e);
                    functionResponses.push({
                        functionResponse: {
                           name: "searchKnowledgeBase",
                           response: { error: "Search failed" }
                       }
                   });
                }
            }
        }

        // Send all results back
        result = await chat.sendMessage(functionResponses);
    }

    // Check if the loop ended because of tool call limit but model still wants to call tool
    if (result.response.functionCalls()) {
        console.warn("Max tool turns reached. Forcing response generation.");
        result = await chat.sendMessage("検索はこれで十分です。ここまでに見つかった書籍情報だけを使って、今すぐ回答を作成してください。");
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
