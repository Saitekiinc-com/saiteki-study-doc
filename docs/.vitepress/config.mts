import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { getSidebarBooks } from './sidebar.mjs'

export default withMermaid({
  base: '/saiteki-study-doc/',
  title: "Saiteki AI Doc",
  description: "AI-Native Engineering & Knowledge Base",
  themeConfig: {
    nav: [
      { text: 'AI Doc', link: '/' },
      { text: '書籍レポート', link: '/knowledge_base/' },
    ],

    sidebar: {
      // Default sidebar for AI Doc pages
      '/': [
        {
          text: 'Curriculum WIP',
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
        }
      ],
      // Books Review sidebar
      '/knowledge_base/': [
        {
          text: '📋 ガイド',
          items: [
            { text: '投稿の流れ', link: '/knowledge_base/' },

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
