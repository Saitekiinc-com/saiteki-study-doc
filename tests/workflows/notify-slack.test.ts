import { describe, test } from 'node:test';
import assert from 'node:assert';

type ReportNotificationFields = {
  title: string;
  author: string;
  objective: string;
  takeaways: string;
  application: string;
  positive: string;
  negative: string;
  recommend: string;
};

function parseReportMarkdown(markdown: string, fallbackTitle: string, fallbackAuthor: string): ReportNotificationFields {
  return {
    title: frontmatterValue(markdown, 'title') || fallbackTitle,
    author: frontmatterValue(markdown, 'author') || fallbackAuthor,
    objective: sectionValue(markdown, '読む前の目的'),
    takeaways: sectionValue(markdown, '得られた知識'),
    application: sectionValue(markdown, '実務における活用'),
    positive: sectionValue(markdown, '良かった点'),
    negative: sectionValue(markdown, '難しかった点・合わなかった点'),
    recommend: sectionValue(markdown, 'どんな人におすすめ')
  };
}

function parseIssueBody(body: string, fallbackTitle: string, fallbackAuthor: string): ReportNotificationFields {
  return {
    title: issueSectionValue(body, '書籍名') || fallbackTitle,
    author: fallbackAuthor,
    objective: issueSectionValue(body, '読む前の目的'),
    takeaways: issueSectionValue(body, '得られた知識'),
    application: issueSectionValue(body, '実務における活用'),
    positive: issueSectionValue(body, '良かった点'),
    negative: issueSectionValue(body, '難しかった点・合わなかった点'),
    recommend: issueSectionValue(body, '💡 どんな人におすすめ？')
  };
}

function frontmatterValue(markdown: string, key: string): string {
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return '';
  const line = frontmatter[1].match(new RegExp(`^${escapeRegExp(key)}:\\s*(.*)$`, 'm'));
  if (!line) return '';
  return line[1].trim().replace(/^['"]|['"]$/g, '');
}

function sectionValue(markdown: string, label: string): string {
  const lines = markdown.split(/\r?\n/u);
  const chunks: string[] = [];
  let capturing = false;

  for (const line of lines) {
    if (/^##\s+/u.test(line)) {
      if (capturing) break;
      capturing = line.replace(/^##\s+/u, '').includes(label);
      continue;
    }
    if (capturing) {
      if (/^---\s*$/u.test(line)) break;
      chunks.push(line);
    }
  }

  return chunks.join('\n').trim() || 'なし';
}

function issueSectionValue(body: string, label: string): string {
  const regex = new RegExp(`### ${escapeRegExp(label)}[^\\n]*\\n+([\\s\\S]*?)(?=(?:###|$))`, 'u');
  const match = body.match(regex);
  return match ? match[1].trim() : 'なし';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Slack 通知コンテンツの抽出', () => {
  const sampleMarkdown = `---
title: "AI時代に強い質問力"
author: 杉本光一
issue_url: https://example.com/thread
date: 2026-05-26
---

# AI時代に強い質問力

*   **Original Source**: [Slack thread](https://example.com/thread)
*   **投稿者**: 杉本光一
*   **書籍の著者**: マツダミヒロ

---

## 🎯 読む前の目的
質問力を高めたい

## 💡 得られた知識・気づき
良い質問は人生を変える

## 🛠 実務における活用
チームでの1on1に使う

## 👍 良かった点・学び
実例が多くて分かりやすい

## 👎 難しかった点・合わなかった点
特になし

## 👤 どんな人におすすめ？
リーダー層

---
`;

  const sampleIssueBody = `
### 書籍名
AI時代に強い質問力

### 著者
マツダミヒロ

### 読む前の目的
質問力を高めたい

### 得られた知識
良い質問は人生を変える

### 実務における活用
チームでの1on1に使う

### 良かった点
実例が多くて分かりやすい

### 難しかった点・合わなかった点
特になし

### 💡 どんな人におすすめ？
リーダー層
`;

  test('Slack由来のMarkdownから通知項目を抽出できること', () => {
    const result = parseReportMarkdown(sampleMarkdown, 'fallback title', 'fallback author');

    assert.strictEqual(result.title, 'AI時代に強い質問力');
    assert.strictEqual(result.author, '杉本光一');
    assert.strictEqual(result.objective, '質問力を高めたい');
    assert.strictEqual(result.takeaways, '良い質問は人生を変える');
    assert.strictEqual(result.application, 'チームでの1on1に使う');
    assert.strictEqual(result.positive, '実例が多くて分かりやすい');
    assert.strictEqual(result.negative, '特になし');
    assert.strictEqual(result.recommend, 'リーダー層');
  });

  test('Markdownにない値はfallbackまたはなしになること', () => {
    const result = parseReportMarkdown('# タイトルだけ', 'fallback title', 'fallback author');

    assert.strictEqual(result.title, 'fallback title');
    assert.strictEqual(result.author, 'fallback author');
    assert.strictEqual(result.objective, 'なし');
  });

  test('旧Issue本文からも通知項目を抽出できること', () => {
    const result = parseIssueBody(sampleIssueBody, 'fallback title', 'fallback author');

    assert.strictEqual(result.title, 'AI時代に強い質問力');
    assert.strictEqual(result.author, 'fallback author');
    assert.strictEqual(result.objective, '質問力を高めたい');
    assert.strictEqual(result.takeaways, '良い質問は人生を変える');
    assert.strictEqual(result.negative, '特になし');
    assert.strictEqual(result.recommend, 'リーダー層');
  });
});
