const fs = require('fs');
const path = require('path');

const REPORTS_DIR = 'docs/knowledge_base/book_reports';

function sanitizeFilename(title) {
  // Remove special characters and spaces, replace with hyphens
  return title
    .replace(/[^\w\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, '') // Keep Japanese and alphanumeric
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50); // Limit length
}

function extractField(body, label) {
  const regex = new RegExp(`### ${label}\\s+([\\s\\S]*?)(?=(?:###|$))`);
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

function main() {
  const issueTitle = process.env.ISSUE_TITLE;
  const issueBody = process.env.ISSUE_BODY;
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueUrl = process.env.ISSUE_URL;
  const issueAuthor = process.env.ISSUE_AUTHOR;

  if (!issueTitle || !issueBody) {
    console.error('Error: ISSUE_TITLE and ISSUE_BODY environment variables are required.');
    process.exit(1);
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // Extract fields (using new labels)
  const bookTitleReal = extractField(issueBody, '書籍名') || issueTitle;
  const author = extractField(issueBody, '著者') || 'Unknown';
  const link = extractField(issueBody, 'リンク \\(任意\\)');
  const objective = extractField(issueBody, '読む前の目的');
  const takeaways = extractField(issueBody, '得られた知識');
  const application = extractField(issueBody, '実務における活用');
  const positive = extractField(issueBody, '良かった点');
  const negative = extractField(issueBody, '難しかった点・合わなかった点');
  const recommend = extractField(issueBody, '💡 どんな人におすすめ？');

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `book_title=${bookTitleReal}\n`);
  }

  // Generate filename: YYYY-MM-DD-{sanitized_title}.md
  const date = new Date().toISOString().split('T')[0];
  const safeTitle = sanitizeFilename(bookTitleReal);
  const filename = `${date}-${safeTitle}-${issueNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  // Add frontmatter or header
  const fileContent = `---
title: "${bookTitleReal}"
author: ${issueAuthor}
issue_url: ${issueUrl}
date: ${date}
---

# ${bookTitleReal}

*   **Original Issue**: [${issueUrl}](${issueUrl})
*   **投稿者**: ${issueAuthor}
*   **書籍の著者**: ${author}
${link ? `*   **リンク**: [${link}](${link})` : ''}

---

## 🎯 読む前の目的 (Objective)
${objective || 'なし'}

## 💡 得られた知識・気づき (Key Takeaways)
${takeaways || 'なし'}

## 🛠 実務における活用 (Application)
${application || 'なし'}

## 👍 良かった点・学び (Positive)
${positive || 'なし'}

## 👎 難しかった点・合わなかった点 (Negative)
${negative || 'なし'}

## 👤 どんな人におすすめ？
${recommend || 'なし'}

---
`;

  fs.writeFileSync(filepath, fileContent);
  console.log(`Successfully created report: ${filepath}`);

  // Update Index File
  const indexFile = 'docs/knowledge_base/index.md';
  if (fs.existsSync(indexFile)) {
    const linkLine = `- [${bookTitleReal} (Issue ${issueNumber})](./book_reports/${filename})`;
    fs.appendFileSync(indexFile, `\n${linkLine}`);
    console.log(`Appended to index: ${indexFile}`);
  } else {
    console.warn(`Index file not found: ${indexFile}`);
  }
}



if (require.main === module) {
  main();
}

module.exports = {
  sanitizeFilename,
  extractField,
  main
};
