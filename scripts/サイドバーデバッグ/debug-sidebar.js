
const { globSync } = require('glob');
const fs = require('fs');
const path = require('path');

function getSidebarBooks(injectedGlobSync, injectedFs) {
  const globFn = injectedGlobSync || globSync;
  const fsMod = injectedFs || fs;

  const files = globFn('docs/knowledge_base/book_reports/*.md');
  console.log('Found files:', files);

  const authorMap = {
    'koxtuichi': '杉本 光一',
    'sugimotokouichi': '杉本 光一',
    '杉本光一': '杉本 光一',
    '杉本 光一': '杉本 光一'
  }

  const booksByAuthor = {};

  files.forEach(file => {
    const content = fsMod.readFileSync(file, 'utf-8');
    // フロントマターからタイトルと著者を抽出するための正規表現（簡易版）
    const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
    const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m);

    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    let authorId = authorMatch ? authorMatch[1].trim() : 'Other';

    // 必要に応じて著者IDを正規化（例: @の削除）
    authorId = authorId.replace(/^@/, '');

    const displayName = authorMap[authorId] || authorId;

    console.log(`File: ${file}, AuthorId: '${authorId}', DisplayName: '${displayName}', Title: ${title}`);

    const link = '/knowledge_base/book_reports/' + path.basename(file, '.md');

    // DisplayName (杉本 光一) をキーにしてグループ化する
    // NOTE: 著者が異なるIDでも同じ名前ならマージされる
    if (!booksByAuthor[displayName]) {
      booksByAuthor[displayName] = [];
    }
    booksByAuthor[displayName].push({ text: title, link });
  });

  // グループとアイテムをソート
  const sidebarGroups = [];
  for (const displayName in booksByAuthor) {
    console.log(`Group: DisplayName='${displayName}'`);
    // リンク（日付を含む）の降順でアイテムをソートし、最新のものを最初に表示する
    booksByAuthor[displayName].sort((a, b) => b.link.localeCompare(a.link));

    sidebarGroups.push({
      text: displayName,
      collapsed: true,
      items: booksByAuthor[displayName]
    });
  }

  return sidebarGroups;
}

if (require.main === module) {
  const result = getSidebarBooks();
  console.log('Final Sidebar Structure:', JSON.stringify(result, null, 2));
}

module.exports = { getSidebarBooks };
