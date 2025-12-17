import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

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
        {
          text: '杉本 光一',
          collapsed: true,
          items: [
            { text: 'AI時代に強い質問力', link: '/knowledge_base/book_reports/2025-12-03-ai時代に強い質問力-読書感想文-10' },
            { text: 'AI駆動開発の教科書', link: '/knowledge_base/book_reports/2025-12-03-ai駆動開発の教科書-読書感想文-12' },
            { text: 'GCP入門', link: '/knowledge_base/book_reports/2025-12-16-プログラマのためのgoogle-cloud-platform入門-サービスの全体像からクラウドネイテ-80' },
          ]
        }
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
