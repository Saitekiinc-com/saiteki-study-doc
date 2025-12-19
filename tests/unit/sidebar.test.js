
import { test } from 'node:test'
import assert from 'node:assert'
import { getSidebarBooks } from '../../docs/.vitepress/sidebar.mjs'

test('getSidebarBooks groups different author representations together', (t) => {
  // Mock dependencies
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

  // Execute
  const sidebar = getSidebarBooks({
    globSync: mockGlobSync,
    fs: mockFs,
    path: mockPath
  })

  // Verify
  assert.strictEqual(sidebar.length, 1, 'Should have exactly one group')
  assert.strictEqual(sidebar[0].text, '杉本 光一', 'Group name should be standardized')
  assert.strictEqual(sidebar[0].items.length, 2, 'Should contain both items')

  // Verify items are present and titles are normalized
  const titles = sidebar[0].items.map(i => i.text).sort()
  // "📚 [AI駆動開発の教科書] 読書感想文" should become "[AI駆動開発の教科書] 読書感想文" (or just without the icon)
  // Assuming the original logic didn't strip [], just the icon.
  // Wait, in my mock above I didn't put the icon in the mock data. Let me update the mock data too.
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

  // Expect the icon to be preserved/added
  assert.strictEqual(sidebar[0].items[0].text, '📚 [Icon Book] Report')
})
