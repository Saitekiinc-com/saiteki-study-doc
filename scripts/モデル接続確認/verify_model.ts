
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
dotenv.config();

type EnvLike = {
  GEMINI_API_KEY?: string;
  [key: string]: string | undefined;
};

type MockGenAI = typeof GoogleGenerativeAI;

export async function verifyModel(injectedGenAI?: MockGenAI, injectedEnv?: EnvLike): Promise<void> {
  // テスト時にモックを注入できるように、依存関係を引数で受け取るかデフォルトを使用する
  const env = injectedEnv || process.env;
  const GenAI = injectedGenAI || GoogleGenerativeAI;

  const modelName = "gemini-3-flash-preview";
  console.log(`Verifying model: ${modelName}...`);

  // 環境変数 GEMINI_API_KEY のチェック
  if (!env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }

  // Google Generative AI クライアントの初期化
  const genAI = new GenAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    // 実際にAPIを呼び出して動作確認を行う（"Hello, world!" を送信）
    const result = await model.generateContent("Hello, world!");
    const response = await result.response;
    const text = response.text();
    console.log(`✅ Success! Model '${modelName}' is available.`);
    console.log("Response:", text.trim());
  } catch (error: any) {
    console.error(`❌ Failed to use model '${modelName}'.`);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyModel();
}

