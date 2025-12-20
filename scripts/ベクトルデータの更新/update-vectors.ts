import * as fs from 'fs';
import * as path from 'path';
import { globSync } from 'glob';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const REPORTS_DIR = 'docs/knowledge_base/book_reports';
const OUTPUT_FILE = 'vectors.json';

type Vector = {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
  };
};

export type GenerativeModel = {
  embedContent(content: string): Promise<{
    embedding: {
      values: number[];
    };
  }>;
};

export async function main(
  apiKey: string | undefined,
  reportsDir: string = REPORTS_DIR,
  outputFile: string = OUTPUT_FILE,
  _mockModel: GenerativeModel | null = null
) {
  if (!apiKey && !_mockModel) {
    console.error('Error: GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  let model: GenerativeModel;
  if (_mockModel) {
    model = _mockModel;
  } else {
    // _mockModelがnullの場合、apiKeyは存在すると仮定
    const genAI = new GoogleGenerativeAI(apiKey!);
    // @google/generative-aiの型定義と互換性を持たせるため、必要ならキャストするかラッパーを使う
    // ここでは簡易的に互換性のあるインターフェースとして扱います
    model = genAI.getGenerativeModel({ model: "embedding-001" }) as unknown as GenerativeModel;
  }

  const files = globSync(`${reportsDir}/*.md`);
  const vectors: Vector[] = [];

  console.log(`Found ${files.length} report(s). Starting vectorization...`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file);

    try {
      // ファイル内容全体の埋め込みを生成
      const result = await model.embedContent(content);
      const embedding = result.embedding.values;

      vectors.push({
        id: filename,
        content: content,
        embedding: embedding,
        metadata: {
            source: file
        }
      });
      console.log(`Vectorized: ${filename}`);

      // レート制限（無料枠）に引っかからないように遅延を追加
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error embedding ${filename}:`, error);
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(vectors, null, 2));
  console.log(`Saved ${vectors.length} vectors to ${outputFile}`);
}

// "main" モジュールチェック
// tsx で CJS として実行される場合、require.main === module が使用可能
if (require.main === module) {
    const apiKey = process.env.GEMINI_API_KEY;
    main(apiKey);
}
