import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/saiteki-doc/',
  title: "React/TS Training",
  description: "New Engineer Training Portal",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Curriculum', link: '/training/curriculum/01_basics' },
    ],

    sidebar: [
      {
        text: 'Curriculum',
        items: [
          { text: '01. Basics', link: '/training/curriculum/01_basics' },
          { text: '02. Practical', link: '/training/curriculum/02_practical' },
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
