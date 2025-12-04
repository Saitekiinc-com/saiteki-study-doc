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
  // Configure Grounding Tool
  const tools = [
    {
      googleSearch: {}
    }
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: tools
  });

  try {
    console.error(`Generating content with model: gemini-2.0-flash...`);
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

  console.error("\n--- Generated Roadmap ---\n");
  console.log(generatedText);

  // Output to a file for GitHub Actions to pick up reliably
  fs.writeFileSync('roadmap_body.md', generatedText);
}

main();
