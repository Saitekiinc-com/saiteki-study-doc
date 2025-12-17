const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const REPORTS_DIR = 'docs/knowledge_base/book_reports';
const OUTPUT_FILE = 'vectors.json';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "embedding-001" });

  const files = glob.sync(`${REPORTS_DIR}/*.md`);
  const vectors = [];

  console.log(`Found ${files.length} report(s). Starting vectorization...`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file);

    try {
      // Generate embedding for the entire file content
      // For very large files, chunking might be necessary, but reports are likely short.
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

      // Add delay to avoid hitting rate limits (Free Tier)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error embedding ${filename}:`, error);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(vectors, null, 2));
  console.log(`Saved ${vectors.length} vectors to ${OUTPUT_FILE}`);
}

main();
