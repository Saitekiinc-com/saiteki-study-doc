const { cosineSimilarity } = require('./utils');
const aiClient = require('./ai-client');

/**
 * ナレッジベース（読書感想文）を検索するツール定義
 */
const kbDeclaration = {
  name: "searchKnowledgeBase",
  parameters: {
    type: "OBJECT",
    properties: {
      bookTitle: {
        type: "STRING",
        description: "Title of the book to search in the knowledge base."
      }
    },
    required: ["bookTitle"]
  }
};

/**
 * 内部レビュー（感想文）をトピック検索するツール定義
 */
const reviewDeclaration = {
  name: "searchInternalReviews",
  parameters: {
    type: "OBJECT",
    properties: {
      topic: {
        type: "STRING",
        description: "Topic or gap to search for in the knowledge base (e.g., 'team building', 'negotiation')."
      }
    },
    required: ["topic"]
  }
};

/**
 * 書籍タイトルでナレッジベースを検索する
 * @param {string} bookTitle
 * @param {any[]} vectors
 * @param {Map} documentsMap
 * @returns {Promise<object>}
 */
async function searchKnowledgeBase(bookTitle, vectors, documentsMap) {
  console.error(`[Tool Call] Searching KB for: "${bookTitle}"`);
  try {
    const queryVec = await aiClient.embedText(bookTitle);

    let bestMatch = null;
    let maxScore = -1;

    // Vector Similarity Search
    for (const vec of vectors) {
      const score = cosineSimilarity(queryVec, vec.embedding);
      if (score > maxScore) {
        maxScore = score;
        bestMatch = vec;
      }
    }

    if (maxScore > 0.65 && bestMatch) {
      const doc = documentsMap.get(bestMatch.docId);
      console.error(`[Tool Result] KB Match Found: ${bestMatch.docId} (Score: ${maxScore.toFixed(3)})`);
      return {
        found: true,
        score: maxScore,
        summary: doc ? doc.content.substring(0, 500) : "Content not found"
      };
    } else {
      console.error(`[Tool Result] No KB Match (Max Score: ${maxScore.toFixed(3)})`);
      return { found: false };
    }
  } catch (e) {
    console.error("[Error] KB Search Failed:", e);
    return { error: "Search failed" };
  }
}

/**
 * トピック（悩みなど）で内部レビューを検索する
 * @param {string} topic
 * @param {any[]} vectors
 * @param {Map} documentsMap
 * @returns {Promise<object>}
 */
async function searchInternalReviews(topic, vectors, documentsMap) {
  console.error(`[Tool Call] Searching Internal Reviews for topic: "${topic}"`);
  try {
    const queryVec = await aiClient.embedText(topic);

    // 全Chunkとの類似度を計算
    const scored = vectors.map(vec => ({
      ...vec,
      score: cosineSimilarity(queryVec, vec.embedding)
    }));

    // スコア順にソート
    scored.sort((a, b) => b.score - a.score);

    const topMatches = [];
    const seenDocIds = new Set();

    // 上位2件のユニークなドキュメントを取得
    for (const m of scored) {
      if (topMatches.length >= 2) break;
      // 閾値 0.6
      if (m.score > 0.6 && !seenDocIds.has(m.docId)) {
        seenDocIds.add(m.docId);
        const doc = documentsMap.get(m.docId);
        topMatches.push({
          filename: m.docId,
          // Chunkの部分一致と、全体テキストの要約（文脈）を両方渡す
          summary: `[Matched Chunk]: ${m.text}\n\n[Full Context]: ${doc ? doc.content.substring(0, 800) : ""}`,
          score: m.score
        });
      }
    }

    console.error(`[Tool Result] Found ${topMatches.length} internal reviews.`);
    return { reviews: topMatches };

  } catch (e) {
    console.error("[Error] Internal Review Search Failed:", e);
    return { error: "Search failed" };
  }
}

module.exports = {
  kbDeclaration,
  reviewDeclaration,
  searchKnowledgeBase,
  searchInternalReviews
};
