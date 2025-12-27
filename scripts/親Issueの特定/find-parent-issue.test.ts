import { test } from 'node:test';
import * as assert from 'node:assert';
import { findParentIssue } from './find-parent-issue.js';

test('find-parent-issue.ts 単体テスト', async (t) => {

    await t.test('Sub-issueとして親Issueが存在する場合（parentフィールド）、番号を返すこと', async () => {
        const mockClient = async (query: string, vars: any) => {
            return {
                node: {
                    parent: { number: 888 },
                    trackedInIssues: { nodes: [] }
                }
            };
        };
        const result = await findParentIssue(mockClient, 'node_sub');
        assert.strictEqual(result, 888);
    });

    await t.test('Tasklistとして親Issueが存在する場合（trackedInIssues）、番号を返すこと', async () => {
        const mockClient = async (query: string, vars: any) => {
            return {
                node: {
                    parent: null,
                    trackedInIssues: {
                        nodes: [{ number: 999 }]
                    }
                }
            };
        };

        const result = await findParentIssue(mockClient, 'node_task');
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
