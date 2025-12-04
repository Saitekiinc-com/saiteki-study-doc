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
  const generationModel = genAI.getGenerativeModel({ model: "gemini-pro" });

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

  const prompt = `
あなたはエンジニアリングマネージャーです。
以下の「組織の学習方針」、「チームメンバーによる読書感想文（ナレッジベース）」、「ユーザーのバックグラウンド」を元に、このユーザーに最適な学習ロードマップを作成してください。

## ユーザー情報
${userRequest}

## 組織の学習方針 (Learning Policy)
${guideContent}

## ナレッジベース (チームメンバーの声)
${context}

## 指示
## 指示
1. **日本語**で出力してください。
2. **組織の学習方針に基づき、ユーザーのキャリアパス（例: InfraならPlatform Architectへの進化、PMならProduct Architectへの進化）を意識したアドバイス**を行ってください。
3. **「達成したい目標」** を実現するために必要な知識を分解し、その中でユーザーの **「わかっていないこと」** を埋めるための書籍を優先的に推奨してください。
4. 推奨する際は、ナレッジベースにある **「得られた知識・気づき (Key Takeaways)」** とユーザーの **「わかっていないこと」** を照らし合わせ、「この本を読むと〇〇が理解できるようになります」という形で提案してください。
5. ナレッジベースにある **「チームメンバーの感想（Positive/Negative）」も引用** し、具体的なアドバイスを含めてください。
6. 出力形式は **GitHub Issue** の本文としてそのまま使えるMarkdown形式にしてください。
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
    ## 読む前の目的 (Objective)
    -
    ## 得られた知識・気づき (Key Takeaways)
    -
    ### 👍 Positive (良かった点・学び)
    -
    ### 👎 Negative (難しかった点・合わなかった点)
    -
    \`\`\`
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
