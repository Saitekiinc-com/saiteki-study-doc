import * as core from '@actions/core';
import * as github from '@actions/github';

/**
 * 指定された Issue ノード ID の親 Issue (trackedInIssues) を検索します。
 * @param graphqlClient - GitHub GraphQL クライアント (octokit.graphql)。
 * @param nodeId - 子 Issue のノード ID。
 * @returns 親 Issue の番号。見つからない場合は null。
 */
export async function findParentIssue(graphqlClient: any, nodeId: string): Promise<number | null> {
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
    const result: any = await graphqlClient(query, { nodeId });

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
  } catch (error: any) {
    console.error('GraphQL Error in findParentIssue:', error.message);
    throw error;
  }
}

async function main() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is required');
    }

    const octokit = github.getOctokit(token);
    const nodeId = github.context.payload.issue?.node_id;

    if (!nodeId) {
      console.log('No issue node_id found in context. Skipping.');
      return;
    }

    const parentNum = await findParentIssue(octokit.graphql, nodeId);

    if (parentNum) {
      console.log(`Found parent issue via Tasklist: #${parentNum}`);
      core.setOutput('number', parentNum);
    } else {
      console.log('No parent tracked issue found.');
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

if (require.main === module) {
  main();
}
