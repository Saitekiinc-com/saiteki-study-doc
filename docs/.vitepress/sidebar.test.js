
import { test } from 'node:test'
import assert from 'node:assert'
import { getSidebarBooks } from './sidebar.mjs'

test('getSidebarBooks groups different author representations together', (t) => {
  // 依存関係のモック
  const mockFiles = [
    '/path/to/2025-12-20-koxtuichi-report1-100.md',
    '/path/to/2025-12-21-sugimotokouichi-report2-101.md'
  ]

  const mockGlobSync = () => mockFiles

  const mockFs = {
    readFileSync: (file) => {
      // Logic for new format: author is in filename, so frontmatter author might differ or be absent
      // But for this test let's keep consistent
      if (file.includes('report1')) {
        return `---
title: "Report 1"
author: koxtuichi
---`
      }
      if (file.includes('report2')) {
        return `---
title: "Report 2"
author: 杉本光一
---`
      }
      return ''
    }
  }

  const mockPath = {
    basename: (file, ext) => {
      if (file.includes('report1')) return '2025-12-20-koxtuichi-report1-100'
      if (file.includes('report2')) return '2025-12-21-sugimotokouichi-report2-101'
      return 'unknown'
    }
  }

  // 実行
  const sidebar = getSidebarBooks({
    globSync: mockGlobSync,
    fs: mockFs,
    path: mockPath
  })

  // 検証
  assert.strictEqual(sidebar.length, 1, 'グループは正確に1つであるべき')
  assert.strictEqual(sidebar[0].text, '杉本 光一', 'グループ名は標準化されるべき')
  assert.strictEqual(sidebar[0].items.length, 2, '両方のアイテムが含まれるべき')

  // アイテムが存在し、タイトルが正規化されていることを検証
  const titles = sidebar[0].items.map(i => i.text).sort()
  // "📚 [AI駆動開発の教科書] 読書感想文" は "[AI駆動開発の教科書] 読書感想文" (またはアイコンなし) になるべき
  // 元のロジックが [] を削除せず、アイコンだけを削除すると仮定。
  // 待って、上記のモックではアイコンをデータに入れていなかった。モックデータも更新しよう。
  // "undefined" author ID from report2 (because it's 'undefined' string in filename mock)
  // Wait, report 2 filename: 2025-12-21-undefined-report2-101.md
  // The logic regex: /^\d{4}-\d{2}-\d{2}-(.*?)-.*-\d+$/
  // So authorId = 'undefined'
  // But wait, the previous test expected group '杉本 光一'.
  // 'undefined' is not mapped in authorMap.
  // Unless we use 'sugimotokouichi' in filename for report2 to match the map.
  // Let's change report2 filename in Step 226 to use 'sugimotokouichi' to test mapping success.

  assert.deepStrictEqual(titles, ['📚 Report 1', '📚 Report 2'])
})

test('getSidebarBooks normalizes titles by ensuring book icons', (t) => {
  const mockGlobSync = () => ['/path/to/icon-book.md']
  const mockFs = {
    readFileSync: () => `---
title: "📚 [Icon Book] Report"
author: koxtuichi
---`
  }
  const mockPath = { basename: () => 'icon-book' }

  const sidebar = getSidebarBooks({
    globSync: mockGlobSync,
    fs: mockFs,
    path: mockPath
  })

  // アイコンが保持/追加されることを期待
  assert.strictEqual(sidebar[0].items[0].text, '📚 [Icon Book] Report')
})
