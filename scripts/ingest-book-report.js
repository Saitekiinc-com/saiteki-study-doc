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

  // Extract real book title from the body
  let bookTitle = extractField(issueBody, '書籍名');
  if (!bookTitle) {
      console.warn("Could not extract '書籍名' from body. Using Issue Title.");
      bookTitle = issueTitle;
  }

  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `book_title=${bookTitle}\n`);
  }

  // Generate filename: YYYY-MM-DD-{sanitized_title}.md
  const date = new Date().toISOString().split('T')[0];
  const safeTitle = sanitizeFilename(bookTitle);
  const filename = `${date}-${safeTitle}-${issueNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  // Add frontmatter or header
  const fileContent = `---
title: "${bookTitle}"
author: ${issueAuthor}
issue_url: ${issueUrl}
date: ${date}
---

# ${bookTitle}

*   **Original Issue**: [${issueUrl}](${issueUrl})
*   **Author**: @${issueAuthor}

---

${issueBody}
`;

  fs.writeFileSync(filepath, fileContent);
  console.log(`Successfully created report: ${filepath}`);
}

main();
