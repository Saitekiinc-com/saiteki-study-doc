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
        *   **【検索対象の変更】**: **必ず \`site:books.google.co.jp\` を付けて検索し、Googleブックス内の書籍情報を対象としてください。**
        *   検索時は「site:books.google.co.jp {キーワード}」のように検索クエリを構築してください。
    *   **ステップ2 (KB照合)**: 選んだ書籍が、提供された「ナレッジベース」に含まれているか確認してください。
    *   **ステップ3 (出力)**:
        *   **KBにある場合**: ナレッジベースの内容を引用し、**ポジティブな意見とネガティブな意見（もしあれば）の両面**を要約して紹介してください。セクション名は「**チームメンバーのレビュー (KB)**」としてください。
        *   **KBにない場合**: Google検索（Grounding）で得られた情報を元に、**この書籍がどのようにギャップを埋めるのに役立つか**を要約してください。セクション名は「**レビュー**」としてください。**チームメンバーの意見として捏造することは絶対に避けてください。**
6. **書籍の紹介方法**:
    *   書籍名には **GoogleブックスのページURL** をリンクさせてください。
    *   形式: \`[{書籍名}](https://books.google.co.jp/...)\`
        *   **重要**: Google検索で見つかった **Googleブックスの個別ページURL** を使用してください。
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

### 1. 📖 [{書籍名}]({GoogleブックスのURL})

**埋められるギャップ**:
* ✅ {知識領域A}の{具体的な部分}

**推奨理由**:
{なぜこの本がこのギャップを埋めるのに最適なのか}

**チームメンバーのレビュー (KB) or レビュー**:
> **ポイント**: {KBの内容 または Web検索から得られた要約}

---

### 2. 📖 [{書籍名}]({GoogleブックスのURL})

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

    // It is a book section. Identify the "Title URL" (Google Books Page).
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
        } else if (checkResult.status !== 200) {
            // If strictly not 200 OK (e.g. 403, 503, 999 or even 404 if soft), fallback.
            // Wait, checks above handle Hard 404.
            // If soft 404 or blocked -> Fallback.
            // Since we know Google Books blocks bots heavily (returning 404 often even for valid),
            // a safer default here might be: "If we can't confirm it's 200 OK with valid content, Fallback".

            console.warn(`[Filtering Rule] URL verification failed/blocked (Status ${checkResult.status}). Fallback to Google Books Search Link: ${url}`);

            // Fallback to Google Books Search
            // https://www.google.co.jp/search?tbm=bks&q={Title}
            const searchUrl = `https://www.google.co.jp/search?tbm=bks&q=${encodeURIComponent(bookTitle)}`;

            // Use regex replacement on the chunk
            return chunk.replace(titleLinkMatch[0], `### 0. 📖 [${bookTitle}](${searchUrl})`);
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
       finalJoined += "\n\n(※ 提案された書籍のページが検証できなかったため、すべて除外されました。)\n";
  }

  return finalJoined;
}

async function isUrlAlive(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
        }
    });
    clearTimeout(timeout);

    const status = res.status;
    const text = await res.text();

    // Google Books error check
    if (text.includes("書籍が見つかりません") ||
        text.includes("Error 404 (Not Found)!!1") ||
        text.includes("この書籍は閲覧できません")) {
         // This is a Soft 404/Block.
         // Unlike Amazon where we wanted to remove non-existent books,
         // here "Error 404" might just mean "Blocked for Bot" as seen in debug.
         // To be safe: treat as BLOCKED (fallback to search) rather than DEAD (remove).
         // UNLESS we are sure it's dead.
         // The debug output "Error 404" appeared for VALID books too.
         // So we CANNOT use 404 to assume dead. We must assume BLOCKED.
         return { alive: true, status: 503 }; // Treat as blocked -> Fallback
    }

    if (res.ok) {
        return { alive: true, status: 200 };
    }

    // Hard 404 from headers?
    if (status === 404 || status === 410) {
        // As seen in debug, Google might return 404 header for valid books too?
        // "Status: 404" was logged in debug script.
        // So even hard 404 might be a block.
        // This makes "Strict Filtering" (removing hallucinations) very hard.
        // BUT, we want to prioritize user experience (no broken links).
        // If we get 404, we can't link to it. So we MUST fallback to search.
        // We shouldn't remove it, because it might exist.
        return { alive: true, status: 503 }; // Treat as blocked -> Fallback
    }

    return { alive: true, status: status };
  } catch (e) {
    console.error(`Check failed for ${url}: ${e.message}`);
    return { alive: true, status: 503 };
  }
}

main();
