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
        *   **【検索対象の厳格化】**: **必ず `site:amazon.co.jp` を付けて検索し、Amazon.co.jp 内の書籍のみを対象としてください。**
        *   検索時は「site:amazon.co.jp {キーワード} 書籍」のように検索クエリを構築してください。
    *   **ステップ2 (KB照合)**: 選んだ書籍が、提供された「ナレッジベース」に含まれているか確認してください。
    *   **ステップ3 (出力)**:
        *   **KBにある場合**: ナレッジベースの内容を引用し、**ポジティブな意見とネガティブな意見（もしあれば）の両面**を要約して紹介してください。セクション名は「**チームメンバーのレビュー (KB)**」としてください。
        *   **KBにない場合**: Google検索（Grounding）で得られた情報を元に、**この書籍がどのようにギャップを埋めるのに役立つか**を要約してください。セクション名は「**レビュー**」としてください。**チームメンバーの意見として捏造することは絶対に避けてください。**
6. **書籍の紹介方法**:
    *   書籍名には必ず **Amazonの検索リンク** を付けてください。形式: \`[{書籍名}](https://www.amazon.co.jp/s?k={書籍名})\`
    *   **【検証元情報の提示（重要）】**:
        *   その書籍の実在確認や内容把握に使用した**具体的なWebページのURL（参照元URL）**を記載してください。
        *   **ここには Google検索で見つけた `amazon.co.jp` の商品ページURLを記載してください。**
    *   各書籍について、**「どのギャップが埋まるのか」**を具体的に記述してください。
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

### 1. 📖 [{書籍名}](https://www.amazon.co.jp/s?k={書籍名})
**🔗 参照元URL (出版社など)**: {Google検索で発見した実在するURL}

**埋められるギャップ**:
* ✅ {知識領域A}の{具体的な部分}

**推奨理由**:
{なぜこの本がこのギャップを埋めるのに最適なのか}

**チームメンバーのレビュー (KB) or レビュー**:
> **ポイント**: {KBの内容 または Web検索から得られた要約}

---

### 2. 📖 [{書籍名}](https://www.amazon.co.jp/s?k={書籍名})
**🔗 参照元URL**: {情報源となったWebページのURL}

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
  // Heuristic: Books start with "### \d+\. 📖"
  // We need to capture the preamble (everything before the first book)
  const bookHeaderRegex = /(### \d+\. 📖.*)/;
  const parts = text.split(bookHeaderRegex);

  // parts[0] is preamble. Subsequent parts depend on split behavior with capture group.
  // split with capture group returns [preamble, match, rest, match, rest...] or similar depending on implementation.
  // Let's use a manual approach for robustness.

  const sections = [];
  let currentPos = 0;
  let match;
  // Global regex for book headers
  const headerRegexGlobal = /### \d+\. 📖/g;

  let lastIndex = 0;
  while ((match = headerRegexGlobal.exec(text)) !== null) {
      // Push content before this match as a "preamble" or "interim" section
      if (match.index > lastIndex) {
          sections.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // Determine where this section ends (at next header or end of string)
      const start = match.index;
      // We need to look ahead for the next match
      const nextMatchIndex = text.indexOf('### ', start + 1); // Simple lookahead for next header (adjust regex if needed)
      // Actually, let's just use the regex loop. The `lastIndex` of the regex object is updated after exec.
      // But we need the content *between* headers.

      // Simpler approach: Split by the header pattern but keep delimiters.
  }

  // Let's try an even simpler approach: Regex based splitting is tricky to keep structure.
  // Let's use `split` but wrapped to handle the logic.

  const splitPattern = /(?=### \d+\. 📖)/;
  // Lookahead split! logic: Splitting at the position where the pattern matches, keeping the pattern in the next chunk.
  const chunks = text.split(splitPattern);

  const processedChunks = await Promise.all(chunks.map(async (chunk, index) => {
    // If it doesn't look like a book section, return as is (preamble and postscripts)
    if (!chunk.trim().match(/^### \d+\. 📖/)) {
        return chunk;
    }

    // It is a book section. Identify the "Source URL".
    // 🔗 参照元URL(出版社など): {URL}
    const sourceUrlMatch = chunk.match(/🔗 参照元URL.*?: (https?:\/\/[^\s\n]+)/);

    if (sourceUrlMatch) {
        const url = sourceUrlMatch[1];
        // Special check: If user typed "example.com" or standard placeholders, ignore or fail?
        // We assume valid URLs.

        const isAlive = await isUrlAlive(url);
        if (!isAlive) {
            console.error(`[Filtering Rule] Dropping book section due to Dead Source URL: ${url}`);
            // Return empty string strings effectively removing the section.
            // We might want to return a strict placeholder? No, user wants it gone.
            return '';
        }
        console.error(`[Filtering Rule] Keeping book section. Source URL OK: ${url}`);
    } else {
        console.warn(`[Filtering Rule] No Source URL found in book section. Keeping it, but this might be risky.`);
    }

    // Secondary check: Are there ANY dead Amazon links in the title?
    // If the title link is dead, but source is OK... we might just strip the link?
    // User asked "Don't introduce books that don't exist".
    // If Source URL exists, book likely exists. If Amazon link is dead, it's just a bad link.
    // Let's run the previous logic to annotate broken internal links just in case,
    // BUT specific to this chunk.

    // We can reuse a mini-version of the link checker here if needed,
    // but the main requirement is dropping the book if the SOURCE is bad.

    return chunk;
  }));

  // Rejoin and fix numbering
  // If we removed book #2, book #3 should probably become #2?
  // Or current prompt output numbers them hardcoded?
  // If we drop #1, and #2 remains... it might look weird "### 2. ...".
  // Let's try to re-number.

  let finalJoined = processedChunks.join('');

  // Renumbering pass
  let bookCount = 1;
  finalJoined = finalJoined.replace(/### \d+\. 📖/g, () => {
      return `### ${bookCount++}. 📖`;
  });

  // If all books were removed... we should probably say "No books found".
  if (bookCount === 1 && chunks.length > 1) {
       // chunks > 1 means we had potential books, but bookCount stayed 1 means we dropped all.
       finalJoined += "\n\n(※ 提案された書籍の参照元URLが検証できなかったため、すべて除外されました。検索条件を見直してください。)\n";
  }

  return finalJoined;
}

async function isUrlAlive(url) {
  try {
    // Try HEAD first
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: { 'User-Agent': 'Bot/1.0' } });
    clearTimeout(timeout);

    if (res.ok) return true;
    if (res.status === 404 || res.status === 410) return false;

    // If 403 Forbidden or 503 Service Unavailable, it's likely bot protection (Amazon/Cloudflare).
    // Treat as "Alive" (or at least "Not 404") to avoid false positives.
    if (res.status === 403 || res.status === 503) return true;

    // If 405 Method Not Allowed or other error, try GET
    if (res.status === 405 || res.status >= 400) {
       const controllerGet = new AbortController();
       const timeoutGet = setTimeout(() => controllerGet.abort(), 5000);
       const resGet = await fetch(url, { method: 'GET', signal: controllerGet.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Bot/1.0)' } });
       clearTimeout(timeoutGet);

       if (resGet.ok) return true;
       // Again, if GET returns 403/503, assume alive.
       if (resGet.status === 403 || resGet.status === 503 || resGet.status === 999) return true;
       if (resGet.status === 404 || resGet.status === 410) return false;

       return true; // Default to true for other weird errors to be safe
    }
    return true; // Assume ok if weird status but not 404
  } catch (e) {
    console.error(`Check failed for ${url}: ${e.message}`);
    return false;
  }
}

main();
