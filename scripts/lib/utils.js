/**
 * コサイン類似度を計算するユーティリティ
 * 2つのベクトル間の角度の近さ（類似性）を -1 から 1 の範囲で算出します。
 * 1に近いほど似ていることになります。
 *
 * @param {number[]} vecA - ベクトルA
 * @param {number[]} vecB - ベクトルB
 * @returns {number} コサイン類似度
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  // ゼロ除算回避（基本起きないはずだが念の為）
  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
  cosineSimilarity
};
