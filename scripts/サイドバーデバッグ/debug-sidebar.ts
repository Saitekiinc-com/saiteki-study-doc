import { globSync } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

type SidebarItem = {
  text: string;
  link: string;
};

type SidebarGroup = {
  text: string;
  collapsed: boolean;
  items: SidebarItem[];
};

type InjectedGlobSync = (pattern: string | string[], options?: any) => string[];
type InjectedFs = { readFileSync: (path: string, encoding: BufferEncoding) => string };

export function getSidebarBooks(injectedGlobSync?: InjectedGlobSync, injectedFs?: InjectedFs): SidebarGroup[] {
  const globFn = injectedGlobSync || globSync;
  const fsMod = injectedFs || fs;

  // TypeScript definition requires glob pattern to be string or string[]
  const files = globFn('docs/knowledge_base/book_reports/*.md') as string[];
  console.log('Found files:', files);

  const authorMap: { [key: string]: string } = {
    'koxtuichi': '杉本 光一',
    'sugimotokouichi': '杉本 光一',
    '杉本光一': '杉本 光一',
    '杉本 光一': '杉本 光一'
  };

  const booksByAuthor: { [key: string]: SidebarItem[] } = {};

  files.forEach(file => {
    const content = fsMod.readFileSync(file, 'utf-8');
    // ファイル名からauthorIdを抽出: YYYY-MM-DD-{authorId}-{title}-{issueId}.md
    // ファイル名がパターンに一致しない場合は、後方互換性のためにフロントマター抽出にフォールバック
    const filename = path.basename(file, '.md');
    const filenameParts = filename.match(/^\d{4}-\d{2}-\d{2}-(.*?)-.*-\d+$/);

    let authorId = 'Other';
    // フロントマターから著者を抽出 (優先)
    const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m);
    if (authorMatch) {
      authorId = authorMatch[1].trim().replace(/^@/, '');
    } else {
      // フォールバック: ファイル名から抽出
      if (filenameParts && filenameParts[1]) {
        authorId = filenameParts[1];
      }
    }

    let title = path.basename(file, '.md'); // デフォルトタイトル
    // ファイル名からタイトルを抽出: YYYY-MM-DD-{authorId}-{title}-{issueId}.md
    // ... (existing title logic)
    if (filenameParts && filenameParts[1]) {
      const titleParts = filename.match(/^\d{4}-\d{2}-\d{2}-.*?-(.*?)-\d+$/);
      if (titleParts && titleParts[1]) {
        title = titleParts[1];
      }
    } else {
      // フォールバック: フロントマターからタイトル (既存ロジック)
      const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m);
      title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
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
  const sidebarGroups: SidebarGroup[] = [];
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
