import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  base: '/saiteki-doc/',
  title: "React/TS Training",
  description: "New Engineer Training Portal",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Curriculum', link: '/training/curriculum/level1_knowledge' },
    ],

    sidebar: [
      {
        text: 'Curriculum',
        items: [
          { text: 'Lv.1 Knowledge', link: '/training/curriculum/level1_knowledge' },
          { text: 'Lv.2 Application', link: '/training/curriculum/level2_application' },
          { text: 'Lv.3 Quality', link: '/training/curriculum/level3_quality' },
          { text: 'Lv.4 Architecture', link: '/training/curriculum/level4_architecture' },
          { text: 'Skill Pyramid', link: '/training/curriculum/skill_pyramid' },
        ]
      },
      {
        text: 'Management',
        items: [
          { text: 'Progress Tracker', link: '/training/management/progress_tracker' },
          { text: 'Mentoring Guide', link: '/training/management/mentoring_guide' },
        ]
      },
      {
        text: 'Personalization',
        items: [
          { text: 'Guide', link: '/training/personalization/guide' },
        ]
      }
    ],

    socialLinks: [
      // { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
