const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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
  const generationModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const prompt = `
あなたはエンジニアリングマネージャーです。
以下の「チームメンバーによる読書感想文（ナレッジベース）」と「ユーザーのバックグラウンド」を元に、このユーザーに最適な学習ロードマップを作成してください。

## ユーザー情報
${userRequest}

## ナレッジベース (チームメンバーの声)
${context}

## 指示
1. **日本語**で出力してください。
2. ユーザーの課題解決に役立つ書籍を推奨してください。
3. 推奨する際は、ナレッジベースにある**「チームメンバーの感想（Positive/Negative）」を引用**し、「〇〇という意見もあるため、ここは重点的に読むと良いでしょう」といった具体的なアドバイスを含めてください。
4. 出力形式は **GitHub Issue** の本文としてそのまま使えるMarkdown形式にしてください。
5. 各タスクには、以下の「読書感想文テンプレート」を含めてください。

## 出力フォーマット例
# 学習ロードマップ: {ユーザーの役割}編

## 推奨書籍とタスク

### 1. {書籍名}
*   **選定理由**: {ナレッジベースからの引用を用いた理由}
*   **タスク**:
    - [ ] {書籍名} を読む
    - [ ] 以下のテンプレートで感想文を書く

    \`\`\`markdown
    ## 📚 {書籍名} 読書感想文
    ### 👍 Positive (良かった点・学び)
    -
    ### 👎 Negative (難しかった点・合わなかった点)
    -
    \`\`\`
`;

  const result = await generationModel.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  console.error("\n--- Generated Roadmap ---\n");
  console.log(text);

  // Output to a file for GitHub Actions to pick up if needed, or just stdout is fine for now.
  // We will likely capture stdout in the workflow.
}

main();
