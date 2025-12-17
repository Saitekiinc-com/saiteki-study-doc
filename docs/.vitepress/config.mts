import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { globSync } from 'glob'
import * as fs from 'fs'
import * as path from 'path'

export default withMermaid({
  base: '/saiteki-study-doc/',
  title: "Saiteki AI Doc",
  description: "AI-Native Engineering & Knowledge Base",
  themeConfig: {
    nav: [
      { text: 'AI Doc', link: '/' },
      { text: 'Books Review', link: '/knowledge_base/' },
    ],

    sidebar: {
      // Default sidebar for AI Doc pages
      '/': [
        {
          text: 'Curriculum (Fullstack)',
          collapsed: false,
          items: [
            { text: 'AI Native Engineering', link: '/training/ai_native_guide' },
            { text: 'Data Flow & System Design', link: '/training/data_flow_guide' },
            { text: 'Lv.1 Foundation', link: '/training/curriculum/level1_foundation' },
            { text: 'Lv.1 Workshop', link: '/training/curriculum/level1_workshop' },
            { text: 'Lv.2 Application', link: '/training/curriculum/level2_application' },
            { text: 'Lv.3 Quality', link: '/training/curriculum/level3_quality' },
            { text: 'Lv.4 Architecture', link: '/training/curriculum/level4_architecture' },
          ]
        },
        {
          text: 'AWS / Infrastructure',
          collapsed: false,
          items: [
            { text: 'Introduction', link: '/training/aws/index' },
          ]
        },
        {
          text: 'Guides',
          items: [
            { text: 'Book Features', link: '/guide/book-features' },
          ]
        }
      ],
      // Books Review sidebar
      '/knowledge_base/': [
        {
          text: '📋 ガイド',
          items: [
            { text: '投稿の流れ', link: '/knowledge_base/' },
            { text: '感想文一覧', link: '/knowledge_base/book_list' },
          ]
        },
        ...getSidebarBooks()
      ]
    },

    search: {
      provider: 'local'
    },

    socialLinks: [
      // { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})

function getSidebarBooks() {
  const files: string[] = globSync('docs/knowledge_base/book_reports/*.md')
  const authorMap: Record<string, string> = {
    'koxtuichi': '杉本 光一',
    'sugimotokouichi': '杉本 光一'
  }

  const booksByAuthor: Record<string, { text: string, link: string }[]> = {}

  files.forEach((file: string) => {
    const content = fs.readFileSync(file, 'utf-8')
    // Simple regex to extract title and author from frontmatter
    const titleMatch = content.match(/^title:\s*["']?(.*?)["']?$/m)
    const authorMatch = content.match(/^author:\s*["']?(.*?)["']?$/m)

    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md')
    let authorId = authorMatch ? authorMatch[1].trim() : 'Other'

    // Normalize authorId if needed (e.g. remove @)
    authorId = authorId.replace(/^@/, '')

    const link = '/knowledge_base/book_reports/' + path.basename(file, '.md')

    if (!booksByAuthor[authorId]) {
      booksByAuthor[authorId] = []
    }
    booksByAuthor[authorId].push({ text: title, link })
  })

  // Sort groups and items
  const sidebarGroups: any[] = []
  for (const authorId in booksByAuthor) {
    const displayName = authorMap[authorId] || authorId
    // Sort items by link (which contains date) descending to show newest first
    booksByAuthor[authorId].sort((a: any, b: any) => b.link.localeCompare(a.link))

    sidebarGroups.push({
      text: displayName,
      collapsed: true,
      items: booksByAuthor[authorId]
    })
  }

  return sidebarGroups
}
