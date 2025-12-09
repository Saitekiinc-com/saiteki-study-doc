// Configuration for Book Report Issues and Markdown files
// This centralizes the mapping between GitHub Issue Labels and Markdown Headers.
// If you change the Issue Template (.github/ISSUE_TEMPLATE/book_report.yml), update the 'issueLabel' here.

module.exports = {
  // Fields to extract from the Issue Body and save to Markdown
  fields: [
    {
      key: 'objective',
      issueLabel: '読む前の目的 (Objective)',
      markdownHeader: '## Objective (読む前の目的)' // Standardized header for scripts
    },
    {
      key: 'takeaways',
      issueLabel: '得られた知識・気づき (Key Takeaways)',
      markdownHeader: '## Key Takeaways (得られた知識)'
    },
    {
      key: 'positive',
      issueLabel: '👍 Positive (良かった点・学び)',
      markdownHeader: '## Positive (良かった点)'
    },
    {
      key: 'negative',
      issueLabel: '👎 Negative (難しかった点・合わなかった点)',
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
