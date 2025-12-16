// Configuration for Book Report Issues and Markdown files
// This centralizes the mapping between GitHub Issue Labels and Markdown Headers.
// If you change the Issue Template (.github/ISSUE_TEMPLATE/book_report.yml), update the 'issueLabel' here.

module.exports = {
  // Fields to extract from the Issue Body and save to Markdown
  fields: [
    {
      key: 'objective',
      issueLabel: '読む前の目的',
      markdownHeader: '## Objective (読む前の目的)'
    },
    {
      key: 'takeaways',
      issueLabel: '得られた知識',
      markdownHeader: '## Key Takeaways (得られた知識)'
    },
    {
      key: 'next_action',
      issueLabel: '実務における活用',
      markdownHeader: '## Next Action (実務活用)'
    },
    {
      key: 'positive',
      issueLabel: '良かった点',
      markdownHeader: '## Positive (良かった点)'
    },
    {
      key: 'negative',
      issueLabel: '難しかった点・合わなかった点',
      markdownHeader: '## Negative (難しかった点)'
    },
    {
      key: 'recommend',
      issueLabel: '💡 どんな人におすすめ？',
      markdownHeader: '## Recommend (おすすめ)'
    }
  ],

  // Metadata fields (Input type: input)
  metaFields: {
    title: { issueLabel: '書籍名' },
    author: { issueLabel: '著者' },
    link: { issueLabel: 'リンク' }
  }
};
