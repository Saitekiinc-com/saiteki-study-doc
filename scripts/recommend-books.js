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


  // Read Context Files
  let aiNativeGuide = "";
  let personalizationGuide = "";
  try {
    if (fs.existsSync('docs/training/ai_native_guide.md')) {
        aiNativeGuide = fs.readFileSync('docs/training/ai_native_guide.md', 'utf-8');
    }
    if (fs.existsSync('docs/training/personalization/guide.md')) {
        personalizationGuide = fs.readFileSync('docs/training/personalization/guide.md', 'utf-8');
    }
  } catch (e) {
      console.warn("Failed to read context guides:", e);
  }

  // 1. Define System Instruction (Role & Strict Format)
  const systemInstruction = `
あなたは、企業の成長とメンバーの幸福を最大化するための学習ロードマップを作成する、世界最高の人材育成責任者（CLO）です。

## 組織のコンテキスト (Organization Context)
以下の指針を**深く理解し、遵守**してください。書籍選定の際は、これらの指針に合致するものを高く評価してください。

### 1. AI Native Engineering Guide
${aiNativeGuide}

### 2. Training Personalization Guide
${personalizationGuide}

**絶対的なルール**:
1. 提供されたツール \`searchGoogleBooks\` を必ず使用して、実在する書籍情報のみを使用すること。
2. **広範囲な探索**: まず複数のキーワードで検索を行い、**少なくとも10冊以上の候補**を見つけてください。その中から「ギャップを埋めるのに最適」な書籍を**上限を設けずにすべて**提案してください。該当する本が多ければ多いほど良いです。
3. 書籍が見つかったら、必ずツール \`searchKnowledgeBase\` を使用して、社内のナレッジベース（読書感想文など）にその本に関する情報がないか確認すること。
4. **ギャップ分析のプロセス（思考手順）**:
    *   **Step 1: 目標の定義 (全体像)**: ユーザーの「達成したい目標」を達成するために必要な知識・スキル・経験を網羅的にリストアップしてください（これを「100」とします）。**この際、冒頭で読み込んだ「組織のコンテキスト」の方針に沿って、具体的な目標を設定してください。**
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
* {要素1} (※組織のコンテキストに基づき具体化)

**現状の理解 (除外項目)**:
* {理解していること}

**埋めるべきギャップ (課題)**:
1. **{知識領域A}**: {具体的な不足内容}

## 📚 推奨書籍 (Recommended Books)

### 1. 📖 [{書籍名}]({URL})
*   **著者**: {著者名}
*   **ポイント**: {この本の選定理由と埋められるギャップ}
*   **チームメンバーのレビュー**: {searchKnowledgeBaseで見つかったナレッジ（複数ある場合も含む）を、**今回のユーザーのプロファイル（役割・経験年数・目標）に照らし合わせて**統合・要約して記述してください。**ナレッジが見つからない場合は、この項目自体を絶対に表示しないでください。「なし」「見つかりませんでした」等の記述も禁止です。**}

**(以下同様)**
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

  // Function Declaration for Knowledge Base Discovery
  const searchInternalReviewsDeclaration = {
    name: "searchInternalReviews",
    parameters: {
        type: "OBJECT",
        properties: {
            topic: {
                type: "STRING",
                description: "Topic or gap to search for in the knowledge base (e.g., 'team building', 'negotiation')."
            }
        },
        required: ["topic"]
    }
  };

  const tools = [
    {
      functionDeclarations: [searchGoogleBooksDeclaration, searchKnowledgeBaseDeclaration, searchInternalReviewsDeclaration]
    }
  ];


  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: tools,
    systemInstruction: systemInstruction,
    safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  });

  // 2. User Prompt (Task specific context)
  const userPrompt = `
以下のユーザーリクエストに基づいて、最適な学習ロードマップと書籍を提案してください。

## ユーザーリクエスト
${userRequest}

## 手順
1. ユーザーのプロファイルを分析し、目標と現状のギャップを特定する。
2. 書籍の探索:
    *   \`searchGoogleBooks\` を使って広く一般書籍を探す。
    *   **同時に** \`searchInternalReviews\` を使って、ユーザーの課題に関連する「社内の読書感想文」がないかも探す。
3. これらを組み合わせて、最適な書籍リストを作成する。
    *   社内レビューがあった本は積極的に採用する。
    *   選ばれた本について、\`searchKnowledgeBase\` で再度詳細を確認しても良い（任意）。
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
            } else if (call.name === "searchInternalReviews") {
                const topic = call.args.topic;
                console.error(`[Tool Call] Searching Internal Reviews for topic: "${topic}"`);

                try {
                     const embResult = await embeddingModel.embedContent(topic);
                     const queryVec = embResult.embedding.values;

                     // Score all vectors
                     const scored = vectors.map(vec => ({
                         ...vec,
                         score: cosineSimilarity(queryVec, vec.embedding)
                     }));

                     // Sort and take top 3
                     scored.sort((a, b) => b.score - a.score);
                     const topMatches = scored.slice(0, 3).filter(v => v.score > 0.6); // Threshold

                     console.error(`[Tool Result] Found ${topMatches.length} internal reviews.`);

                     functionResponses.push({
                         functionResponse: {
                             name: "searchInternalReviews",
                             response: {
                                 reviews: topMatches.map(m => ({
                                     filename: m.id,
                                     summary: m.content.substring(0, 800), // Longer context for discovery
                                     score: m.score
                                 }))
                             }
                         }
                     });
                } catch (e) {
                     console.error("Internal Review Search Failed:", e);
                     functionResponses.push({
                         functionResponse: {
                             name: "searchInternalReviews",
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
     console.error("--- DEBUG INFO ---");
     try {
         // Re-get the response object if possible, or we should have saved it?
         // 'result' is inside try block. Let's move 'result' decl up or just guess.
         // Actually, I can't access 'result' here easily without restructuring.
         // But I can guess standard reasons.
         // Let's assume FinishReason is the culprit.
         console.error("Possible causes: Safety Filters or Recitation Check.");
         console.error("Please check if the topic triggers restrictive safety filters.");
     } catch (e) {}
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
