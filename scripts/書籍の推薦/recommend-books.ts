import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { globSync } from 'glob';

dotenv.config();

const VECTORS_FILE = 'vectors.json';

// --- Types ---

type Vector = {
    id: string;
    content: string;
    embedding: number[];
    metadata: {
        source: string;
    };
    score?: number; // for temporary scoring
};

type GoogleBookItem = {
    volumeInfo: {
        title: string;
        authors?: string[];
        description?: string;
        infoLink: string;
        language: string;
    };
};

type GoogleBookResult = {
    title: string;
    authors?: string[];
    description: string;
    infoLink: string;
    language: string;
};

type ScoredReview = {
    filename: string;
    summary: string;
    score: number;
    pageUrl: string;
};

type GenerativeModel = {
    startChat(params: any): ChatSession;
    embedContent(content: string): Promise<{ embedding: { values: number[] } }>;
};

type ChatSession = {
    sendMessage(message: string | any[]): Promise<GenerateContentResult>;
};

type GenerateContentResult = {
    response: {
        text(): string;
        functionCalls(): FunctionCall[] | undefined;
    };
};

type FunctionCall = {
    name: string;
    args: any;
};

// --- Helpers ---

// 単純なコサイン類似度
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
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

// --- Prompt Builders ---

export const getSystemInstruction = (aiNativeGuide: string) => `
あなたは、企業の成長とメンバーの幸福を最大化するための学習ロードマップを作成する、世界最高の人材育成責任者（CLO）です。

## 出力フォーマット (Output Format)
以下のフォーマットを**一言一句違わず遵守**すること。勝手な見出しや挨拶文を追加しないこと。
**特に「ユーザープロファイル確認」セクションでは、ユーザー入力を要約・補完・変更せず、そのまま出力すること。「なし」と書かれている場合はそのまま「なし」と出力すること。**

# 📚 書籍提案: {達成したい目標}編

## 👤 ユーザープロファイル確認
* **役割**: {認識した役割（入力のまま）}
* **経験年数**: {認識した経験年数（入力のまま）}
* **目標**: {認識した目標（入力のまま）}
* **わかっていること**: {認識したわかっていること（入力のまま）}
* **わかっていないこと**: {認識したわかっていないこと（入力のまま）}

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
*   **チームメンバーのレビュー**: {searchKnowledgeBaseで見つかったナレッジ（複数ある場合も含む）を、**今回のユーザーのプロファイル（役割・経験年数・目標）に照らし合わせて**統合・要約して記述してください。**必ず末尾に「詳しくはこちら: {pageUrl}」の形式でリンクを追加してください。** ナレッジが見つからない場合は、この項目自体を絶対に表示しないでください。「なし」「見つかりませんでした」等の記述も禁止です。}

**(以下同様)**

## 絶対的なルール (Absolute Rules)
1. 提供されたツール \`searchGoogleBooks\` を必ず使用して、実在する書籍情報のみを使用すること。
2. **広範囲な探索**: まず複数のキーワードで検索を行い、**少なくとも10冊以上の候補**を見つけてください。その中から「ギャップを埋めるのに最適」な書籍を**上限を設けずにすべて**提案してください。該当する本が多ければ多いほど良いです。
3. 書籍が見つかったら、必ずツール \`searchKnowledgeBase\` を使用して、社内のナレッジベース（書籍レポートなど）にその本に関する情報がないか確認すること。
    *   **同時に** \`searchInternalReviews\` を使って、ユーザーの課題に関連する「社内の書籍レポート」がないかも探す。
4. **ギャップ分析のプロセス（思考手順）**:
    *   **Step 1: 目標の定義 (全体像)**: ユーザーの「達成したい目標」を達成するために必要な知識・スキル・経験を網羅的にリストアップしてください（これを「100」とします）。**この際、後述する「組織のコンテキスト」の方針に沿って、具体的な目標を設定してください。**
    *   **Step 2: 現状の除外 (引き算)**: ユーザーの「わかっていること」や「経験年数」から、既に持っている知識を Step 1 のリストから除外してください（例としてこれを「20」とします）。
    *   **Step 3: ギャップの特定 (残りの課題)**: Step 1 から Step 2 を引いて残った項目を、このユーザーが今埋めるべき具体的な「ギャップ」として定義してください（例としてこれが「80」です）。
    *   **Step 4**: この「80（例）」のギャップを埋めるための書籍選定に移ってください。
5. **禁止事項**: 末尾に「チームのナレッジとして活用しましょう！」や「書籍レポートを楽しみにしています！」といった挨拶や励ましの文言を**一切含めないでください**。出力は書籍リストまたは分析結果で終了させてください。

## 組織のコンテキスト (Organization Context)
以下の指針を**深く理解し、遵守**してください。書籍選定や目標設定の際は、これらの指針に合致するものを高く評価してください。

  <organization_guide>
  ${aiNativeGuide}
  </organization_guide>
  `;

