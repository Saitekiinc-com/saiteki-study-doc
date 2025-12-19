
const { globSync } = require('glob');
const fs = require('fs');
const path = require('path');

function getSidebarBooks() {
  const files = globSync('docs/knowledge_base/book_reports/*.md');
  console.log('Found files:', files);

  const authorMap = {
    'koxtuichi': '杉本 光一',
    'sugimotokouichi': '杉本 光一'
  }

  const booksByAuthor = {};

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // フロントマターからタイトルと著者を抽出するための正規表現（簡易版）
    const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
    const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m);

    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    let authorId = authorMatch ? authorMatch[1].trim() : 'Other';

    // 必要に応じて著者IDを正規化（例: @の削除）
    authorId = authorId.replace(/^@/, '');

    console.log(`File: ${file}, AuthorId: '${authorId}', Title: ${title}`);

    const link = '/knowledge_base/book_reports/' + path.basename(file, '.md');

    if (!booksByAuthor[authorId]) {
      booksByAuthor[authorId] = [];
    }
    booksByAuthor[authorId].push({ text: title, link });
  });

  // グループとアイテムをソート
  const sidebarGroups = [];
  for (const authorId in booksByAuthor) {
    const displayName = authorMap[authorId] || authorId;
    console.log(`Group: AuthorId='${authorId}', DisplayName='${displayName}'`);
    // リンク（日付を含む）の降順でアイテムをソートし、最新のものを最初に表示する
    booksByAuthor[authorId].sort((a, b) => b.link.localeCompare(a.link));

    sidebarGroups.push({
      text: displayName,
      collapsed: true,
      items: booksByAuthor[authorId]
    });
  }

  return sidebarGroups;
}

const result = getSidebarBooks();
console.log('Final Sidebar Structure:', JSON.stringify(result, null, 2));
