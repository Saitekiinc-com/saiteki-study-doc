const fs = require('fs');
const path = require('path');
const config = require('./book-report-config');

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
  // Escaping label for regex just in case it contains special chars
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`### ${escapedLabel}\\s+([\\s\\S]*?)(?=(?:###|$))`);
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

  // Extract Metadata using Config
  let bookTitle = extractField(issueBody, config.metaFields.title.issueLabel);
  if (!bookTitle) {
      console.warn(`Could not extract '${config.metaFields.title.issueLabel}' from body. Using Issue Title.`);
      bookTitle = issueTitle;
  }
  const author = extractField(issueBody, config.metaFields.author.issueLabel) || 'Unknown';
  const link = extractField(issueBody, config.metaFields.link.issueLabel) || '';


  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `book_title=${bookTitle}\n`);
  }

  // Generate filename: YYYY-MM-DD-{sanitized_title}.md
  const date = new Date().toISOString().split('T')[0];
  const safeTitle = sanitizeFilename(bookTitle);
  const filename = `${date}-${safeTitle}-${issueNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  // Construct Standardized Markdown Content
  let fileContent = `---
title: "${bookTitle}"
author: ${issueAuthor}
issue_url: ${issueUrl}
date: ${date}
labels: ["book-report"]
---

# 📚 ${bookTitle}

*   **Original Issue**: [${issueUrl}](${issueUrl})
*   **Author**: @${issueAuthor}
*   **Book Author**: ${author}
${link ? `*   **Link**: ${link}` : ''}

---

`;

  // Append fields using Standardized Headers from Config
  for (const field of config.fields) {
      const content = extractField(issueBody, field.issueLabel);
      if (content) {
          fileContent += `${field.markdownHeader}\n\n${content}\n\n`;
      }
  }

  fs.writeFileSync(filepath, fileContent);
  console.log(`Successfully created report: ${filepath}`);
}

main();
