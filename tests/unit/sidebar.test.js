
import { test } from 'node:test'
import assert from 'node:assert'
import { getSidebarBooks } from '../../docs/.vitepress/sidebar.mjs'

test('getSidebarBooks groups different author representations together', (t) => {
  // 依存関係のモック
  const mockFiles = [
    '/path/to/report1.md',
    '/path/to/report2.md'
  ]

  const mockGlobSync = () => mockFiles

  const mockFs = {
    readFileSync: (file) => {
      if (file === '/path/to/report1.md') {
        return `---
title: "Report 1"
author: koxtuichi
---`
      }
      if (file === '/path/to/report2.md') {
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
      if (file === '/path/to/report1.md') return 'report1'
      if (file === '/path/to/report2.md') return 'report2'
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
