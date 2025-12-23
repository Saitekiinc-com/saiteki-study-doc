import { test, describe, it, mock } from 'node:test';
import * as assert from 'node:assert';
import { verifyModel } from './verify_model.js';

describe('verify_model.ts 単体テスト', () => {

    it('API キーが正常に機能しモデルからの応答がある場合、成功すること', async () => {
        // process.exit をモック化
        const exitMock = mock.method(process, 'exit', () => {
            throw new Error('Process exited');
        });

        // モックの環境変数
        const mockEnv = {
            GEMINI_API_KEY: 'test-api-key'
        };

        // モックのGenerativeAI クラス
        const mockGenAI = class MockGenAI {
            constructor(public apiKey: string) { }

            getGenerativeModel() {
                return {
                    generateContent: async () => ({
                        response: {
                            text: () => 'Hello from mock!'
                        }
                    })
                };
            }
        };

        // コンソール出力を抑制
        const originalLog = console.log;
        const originalError = console.error;
        const logs: string[] = [];
        console.log = (msg: string) => logs.push(msg);
        console.error = () => { };

        try {
            await verifyModel(mockGenAI as any, mockEnv);

            // 成功メッセージが出力されたか確認
            assert.ok(logs.some(l => l.includes('✅ Success!')), 'Success message should be logged');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }
    });

    it('API キーが設定されていない場合、エラーで終了すること', async () => {
        // process.exit をモック化
        const exitMock = mock.method(process, 'exit', (code: number) => {
            throw new Error(`Process exited with code ${code}`);
        });

        // API キーなしのモック環境変数
        const mockEnv = {};

        // コンソール出力を抑制
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => { };
        console.error = () => { };

        try {
            await verifyModel(undefined, mockEnv);
            assert.fail('API キー未設定時に終了すべきです');
        } catch (e: any) {
            assert.strictEqual(e.message, 'Process exited with code 1');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }
    });

    it('API 呼び出しが失敗した場合、エラーで終了すること', async () => {
        // process.exit をモック化
        const exitMock = mock.method(process, 'exit', (code: number) => {
            throw new Error(`Process exited with code ${code}`);
        });

        const mockEnv = {
            GEMINI_API_KEY: 'test-api-key'
        };

        // エラーを発生させるモックのGenerativeAI クラス
        const mockGenAI = class MockGenAI {
            constructor(public apiKey: string) { }

            getGenerativeModel() {
                return {
                    generateContent: async () => {
                        throw new Error('API connection failed');
                    }
                };
            }
        };

        // コンソール出力を抑制
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => { };
        console.error = () => { };

        try {
            await verifyModel(mockGenAI as any, mockEnv);
            assert.fail('API エラー時に終了すべきです');
        } catch (e: any) {
            assert.strictEqual(e.message, 'Process exited with code 1');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }
    });
});
