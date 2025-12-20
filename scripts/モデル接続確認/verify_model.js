const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function verifyModel(injectedGenAI, injectedEnv) {
  const env = injectedEnv || process.env;
  const GenAI = injectedGenAI || GoogleGenerativeAI;

  const modelName = "gemini-3-flash-preview";
  console.log(`Verifying model: ${modelName}...`);

  if (!env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
  }

  const genAI = new GenAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: modelName });

  try {
    const result = await model.generateContent("Hello, world!");
    const response = await result.response;
    const text = response.text();
    console.log(`✅ Success! Model '${modelName}' is available.`);
    console.log("Response:", text.trim());
  } catch (error) {
    console.error(`❌ Failed to use model '${modelName}'.`);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyModel();
}

module.exports = { verifyModel };
