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

  const genAI = new GoogleGenerativeAI(apiKey);
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const generationModel = genAI.getGenerativeModel({
    model: "gemini-pro",
    tools: [{ googleSearchRetrieval: {} }]
  });

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

  // Read Learning Policy Guide
  const guidePath = 'docs/training/personalization/guide.md';
  let guideContent = '';
  if (fs.existsSync(guidePath)) {
    guideContent = fs.readFileSync(guidePath, 'utf-8');
  } else {
    console.warn(`Warning: Learning policy guide not found at ${guidePath}`);
  }

  // List available documentation for linking
  const docFiles = glob.sync('docs/**/*.md');
  const docList = docFiles.map(f => `- ${f}`).join('\n');

  const prompt = `
あなたはエンジニアリングマネージャーです。
以下の「組織の学習方針」、「チームメンバーによる読書感想文（ナレッジベース）」、「ユーザーのバックグラウンド」、「利用可能なドキュメント」を元に、このユーザーに最適な**書籍**を提案してください。

## ユーザー情報
${userRequest}

## 組織の学習方針 (Learning Policy)
${guideContent}

## ナレッジベース (チームメンバーの声)
${context}

## 利用可能なドキュメント (Available Documentation)
以下のファイルへのリンクを推奨する際は、必ずこのリストにあるパスを使用してください。
リンク形式は **https://github.com/Saitekiinc-com/saiteki-study-doc/blob/main/{パス}** としてください。
${docList}

## 指示
1. **日本語**で出力してください。
2. **「達成したい目標」** と **「わかっていないこと」** のギャップを埋めるための**書籍の提案**に集中してください。
3. **ギャップ分析**:
    *   ユーザーの「達成したい目標」に対して、現在の「わかっていないこと」がどのような障壁になっているかを分析してください。
    *   不足している知識を明確にリストアップしてください。
4. **書籍の選定プロセス (重要)**:
    *   **ステップ1 (Grounding検索)**: まず、ユーザーのギャップを埋めるのに**最も適した書籍**をGoogle検索で見つけてください。「ナレッジベースにあるかどうか」は気にせず、純粋にベストな本を選んでください。
    *   **ステップ2 (KB照合)**: 選んだ書籍が、提供された「ナレッジベース (チームメンバーの声)」に含まれているか確認してください。
    *   **ステップ3 (出力)**:
        *   **KBにある場合**: ナレッジベースの内容を引用し、**ポジティブな意見とネガティブな意見（もしあれば）の両面**を要約して紹介してください。
        *   **KBにない場合**: 書籍の紹介のみを行ってください。無理に引用を捏造してはいけません。
5. **書籍の紹介方法**:
    *   書籍名には必ず **Amazonの検索リンク** を付けてください。形式: \`[{書籍名}](https://www.amazon.co.jp/s?k={書籍名})\`
    *   各書籍について、**「どのギャップが埋まるのか」**を具体的に記述してください。
6. 社内ドキュメント（Available Documentation）に関連するものがあれば、積極的にリンクを貼って紹介してください。リンクは必ず **絶対パス (https://github.com/...)** で記述し、**404エラーにならないようにリストにあるファイルのみ** を使用してください。
7. 出力形式は **GitHub Issue** の本文としてそのまま使えるMarkdown形式にしてください。

## 出力フォーマット例
# 📚 書籍提案: {ユーザーの役割}編

## 🎯 目標 (Objective)
**{ユーザーの目標}**

## 📊 ギャップ分析 (Gap Analysis)
目標を達成するために、現在以下の知識が不足しています:

1. **{知識領域A}**: {具体的な不足内容}
2. **{知識領域B}**: {具体的な不足内容}

## 📚 推奨書籍 (Recommended Books)

### 1. 📖 [{書籍名}](https://www.amazon.co.jp/s?k={書籍名})

**埋められるギャップ**:
* ✅ {知識領域A}の{具体的な部分}

**推奨理由**:
{なぜこの本がこのギャップを埋めるのに最適なのか}

**チームメンバーのレビュー (KBありの場合)**:
> **良かった点**: {ポジティブな意見の要約}
>
> **注意点**: {ネガティブな意見の要約}

*(※KBにない場合はこのセクションを表示しない)*

---

### 2. 📖 [{書籍名}](https://www.amazon.co.jp/s?k={書籍名})

*(同様の構成)*

---

## 📝 参考ドキュメント
* [{ドキュメント名}](https://github.com/...): {どのギャップに役立つか}
`;

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-1.5-flash"];
  let generatedText = null;

  for (const modelName of modelsToTry) {
    try {
      console.error(`Trying model: ${modelName}...`);
      const generationModel = genAI.getGenerativeModel({ model: modelName });
      const result = await generationModel.generateContent(prompt);
      const response = await result.response;
      generatedText = response.text();
      console.error(`Success with model: ${modelName}`);
      break;
    } catch (error) {
      console.error(`Failed with model: ${modelName}. Error: ${error.message}`);
      // Continue to next model
    }
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

  console.error("\n--- Generated Roadmap ---\n");
  console.log(generatedText);

  // Output to a file for GitHub Actions to pick up reliably
  fs.writeFileSync('roadmap_body.md', generatedText);
}

main();
