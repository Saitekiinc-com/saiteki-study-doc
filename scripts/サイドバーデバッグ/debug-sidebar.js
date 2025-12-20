
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
    // Extract authorId from filename: YYYY-MM-DD-{authorId}-{title}-{issueId}.md
    // Fallback to frontmatter extraction for backward compatibility if filename doesn't match pattern
    const filename = path.basename(file, '.md');
    const filenameParts = filename.match(/^\d{4}-\d{2}-\d{2}-(.*?)-.*-\d+$/);

    let authorId = 'Other';
    let title = path.basename(file, '.md'); // Default title
    if (filenameParts && filenameParts[1]) {
       authorId = filenameParts[1];
       // Extract title from filename: YYYY-MM-DD-{authorId}-{title}-{issueId}.md
       const titleParts = filename.match(/^\d{4}-\d{2}-\d{2}-.*?-(.*?)-\d+$/);
       if (titleParts && titleParts[1]) {
         title = titleParts[1];
       }
    } else {
       // Fallback: use frontmatter for old files
    // フロントマターからタイトルと著者を抽出するための正規表現（簡易版）
    const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);

    title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
       const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m);
       authorId = authorMatch ? authorMatch[1].trim() : 'Other';
       authorId = authorId.replace(/^@/, '');
    }

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
