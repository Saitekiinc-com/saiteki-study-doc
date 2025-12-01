import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  base: '/saiteki-study-doc/',
  title: "Saiteki Engineering Training",
  description: "New Engineer Training Portal",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Frontend', link: '/training/curriculum/level1_knowledge' },
      { text: 'Backend', link: '/training/backend/index' },
      { text: 'AWS', link: '/training/aws/index' },
    ],

    sidebar: [
      {
        text: 'Frontend (React/TS)',
        collapsed: false,
        items: [
          { text: 'AI Native Engineering', link: '/training/ai_native_guide' },
          { text: 'Data Flow & System Design', link: '/training/data_flow_guide' },
          { text: 'Lv.1 Knowledge', link: '/training/curriculum/level1_knowledge' },
          { text: 'Lv.2 Application', link: '/training/curriculum/level2_application' },
          { text: 'Lv.3 Quality', link: '/training/curriculum/level3_quality' },
          { text: 'Lv.4 Architecture', link: '/training/curriculum/level4_architecture' },
          { text: 'Skill Pyramid', link: '/training/curriculum/skill_pyramid' },
        ]
      },
      {
        text: 'Backend',
        collapsed: true,
        items: [
          { text: 'Lv.1 Foundation', link: '/training/backend/level1_foundation' },
          { text: 'Lv.2 Application', link: '/training/backend/level2_application' },
          { text: 'Lv.3 Quality', link: '/training/backend/level3_quality' },
          { text: 'Lv.4 Architecture', link: '/training/backend/level4_architecture' },
        ]
      },
      {
        text: 'AWS / Infrastructure',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/training/aws/index' },
        ]
      },
      {
        text: 'Management',
        items: [
          { text: 'GitHub Management Flow', link: '/training/management/github_flow' },
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
