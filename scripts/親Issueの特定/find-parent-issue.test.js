const { test } = require('node:test');
const assert = require('node:assert');
const { findParentIssue } = require('./find-parent-issue.js');

test('find-parent-issue.js 単体テスト', async (t) => {

    await t.test('親Issueが存在する場合、番号を返すこと', async () => {
        const mockClient = async (query, vars) => {
            assert.strictEqual(vars.nodeId, 'node_123');
            return {
                node: {
                    trackedInIssues: {
                        nodes: [{ number: 999 }]
                    }
                }
            };
        };

        const result = await findParentIssue(mockClient, 'node_123');
        assert.strictEqual(result, 999);
    });

    await t.test('親Issueが存在しない場合、nullを返すこと', async () => {
        const mockClient = async () => ({
            node: {
                trackedInIssues: {
                    nodes: []
                }
            }
        });

        const result = await findParentIssue(mockClient, 'node_123');
        assert.strictEqual(result, null);
    });

    await t.test('GraphQLエラー時に例外をスローすること', async () => {
        const mockClient = async () => {
            throw new Error('API Error');
        };

        await assert.rejects(
            async () => await findParentIssue(mockClient, 'node_123'),
            /API Error/
        );
    });
});
