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
    *   **Step 4**: この「80（例）」のギャップを埋めるための書籍選定に移ってください。
5. **書籍の選定プロセス (重要)**:
    *   **ステップ1 (Grounding検索)**: まず、ユーザーのギャップを埋めるのに**最も適した「商業出版された書籍」**をGoogle検索で見つけてください。
        *   **【検索対象の厳格化】**: **必ず \`site:amazon.co.jp\` を付けて検索し、Amazon.co.jp 内の書籍のみを対象としてください。**
        *   検索時は「site:amazon.co.jp {キーワード} 書籍」のように検索クエリを構築してください。
    *   **ステップ2 (KB照合)**: 選んだ書籍が、提供された「ナレッジベース」に含まれているか確認してください。
    *   **ステップ3 (出力)**:
        *   **KBにある場合**: ナレッジベースの内容を引用し、**ポジティブな意見とネガティブな意見（もしあれば）の両面**を要約して紹介してください。セクション名は「**チームメンバーのレビュー (KB)**」としてください。
        *   **KBにない場合**: Google検索（Grounding）で得られた情報を元に、**この書籍がどのようにギャップを埋めるのに役立つか**を要約してください。セクション名は「**レビュー**」としてください。**チームメンバーの意見として捏造することは絶対に避けてください。**
6. **書籍の紹介方法**:
    *   書籍名には必ず **Amazonの個別商品ページURL** をリンクさせてください。
    *   形式: \`[{書籍名}](https://www.amazon.co.jp/...)\`
        *   **重要**: 検索結果一覧ページ (\`/s?k=...\`) ではなく、**Google検索で見つけた \`amazon.co.jp\` の具体的な商品ページ**にリンクしてください。
        *   これが「実在確認（Grounding）」の証明となります。
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

### 1. 📖 [{書籍名}]({Google検索で見つけたAmazon商品ページURL})

**埋められるギャップ**:
* ✅ {知識領域A}の{具体的な部分}

**推奨理由**:
{なぜこの本がこのギャップを埋めるのに最適なのか}

**チームメンバーのレビュー (KB) or レビュー**:
> **ポイント**: {KBの内容 または Web検索から得られた要約}

---

### 2. 📖 [{書籍名}]({Google検索で見つけたAmazon商品ページURL})

*(同様の構成)*

*(同様の構成)*

---
`;

  // Configure Grounding Tool
  const tools = [
    {
      googleSearch: {},
      urlContext: {}
    }
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: tools
  });

  try {
    console.error(`Generating content with model: gemini-2.5-flash...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    generatedText = response.text();
    console.error(`Success!`);
  } catch (error) {
    console.error(`Failed to generate content. Error: ${error.message}`);
    process.exit(1);
  }

  if (!generatedText) {
    console.error("All models failed.");

    // Debug: List available models
    try {
      console.error("--- Debug: Listing Available Models ---");
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      if (data.models) {
        data.models.forEach(m => console.error(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
      } else {
        console.error("No models found in list response:", JSON.stringify(data));
      }
    } catch (e) {
      console.error("Failed to list models:", e);
    }

    process.exit(1);
  }

  // 5. Verify URLs (Liveness Check)
  console.error("--- Verifying URLs ---");
  generatedText = await checkLinksInText(generatedText);

  console.error("\n--- Generated Roadmap ---\n");
  console.log(generatedText);

  // Output to a file for GitHub Actions to pick up reliably
  fs.writeFileSync('roadmap_body.md', generatedText);
}

// Helper: Verify URLs and Filter Sections
async function checkLinksInText(text) {
  // 1. Split text into common parts and book sections
  const splitPattern = /(?=### \d+\. 📖)/;
  const chunks = text.split(splitPattern);

  const processedChunks = await Promise.all(chunks.map(async (chunk, index) => {
    // If it doesn't look like a book section, return as is (preamble and postscripts)
    if (!chunk.trim().match(/^### \d+\. 📖/)) {
        return chunk;
    }

    // It is a book section. Identify the "Title URL" (Amazon Product Page).
    // Format: ### 1. 📖 [Book Title](https://...)
    // Also capture the Book Title for fallback search link
    const titleLinkMatch = chunk.match(/^### \d+\. 📖 \[(.*?)\]\((https?:\/\/[^\)]+)\)/);

    if (titleLinkMatch) {
        const bookTitle = titleLinkMatch[1];
        const url = titleLinkMatch[2];

        const checkResult = await isUrlAlive(url);

        if (!checkResult.alive) {
            console.error(`[Filtering Rule] Dropping book section due to Dead Title URL (Status ${checkResult.status}): ${url}`);
            return '';
        } else if (checkResult.status === 403 || checkResult.status === 503 || checkResult.status === 999) {
            // Amazon blocked us. We cannot verify if the link is real or a hallucination.
            // To be safe and avoid showing a 404 to the user, we FALLBACK to a Search Link.
            console.warn(`[Filtering Rule] URL verification blocked (Status ${checkResult.status}). Fallback to Search Link: ${url}`);

            // Replace the direct link with a search link
            // Original: [Title](URL)
            // New: [Title](https://www.amazon.co.jp/s?k=Title)
            const searchUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(bookTitle)}`;
            const newHeader = `### ${index + 1}. 📖 [${bookTitle}](${searchUrl})`; // Note: index matches map index, might be off if we use this logic
            // Use regex replacement on the chunk to be safe
            return chunk.replace(titleLinkMatch[0], `### 0. 📖 [${bookTitle}](${searchUrl})`); // We fix numbering later
        }

        console.error(`[Filtering Rule] Keeping book section. Title URL OK (Status ${checkResult.status}): ${url}`);
    } else {
        console.warn(`[Filtering Rule] No Title URL found in book section header. Keeping it, but this might be risky.`);
    }

    return chunk;
  }));

  // Rejoin and fix numbering
  let finalJoined = processedChunks.join('');

  // Renumbering pass
  let bookCount = 1;
  finalJoined = finalJoined.replace(/### \d+\. 📖/g, () => {
      return `### ${bookCount++}. 📖`;
  });

  if (bookCount === 1 && chunks.length > 1) {
       finalJoined += "\n\n(※ 提案された書籍のAmazon商品ページが検証できなかったため、すべて除外されました。)\n";
  }

  return finalJoined;
}

