const fs = require('fs');
const path = require('path');
const glob = require('glob');
const config = require('./book-report-config');
const aiClient = require('./lib/ai-client');
const store = require('./lib/store');

const REPORTS_DIR = 'docs/knowledge_base/book_reports';

/**
 * Markdown本文から指定されたヘッダーの内容を抽出する
 * @param {string} content - Markdown全文
 * @param {string} header - 抽出したいヘッダー（例: ## Objective）
 * @returns {string} 抽出されたテキスト
 */
function extractSection(content, header) {
    // Regex: 指定ヘッダーから、次のヘッダー(#)またはファイル末尾までを取得
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strictRegex = new RegExp(`^${escapedHeader}\\s*\\n+([\\s\\S]*?)(?=(?:^#|\\Z))`, 'm');
    let match = content.match(strictRegex);
    if (match) return match[1].trim();

    return '';
}

/**
 * ファイルからタイトルを取得する（Frontmatter優先）
 * @param {string} content
 * @param {string} filename
 * @returns {string}
 */
function getTitle(content, filename) {
    // 1. Frontmatter check
    const fmMatch = content.match(/title:\s*"(.*?)"/);
    if (fmMatch) return fmMatch[1];

    // 2. Fallback to filename
    return filename;
}

async function main() {
  const files = glob.sync(`${REPORTS_DIR}/*.md`);
  console.log(`[Info] Found ${files.length} report(s). Starting indexing...`);

  const documents = [];
  const vectors = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file);
    const docId = filename;

    const title = getTitle(content, filename);

    // 1. ドキュメント本体の保存
    documents.push({
        docId: docId,
        filename: filename,
        content: content,
        metadata: { title: title, source: file }
    });

    // 2. configに基づいて各フィールドを抽出
    const getText = (key) => {
        const field = config.fields.find(f => f.key === key);
        return field ? extractSection(content, field.markdownHeader) : '';
    };

    const objectiveText = getText('objective');
    const negativeText = getText('negative');
    const takeawaysText = getText('takeaways');
    const nextActionText = getText('next_action');
    const positiveText = getText('positive');
    const recommendText = getText('recommend');

    // 3. チャンク作成
    // Chunk A: 悩み・背景 (課題検索用)
    const objectiveChunkText = `【書籍名】: ${title}\n【課題・背景】:\n${objectiveText}\n${negativeText ? `\n【懸念点】:\n${negativeText}` : ''}`;

    // Chunk B: 解決策・学び (解決策検索用)
    const solutionChunkText = `【書籍名】: ${title}\n【学び・解決策】:\n${takeawaysText}\n${nextActionText ? `\n【実務活用 (Next Action)】:\n${nextActionText}` : ''}\n${positiveText ? `\n【詳細レビュー】:\n${positiveText}` : ''}\n${recommendText ? `\n【おすすめ対象】:\n${recommendText}` : ''}`;

    try {
        // Embed Objective Chunk
        if (objectiveText || negativeText) {
            const vector = await aiClient.embedText(objectiveChunkText);
            vectors.push({
                chunkId: `${docId}_objective`,
                docId: docId,
                type: 'objective',
                text: objectiveChunkText,
                embedding: vector
            });
            console.log(`[Vectorized] Objective: ${filename}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Rate Limit対策
        }

        // Embed Solution Chunk
        if (takeawaysText || nextActionText || positiveText || recommendText) {
            const vector = await aiClient.embedText(solutionChunkText);
            vectors.push({
                chunkId: `${docId}_solution`,
                docId: docId,
                type: 'solution',
                text: solutionChunkText,
                embedding: vector
            });
            console.log(`[Vectorized] Solution: ${filename}`);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

    } catch (error) {
       console.error(`[Error] Failed to embed ${filename}:`, error);
    }
  }

  // 保存処理 (storeモジュール利用)
  store.saveKnowledgeBase(vectors, documents);
}

main();
