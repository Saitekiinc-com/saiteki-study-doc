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

  // List available documentation for linking
  const docFiles = glob.sync('docs/**/*.md');
  const docList = docFiles.map(f => `- ${f}`).join('\n');

  const prompt = `
あなたはエンジニアリングマネージャーです。
以下の「組織の学習方針」、「チームメンバーによる読書感想文（ナレッジベース）」、「ユーザーのバックグラウンド」、「利用可能なドキュメント」を元に、このユーザーに最適な学習ロードマップを作成してください。

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
2. **組織の学習方針に基づき、ユーザーのキャリアパス（例: InfraならPlatform Architectへの進化、PMならProduct Architectへの進化）を意識したアドバイス**を行ってください。
3. **ギャップ分析を明確に行う**:
    *   ユーザーの「達成したい目標」と「わかっていないこと」を照らし合わせ、**具体的に何の知識が不足しているか**を洗い出してください。
    *   洗い出した知識ギャップを、**学習すべき順序（基礎→応用の順）**に整理してください。
4. **学習順序の根拠を示す**:
    *   なぜその順序で学ぶべきなのか（例: Aの理解がないとBは理解できない）を明記してください。
5. **【重要】書籍の推奨について**:
    *   **【厳格なルール】実在しない書籍を創作・推測することは絶対に禁止です。**
    *   **ナレッジベースに記載されている書籍を最優先**で推奨してください。
    *   ナレッジベースにない場合は、以下のような**実在が確認されている著名な技術書**のみを推奨してください:
        - 『リーダブルコード』
        - 『Clean Code』
        - 『達人プログラマー』
        - 『ソフトウェアアーキテクチャの基礎』
        - 『Clean Architecture』
        - 『Web API: The Good Parts』
        - 『ドメイン駆動設計』
        - 『現場で役立つシステム設計の原則』
        - 『SQLアンチパターン』
        - 『Webを支える技術』
    *   **曖昧な書籍名や自信のない書籍は推奨しないでください。**
6. **書籍とギャップのマッピングを明確にする**:
    *   各書籍について、**「この本を読むことで、どの知識ギャップがどれだけ埋まるのか」**を具体的に記述してください。
    *   ナレッジベースに関連する感想文がある場合は、「得られた知識・気づき」を引用し、それがどのギャップを埋めるかを示してください。
7. 社内ドキュメント（Available Documentation）に関連するものがあれば、積極的にリンクを貼って紹介してください。リンクは必ず **絶対パス (https://github.com/...)** で記述し、**404エラーにならないようにリストにあるファイルのみ** を使用してください。
8. 書籍名には必ず **Amazonの検索リンク** を付けてください。形式: \`[{書籍名}](https://www.amazon.co.jp/s?k={書籍名})\`
9. 出力形式は **GitHub Issue** の本文としてそのまま使えるMarkdown形式にしてください。

## 出力フォーマット例
# 学習ロードマップ: {ユーザーの役割}編

## 🎯 目標の確認
**達成したいこと**: {ユーザーの目標}

## 📊 ギャップ分析
あなたの「わかっていないこと」を整理すると、以下の知識が不足しています:

1. **{知識領域A}**: {具体的な不足内容}
2. **{知識領域B}**: {具体的な不足内容}
3. **{知識領域C}**: {具体的な不足内容}

これらを習得する最適な順序は **{A → B → C}** です。
理由: {なぜこの順序なのか、依存関係の説明}

## 📚 推奨学習ロードマップ

### ステップ1: {知識領域A} を習得する

#### 📖 [{書籍名}](https://www.amazon.co.jp/s?k={書籍名}) を読む

**この本で埋まるギャップ**:
* ✅ {知識領域A}の{具体的な部分1}
* ✅ {知識領域A}の{具体的な部分2}

**推奨理由**:
{なぜこの本が最適なのか}

**チームメンバーの声**:
> {ナレッジベースからの引用}
>
> *(※感想文がある場合のみ)*

**期待される成果**:
この本を読むことで、「{わかっていないこと}」のうち「{具体的な項目}」が理解できるようになります。

---

### ステップ2: {知識領域B} を習得する

*(同様の構成)*

---

## 📝 社内ドキュメントも活用しましょう
* [{ドキュメント名}](https://github.com/...): {どのギャップに役立つか}

## 🎓 まとめ
このロードマップに沿って学習することで、あなたの「{目標}」の実現に必要な知識が段階的に身につきます。
まずは **ステップ1** の {書籍名} から始めましょう！
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
