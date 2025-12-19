/**
 * 指定された Issue ノード ID の親 Issue (trackedInIssues) を検索します。
 * @param {object} graphqlClient - GitHub GraphQL クライアント (octokit.graphql)。
 * @param {string} nodeId - 子 Issue のノード ID。
 * @returns {Promise<number|null>} - 親 Issue の番号。見つからない場合は null。
 */
async function findParentIssue(graphqlClient, nodeId) {
  const query = `
    query($nodeId: ID!) {
      node(id: $nodeId) {
        ... on Issue {
          trackedInIssues(first: 1) {
            nodes {
              number
            }
          }
        }
      }
    }
  `;

  try {
    const result = await graphqlClient(query, { nodeId });

    // 深いネストの安全性チェック
    if (
      result &&
      result.node &&
      result.node.trackedInIssues &&
      result.node.trackedInIssues.nodes &&
      result.node.trackedInIssues.nodes.length > 0
    ) {
      return result.node.trackedInIssues.nodes[0].number;
    }

    return null;
  } catch (error) {
    console.error('GraphQL Error in findParentIssue:', error.message);
    throw error;
  }
}

module.exports = { findParentIssue };
