import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { getSidebarBooks } from './sidebar.mjs'

export default withMermaid({
  base: '/saiteki-study-doc/',
  title: "Saiteki AI Doc",
  description: "AI-Native Engineering & Knowledge Base",
  themeConfig: {
    nav: [
      { text: '書籍購入補助', link: '/knowledge_base/' },
    ],

    sidebar: {
      // Books Review sidebar
      '/knowledge_base/': [
        {
          text: '📋 ガイド',
          items: [
            { text: '書籍購入補助トップ', link: '/knowledge_base/' },
            {
              text: '書籍購入補助の流れ',
              link: '/knowledge_base/purchase_flow',
              collapsed: false,
              items: [
                { text: 'Slackで申請する', link: '/knowledge_base/slack_purchase_flow' },
              ]
            },
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