export const getUserPrompt = (userRequest: string) => `
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

// --- Main ---

export async function main(injectedGenAI: any = null) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey && !injectedGenAI) { // モッククライアントが提供されている場合はキーチェックをスキップ可能
        console.error('Error: GEMINI_API_KEY is not set.');
        process.exit(1);
    }

    // コマンドライン引数または環境変数からのユーザー入力
    const userRequest = process.env.USER_REQUEST || process.argv[2];
    if (!userRequest && !injectedGenAI) { // 必要であればテスト用のインスタンス化を許容する、あるいはリクエスト入力を厳格にする
        // 実際にはテストであっても userRequest を必須としても問題ない
    }
    if (!userRequest) { // 厳格なチェックを維持
        console.error('Error: User request details are required.');
        process.exit(1);
    }

    // リクエスト文字列内の空フィールドをチェック（簡易的なヒューリスティック）
    console.log("--- Debug: Received USER_REQUEST ---");
    console.log(userRequest);
    console.log("-----------------------------------");

    if (userRequest.includes('【役割】: \n') || userRequest.includes('【達成したい目標】: \n')) {
        console.warn('Warning: Some user request fields appear to be empty. Check issue parsing logic.');
    }

    const genAI = injectedGenAI || new GoogleGenerativeAI(apiKey!);

    // Google Books API 用の関数宣言
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


    // コンテキストファイルの読み込み
    let aiNativeGuide = "";
    try {
        if (fs.existsSync('docs/training/ai_native_guide.md')) {
            aiNativeGuide = fs.readFileSync('docs/training/ai_native_guide.md', 'utf-8');
        }
    } catch (e) {
        console.warn("Failed to read context guides:", e);
    }

    // 1. システムインストラクションの定義（役割と厳格なフォーマット）
    const systemInstruction = getSystemInstruction(aiNativeGuide);

    // ナレッジベース検索用の関数宣言
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

    // ナレッジベース発見用の関数宣言
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
        model: "gemini-3-flash-preview",
        tools: tools,
        systemInstruction: systemInstruction,
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    });

    // 2. ユーザープロンプト（タスク固有のコンテキスト）
    const userPrompt = getUserPrompt(userRequest);

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: userPrompt }]
            }
        ]
    });

    let generatedText = "";



    // 利用可能であればベクトルを読み込む
    let vectors: Vector[] = [];
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

    // KB検索用の埋め込みモデル
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    try {
        console.error(`Starting chat with model: gemini-3-flash-preview...`);
        let result = await chat.sendMessage("おすすめの書籍を教えてください。");

        let maxTurns = 15; // 複数回チェックのために増加
        let turn = 0;

        while (result.response.functionCalls() && turn < maxTurns) {
            turn++;
            const calls = result.response.functionCalls();
            const functionResponses: any[] = []; // @google/generative-ai type for responses

            if (calls) {
                for (const call of calls) {
                    if (call.name === "searchGoogleBooks") {
                        const query = call.args.query;
                        console.error(`[Tool Call] Searching Google Books for: "${query}"`);

                        // Google Books API コールの実行
                        try {
                            const apiRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=ja`);
                            const data = await apiRes.json();

                            let books: GoogleBookResult[] = data.items ? data.items.map((item: GoogleBookItem) => ({
                                title: item.volumeInfo.title,
                                authors: item.volumeInfo.authors,
                                description: item.volumeInfo.description ? item.volumeInfo.description.substring(0, 200) + "..." : "No description",
                                infoLink: item.volumeInfo.infoLink,
                                language: item.volumeInfo.language // フィルタリング用に取得
                            })) : [];

                            // クライアントサイドフィルタリング: 言語が 'ja' のもののみを残す
                            // APIの langRestrict は完璧ではないため
                            const initialCount = books.length;
                            books = books.filter(b => b.language === 'ja');
                            const filteredCount = books.length;

                            if (initialCount !== filteredCount) {
                                console.error(`[Filter] Filtered out ${initialCount - filteredCount} non-Japanese books.`);
                            }
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
                            // クエリの埋め込み
                            const embResult = await embeddingModel.embedContent(bookTitle);
                            const queryVec = embResult.embedding.values;

                            // 最良の一致を検索
                            let bestMatch: Vector | null = null;
                            let maxScore = -1;

                            for (const vec of vectors) {
                                const score = cosineSimilarity(queryVec, vec.embedding);
                                if (score > maxScore) {
                                    maxScore = score;
                                    bestMatch = vec;
                                }
                            }

                            // 閾値（例: 意味的一致のために 0.65）
                            if (maxScore > 0.65 && bestMatch) {
                                console.error(`[Tool Result] KB Match Found: ${bestMatch.id} (Score: ${maxScore.toFixed(3)})`);
                                // ファイル名から GitHub Pages の URL を生成
                                const filename = bestMatch.id.replace('.md', '');
                                const pageUrl = `https://Saitekiinc-com.github.io/saiteki-study-doc/knowledge_base/book_reports/${filename}.html`;
                                functionResponses.push({
                                    functionResponse: {
                                        name: "searchKnowledgeBase",
                                        response: {
                                            found: true,
                                            score: maxScore,
                                            summary: bestMatch.content.substring(0, 500), // コンテキストのために内容を切り詰め
                                            pageUrl: pageUrl
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

                            // 全ベクトルのスコアリング
                            const scored: Vector[] = vectors.map(vec => ({
                                ...vec,
                                score: cosineSimilarity(queryVec, vec.embedding)
                            }));

                            // ソートして上位3件を取得
                            scored.sort((a, b) => (b.score || 0) - (a.score || 0));
                            const topMatches = scored.slice(0, 3).filter(v => (v.score || 0) > 0.6); // 閾値

                            console.error(`[Tool Result] Found ${topMatches.length} internal reviews.`);

                            functionResponses.push({
                                functionResponse: {
                                    name: "searchInternalReviews",
                                    response: {
                                        reviews: topMatches.map(m => {
                                            // const filename = m.id.replace('.md', ''); // Unused local var fixed
                                            const pageName = m.id.replace('.md', '');
                                            const pageUrl = `https://Saitekiinc-com.github.io/saiteki-study-doc/knowledge_base/book_reports/${pageName}.html`;
                                            return {
                                                filename: m.id,
                                                summary: m.content.substring(0, 800), // 発見のために長めのコンテキスト
                                                score: m.score!,
                                                pageUrl: pageUrl
                                            } as ScoredReview;
                                        })
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
            }

            // 全結果を返送
            result = await chat.sendMessage(functionResponses);
        }

        // ツール呼び出し制限によりループが終了したが、モデルがまだツールを呼び出そうとしているか確認
        if (result.response.functionCalls()) {
            console.warn("Max tool turns reached. Forcing response generation.");
            result = await chat.sendMessage("検索はこれで十分です。ここまでに見つかった書籍情報だけを使って、今すぐ回答を作成してください。");
        }

        const response = await result.response;
        generatedText = response.text();
        console.error(`Success!`);

    } catch (error: any) {
        console.error(`Failed to generate content. Error: ${error.message}`);
        process.exit(1);
    }

    if (!generatedText) {
        console.error("Failed to generate text after tool execution.");
        console.error("--- DEBUG INFO ---");
        try {
            // レスポンスオブジェクトを再取得可能か、または保存すべきだったか？
            // 'result' は try ブロック内にある。'result' の宣言を移動するか推測する。
            // 実際には、ここで再構成なしに 'result' にアクセスするのは簡単ではない。
            // しかし、一般的な原因を推測できる。
            // FinishReason が原因であると仮定する。
            console.error("Possible causes: Safety Filters or Recitation Check.");
            console.error("Please check if the topic triggers restrictive safety filters.");
        } catch (e) { }
        process.exit(1);
    }

    // 事後検証ロジックはもう不要！
    console.error("\n--- Generated Roadmap ---\n");
    console.log(generatedText);

    // GitHub Actions が確実に取得できるようにファイルに出力
    fs.writeFileSync('roadmap_body.md', generatedText);
}

// "main" モジュールチェック (TypeScript CJS compat)
if (require.main === module) {
    main();
}
