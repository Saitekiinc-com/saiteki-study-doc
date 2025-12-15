require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini APIクライアントのラッパー
 * モデルの初期化やEmbeddingの取得を抽象化します。
 */
class GeminiClient {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Error: GEMINI_API_KEY is not set.');
      process.exit(1);
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
  }

  /**
   * チャット用モデルを取得する
   * @param {object} tools - Function Calling用のツール定義
   * @param {string} systemInstruction - システムプロンプト
   * @returns {any} モデルインスタンス
   */
  getChatModel(tools = [], systemInstruction = "") {
    return this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations: tools }],
      systemInstruction: systemInstruction,
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    });
  }

  /**
   * テキストをベクトル化する (Embedding)
   * @param {string} text
   * @returns {Promise<number[]>} ベクトル配列
   */
  async embedText(text) {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (e) {
      console.error("[Error] Embedding failed:", e);
      throw e;
    }
  }
}

module.exports = new GeminiClient(); // Singletonとしてexport
