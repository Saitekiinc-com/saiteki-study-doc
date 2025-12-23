
import { globSync as defaultGlobSync } from 'glob'
import * as defaultFs from 'fs'
import * as defaultPath from 'path'

export function getSidebarBooks({
  globSync = defaultGlobSync,
  fs = defaultFs,
  path = defaultPath
} = {}) {
  const files = globSync('docs/knowledge_base/book_reports/*.md')
    .filter(file => !file.toLowerCase().includes('e2ebot') && !file.includes('E2E-Test'))


  const authorMap = {
    'koxtuichi': '杉本 光一',
    'sugimotokouichi': '杉本 光一',
    '杉本光一': '杉本 光一',
    '杉本 光一': '杉本 光一'
  }

  const booksByAuthor = {}

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8')
    // Simple regex to extract title and author from frontmatter
    const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m)

    let title = titleMatch ? titleMatch[1] : path.basename(file, '.md')
    // Normalize title: remove generic book icon and leading spaces
    title = '📚 ' + title.replace(/^📚\s*/, '')
    const link = '/knowledge_base/book_reports/' + path.basename(file, '.md')

    // Extract authorId from filename: YYYY-MM-DD-{authorId}-{title}-{issueId}.md
    // Fallback to frontmatter extraction for backward compatibility if filename doesn't match pattern
    const filename = path.basename(file, '.md')
    const filenameParts = filename.match(/^\d{4}-\d{2}-\d{2}-(.*?)-.*-\d+$/)

    let authorId = 'Other'
    if (filenameParts && filenameParts[1]) {
      authorId = filenameParts[1]
    } else {
      // Fallback: use frontmatter for old files
      const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m)
      authorId = authorMatch ? authorMatch[1].trim() : 'Other'
      authorId = authorId.replace(/^@/, '')
    }

    // Fallback if no mapping exists: use the raw ID
    // But since we want to duplicate handling, we will rely on displayName mapping later

    if (!booksByAuthor[authorId]) {
      booksByAuthor[authorId] = []
    }
    booksByAuthor[authorId].push({ text: title, link })
  })

  // Sort groups and items
  const sidebarGroups = []
  for (const authorId in booksByAuthor) {
    const displayName = authorMap[authorId] || authorId

    // Items for this author ID
    const items = booksByAuthor[authorId]
    items.sort((a, b) => b.link.localeCompare(a.link))

    // Check if a group with this displayName already exists
    const existingGroup = sidebarGroups.find(g => g.text === displayName)
    if (existingGroup) {
      existingGroup.items.push(...items)
      // Re-sort items in the existing group
      existingGroup.items.sort((a, b) => b.link.localeCompare(a.link))
    } else {
      sidebarGroups.push({
        text: displayName,
        collapsed: true,
        items: items
      })
    }
  }

  return sidebarGroups
}
