/**
 * Finds the parent issue (trackedInIssues) for a given issue Node ID.
 * @param {object} graphqlClient - The GitHub GraphQL client (octokit.graphql).
 * @param {string} nodeId - The Node ID of the child issue.
 * @returns {Promise<number|null>} - The issue number of the parent, or null if not found.
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

    // Safety checks for deep nesting
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