async function isUrlAlive(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: { 'User-Agent': 'Bot/1.0' } });
    clearTimeout(timeout);

    if (res.ok) return { alive: true, status: res.status };
    if (res.status === 404 || res.status === 410) return { alive: false, status: res.status };

    // If 405/403/etc, try GET
    if (res.status === 405 || res.status >= 400) {
       const controllerGet = new AbortController();
       const timeoutGet = setTimeout(() => controllerGet.abort(), 5000);
       // Use a more realistic User-Agent to try and bypass simple blocks
       const resGet = await fetch(url, { method: 'GET', signal: controllerGet.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' } });
       clearTimeout(timeoutGet);

       if (resGet.ok) return { alive: true, status: resGet.status };
       if (resGet.status === 404 || resGet.status === 410) return { alive: false, status: resGet.status };

       // If blocked (403, 503, 999), return ALIVE but with status code so caller can decide
       if (resGet.status === 403 || resGet.status === 503 || resGet.status === 999) {
           return { alive: true, status: resGet.status };
       }

       // Other errors? Default to alive/unknown
       return { alive: true, status: resGet.status };
    }
    return { alive: true, status: res.status };
  } catch (e) {
    console.error(`Check failed for ${url}: ${e.message}`);
    // Network error could mean anything. Let's assume Dead to be safe?
    // Or return status 0 (Network Error).
    return { alive: false, status: 0 };
  }
}

main();
