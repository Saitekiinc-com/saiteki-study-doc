import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

const REPORTS_DIR = 'docs/knowledge_base/book_reports';

export function sanitizeFilename(title: string): string {
  // 特殊文字とスペースを削除し、ハイフンに置換
  // 日本語と英数字、およびハイフンは保持
  return title
    .replace(/[^\w\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);
}

export function preserveNewlines(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  // 改行を「スペース2つ + 改行」に置換して、Markdown の改行を確実にする
  return text.split(/\r\n|\r|\n/).join('  \n');
}

export function extractField(body: string, label: string): string | null {
  const regex = new RegExp(`### ${label}\\s+([\\s\\S]*?)(?=(?:###|$))`);
  const match = body.match(regex);
  return match ? preserveNewlines(match[1].trim()) as string : null;
}

export function main(): void {
  const issueTitle = process.env.ISSUE_TITLE;
  const issueBody = process.env.ISSUE_BODY;
  const issueNumber = process.env.ISSUE_NUMBER;
  const issueUrl = process.env.ISSUE_URL;
  const issueAuthor = process.env.ISSUE_AUTHOR;

  if (!issueTitle || !issueBody || !issueAuthor) {
    console.error('Error: ISSUE_TITLE, ISSUE_BODY, and ISSUE_AUTHOR environment variables are required.');
    process.exit(1);
  }

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  // フィールドの抽出（新しいラベルを使用）
  const bookTitleReal = extractField(issueBody, '書籍名') || issueTitle;
  const author = extractField(issueBody, '著者') || 'Unknown';
  // リンクのラベルが変更された
  const link = extractField(issueBody, 'リンク');
  const objective = extractField(issueBody, '読む前の目的');
  const takeaways = extractField(issueBody, '得られた知識');
  const application = extractField(issueBody, '実務における活用');
  const positive = extractField(issueBody, '良かった点');
  const negative = extractField(issueBody, '難しかった点・合わなかった点');
  const recommend = extractField(issueBody, '💡 どんな人におすすめ？');

  // GitHub Actions への出力 (PRタイトル用に改行を除去)
  core.setOutput('book_title', bookTitleReal.replace(/\r\n|\r|\n/g, ' ').trim());

  // ファイル名の生成: YYYY-MM-DD-{sanitized_author}-{sanitized_title}-{issueNumber}.md
  const date = new Date().toISOString().split('T')[0];
  const safeAuthor = sanitizeFilename(issueAuthor);
  const safeTitle = sanitizeFilename(bookTitleReal);
  const filename = `${date}-${safeAuthor}-${safeTitle}-${issueNumber}.md`;
  const filepath = path.join(REPORTS_DIR, filename);

  // フロントマターまたはヘッダーを追加
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

## 🎯 読む前の目的
${objective || 'なし'}

## 💡 得られた知識・気づき
${takeaways || 'なし'}

## 🛠 実務における活用
${application || 'なし'}

## 👍 良かった点・学び
${positive || 'なし'}

## 👎 難しかった点・合わなかった点
${negative || 'なし'}

## 👤 どんな人におすすめ？
${recommend || 'なし'}

---
`;

  fs.writeFileSync(filepath, fileContent);
  console.log(`Successfully created report: ${filepath}`);
}

if (require.main === module) {
  main();
}
