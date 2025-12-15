const fs = require('fs');
const path = require('path');

const VECTORS_FILE = 'vectors.json';
const DOCUMENTS_FILE = 'documents.json';

/**
 * ナレッジベース（ベクトルデータとドキュメント）を読み込む
 * @returns {{vectors: any[], documents: any[], documentsMap: Map<string, any>}}
 */
function loadKnowledgeBase() {
  let vectors = [];
  let documents = [];

  try {
    if (fs.existsSync(VECTORS_FILE) && fs.existsSync(DOCUMENTS_FILE)) {
      vectors = JSON.parse(fs.readFileSync(VECTORS_FILE, 'utf8'));
      documents = JSON.parse(fs.readFileSync(DOCUMENTS_FILE, 'utf8'));
      console.error(`[Info] Loaded ${vectors.length} chunks and ${documents.length} docs.`);
    } else {
      console.warn("[Warn] vectors.json or documents.json not found. Search will be empty.");
    }
  } catch (e) {
    console.error("[Error] Failed to load KB files:", e);
  }

  // IDで高速に引けるようにMapを作成
  const documentsMap = new Map(documents.map(doc => [doc.docId, doc]));

  return { vectors, documents, documentsMap };
}

/**
 * ナレッジベースを保存する
 * @param {any[]} vectors
 * @param {any[]} documents
 */
function saveKnowledgeBase(vectors, documents) {
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(vectors, null, 2));
  fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
  console.log(`[Info] Saved ${documents.length} documents and ${vectors.length} vectors.`);
}

module.exports = {
  loadKnowledgeBase,
  saveKnowledgeBase
};
