const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const config = require('./book-report-config');

const REPORTS_DIR = 'docs/knowledge_base/book_reports';
const VECTORS_FILE = 'vectors.json';
const DOCUMENTS_FILE = 'documents.json';

// Helper to extract section content
function extractSection(content, header) {
    // 1. Try Exact Match (Standardized Format)
    // Matches "## HeaderName \n (Content) \n (Next # or End)"
    // Escape header for regex
    const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const strictRegex = new RegExp(`^${escapedHeader}\\s*\\n+([\\s\\S]*?)(?=(?:^#|\\Z))`, 'm');
    let match = content.match(strictRegex);
    if (match) return match[1].trim();

    // 2. Fallback: Fuzzy Match (Legacy Format)
    // Matches "### [Anything] Keyword [Anything]"
    // We guess the keyword from the config key or header (e.g. "Objective")
    // This is for backward compatibility if we don't migrate old files.
    // Heuristic: Use the English part of the header as keyword
    const keyword = header.match(/[A-Za-z]+/)?.[0];
    if (keyword) {
         const fuzzyRegex = new RegExp(`###[^\\n]*${keyword}[^\\n]*\\n+([\\s\\S]*?)(?:###|$)`, 'i');
         match = content.match(fuzzyRegex);
         if (match) return match[1].trim();
    }

    return '';
}

function extractMetadata(content, label) {
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match "### Label \n Value" (Legacy) OR "* **Label**: Value" (Standardized for metadata?)
    // Actually our ingest script puts metadata in frontmatter or list.
    // Let's stick to reading Frontmatter if possible, or Fallback to regex.
    // For now, let's keep the legacy regex for metadata title extraction as it's robust enough for "### 書籍名".
    const regex = new RegExp(`###[^\n]*${escapedLabel}[^\n]*\n+([\\s\\S]*?)(?:###|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set.');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "embedding-001" });

  const files = glob.sync(`${REPORTS_DIR}/*.md`);

  const documents = []; // Full content storage
  const vectors = [];   // Search index

  console.log(`Found ${files.length} report(s). Starting parent-child indexing...`);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const filename = path.basename(file);
    const docId = filename;

    // Extract Title for metadata (Legacy way for now as frontmatter parsing is overkill dependent on lib)
    let title = extractMetadata(content, config.metaFields.title.issueLabel);
    // If not found, try frontmatter parsing simple regex
    if(!title) {
        const fmMatch = content.match(/title:\s*"(.*?)"/);
        if(fmMatch) title = fmMatch[1];
    }
    if(!title) title = filename;


    // 1. Save Parent Document
    documents.push({
        docId: docId,
        filename: filename,
        content: content,
        metadata: {
            title: title,
            source: file
        }
    });

    // 2. Extract Chunks using Config

    // Helper to get text by key
    const getText = (key) => {
        const field = config.fields.find(f => f.key === key);
        return field ? extractSection(content, field.markdownHeader) : '';
    };

    const objectiveText = getText('objective');
    const negativeText = getText('negative');

    const takeawaysText = getText('takeaways');
    const positiveText = getText('positive');
    const recommendText = getText('recommend');

    // Chunk A: Objective / Problem Context
    const objectiveChunkText = `【書籍名】: ${title}\n【課題・背景】:\n${objectiveText}\n${negativeText ? `\n【懸念点】:\n${negativeText}` : ''}`;

    // Chunk B: Solution / Value
    const solutionChunkText = `【書籍名】: ${title}\n【学び・解決策】:\n${takeawaysText}\n${positiveText ? `\n【詳細レビュー】:\n${positiveText}` : ''}\n${recommendText ? `\n【おすすめ対象】:\n${recommendText}` : ''}`;

    try {
        // Embed Objective Chunk
        if (objectiveText || negativeText) {
            const resObj = await model.embedContent(objectiveChunkText);
            vectors.push({
                chunkId: `${docId}_objective`,
                docId: docId,
                type: 'objective',
                text: objectiveChunkText,
                embedding: resObj.embedding.values
            });
            console.log(`Vectorized [Objective]: ${filename}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Embed Solution Chunk
        if (takeawaysText || positiveText || recommendText) {
            const resSol = await model.embedContent(solutionChunkText);
            vectors.push({
                chunkId: `${docId}_solution`,
                docId: docId,
                type: 'solution',
                text: solutionChunkText,
                embedding: resSol.embedding.values
            });
            console.log(`Vectorized [Solution]: ${filename}`);
             await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
       console.error(`Error embedding ${filename}:`, error);
    }
  }

  // Save both files
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(vectors, null, 2));
  fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));

  console.log(`Saved ${documents.length} documents to ${DOCUMENTS_FILE}`);
  console.log(`Saved ${vectors.length} vectors to ${VECTORS_FILE}`);
}

main();
