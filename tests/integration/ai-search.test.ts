import { describe, it, mock } from 'node:test';
import * as assert from 'node:assert';
import { main } from '../../scripts/書籍の推薦/recommend-books.js';

describe('統合テスト: AI検索ループ', () => {

    it('モック化されたクライアントでチャットを初期化しメッセージを送信できること', async () => {
        // テストランナーの停止を防ぐために process.exit をモック化
        const exitMock = mock.method(process, 'exit', () => { throw new Error('Process exited'); });

        // fs.writeFileSync のモック化について:
        // recommend-books で使用されるモジュールだけをモックするのは難しいため、
        // 今回はファイル書き込み自体は許容し、必要であればクリーンアップを行います。
        // ただし、recommend-books が vectors.json 不在により終了しないか確認する必要があります。

        // GenAI のモックアップ設定
        const mockResponse = {
            text: () => "Mocked AI Response: Recommend Book X",
            functionCalls: () => undefined
        };
        const mockResult = {
            response: mockResponse
        };

        const sendMessageMock = mock.fn(() => Promise.resolve(mockResult));

        const mockModel = {
            startChat: mock.fn(() => ({
                sendMessage: sendMessageMock
            }))
        };

        const mockGenAI = {
            getGenerativeModel: mock.fn(() => mockModel)
        };

        // 環境変数の準備
        process.env.USER_REQUEST = "【役割】: Test Role";

        // コンソール出力の抑制 (デバッグ時はコメントアウトを外す)
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => {};
        console.error = () => {};
        // 失敗時のデバッグのために出力維持が必要な場合はここを調整

        try {
            await main(mockGenAI);
        } catch (e: any) {
            if (e.message === 'Process exited') {
                assert.fail('main() が process.exit() を呼び出しました');
            }
            throw e;
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }

        // 呼び出し確認
        assert.strictEqual(mockModel.startChat.mock.callCount(), 1, 'startChat が呼ばれるべきです');
        assert.strictEqual(sendMessageMock.mock.callCount(), 1, 'sendMessage が呼ばれるべきです');
    });

    it('APIエラー時に適切にエラーハンドリングして終了すること', async () => {
        // process.exit のモック化
        const exitMock = mock.method(process, 'exit', (code: number | undefined) => {
            throw new Error(`Process exited with code ${code}`);
        });

        // 失敗する sendMessage のモック
        const sendMessageMock = mock.fn(() => Promise.reject(new Error('API Connection Failed')));

        const mockModel = {
            startChat: mock.fn(() => ({
                sendMessage: sendMessageMock
            }))
        };

        const mockGenAI = {
            getGenerativeModel: mock.fn(() => mockModel)
        };

        // 環境変数
        process.env.USER_REQUEST = "【役割】: Test Role";

        // コンソール出力の抑制
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => {};
        console.error = () => {};

        try {
            await main(mockGenAI);
            assert.fail('エラー時プロセスが終了しませんでした');
        } catch (e: any) {
            // main() は catch ブロックで console.error を吐き、process.exit(1) を呼ぶはず
            assert.strictEqual(e.message, 'Process exited with code 1');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }
    });

    it('AIがツール実行（Google Books）を要求した場合、ツールが実行されループすること', async () => {
        // process.exit のモック
        const exitMock = mock.method(process, 'exit', (code: number | undefined) => {
            throw new Error(`Process exited with code ${code}`);
        });

        // 1. fetch のモック (Google Books API)
        const mockFetch = mock.method(global, 'fetch', async (url: any) => {
            if (url.includes('googleapis.com')) {
                assert.ok(url.includes('langRestrict=ja'), 'URL must restrict to Japanese books');
                return {
                    json: async () => ({
                        items: [{ volumeInfo: { title: "Mocked Book", authors: ["Mock Author"], infoLink: "http://mock", language: "ja" } }]
                    })
                };
            }
            return { json: async () => ({}) };
        });

        // 2. GenAIの応答モック (Multi-turn)
        // 1回目: ツール呼び出し要求 (functionCalls が配列を返す)
        const firstTurnResponse = {
            text: () => "Let me check Google Books.",
            functionCalls: () => [{ name: "searchGoogleBooks", args: { query: "Test Query" } }]
        };
        // 2回目: 最終回答 (functionCalls が undefined または空)
        const secondTurnResponse = {
            text: () => "I found 'Mocked Book'.",
            functionCalls: () => undefined
        };

        let mockCallCount = 0;
        const sendMessageMock = mock.fn(() => {
            mockCallCount++;
            if (mockCallCount === 1) {
                return Promise.resolve({ response: firstTurnResponse });
            } else {
                return Promise.resolve({ response: secondTurnResponse });
            }
        });

        const mockModel = {
            startChat: mock.fn(() => ({
                sendMessage: sendMessageMock
            }))
        };

        const mockGenAI = {
            getGenerativeModel: mock.fn(() => mockModel)
        };

        // 環境変数
        process.env.USER_REQUEST = "【役割】: Test Role";
        // コンソール出力抑制
        const originalLog = console.log;
        const originalError = console.error;
        // console.log = () => {};
        // console.error = () => {};

        try {
            await main(mockGenAI);
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
            mockFetch.mock.restore();
        }

        // 検証
        // 1. startChat は1回呼ばれる
        assert.strictEqual(mockModel.startChat.mock.callCount(), 1);
        // 2. sendMessage は2回呼ばれる (1回目: ユーザー入力, 2回目: ツール結果)
        assert.strictEqual(sendMessageMock.mock.callCount(), 2, 'sendMessageはツール結果報告のために2回呼ばれるべきです');

        // 3. 2回目の呼び出し引数にツール実行結果が含まれているか確認
        const secondCallArgs: any = sendMessageMock.mock.calls[1].arguments;
        // arguments[0] は functionResponses の配列のはず
        assert.ok(Array.isArray(secondCallArgs[0]), '2回目の送信は配列（ツール結果）であるべき');
        assert.strictEqual(secondCallArgs[0][0].functionResponse.name, 'searchGoogleBooks');
        // 結果の中身も確認できる
        assert.strictEqual(secondCallArgs[0][0].functionResponse.response.books[0].title, 'Mocked Book');
    });
    it('Google Books APIの結果から日本語以外の書籍をフィルタリングすること', async () => {
        // process.exit のモック
        const exitMock = mock.method(process, 'exit', (code: number | undefined) => {
            throw new Error(`Process exited with code ${code}`);
        });

        // 1. fetch のモック (Google Books API) - 混合言語を返す
        const mockFetch = mock.method(global, 'fetch', async (url: any) => {
            if (url.includes('googleapis.com')) {
                return {
                    json: async () => ({
                        items: [
                            { volumeInfo: { title: "Japanese Book", authors: ["J-Author"], language: "ja", infoLink: "http://jp" } },
                            { volumeInfo: { title: "English Book", authors: ["E-Author"], language: "en", infoLink: "http://en" } },
                            { volumeInfo: { title: "Unknown Book", authors: ["U-Author"], infoLink: "http://unknown" } } // language field missing
                        ]
                    })
                };
            }
            return { json: async () => ({}) };
        });

        // 2. GenAIの応答モック
        const firstTurnResponse = {
            text: () => "Let me check.",
            functionCalls: () => [{ name: "searchGoogleBooks", args: { query: "Test Query" } }]
        };
        const secondTurnResponse = {
            text: () => "Found books.",
            functionCalls: () => undefined
        };

        let mockCallCount = 0;
        const sendMessageMock = mock.fn(() => {
            mockCallCount++;
            if (mockCallCount === 1) {
                return Promise.resolve({ response: firstTurnResponse });
            } else {
                return Promise.resolve({ response: secondTurnResponse });
            }
        });

        const mockModel = {
            startChat: mock.fn(() => ({ sendMessage: sendMessageMock }))
        };
        const mockGenAI = { getGenerativeModel: mock.fn(() => mockModel) };

        // 環境変数
        process.env.USER_REQUEST = "【役割】: Test Role";

        // コンソール出力抑制
         const originalLog = console.log;
         const originalError = console.error;
         console.log = () => {};
         console.error = () => {};

        try {
            await main(mockGenAI);
        } finally {
             console.log = originalLog;
             console.error = originalError;
            exitMock.mock.restore();
            mockFetch.mock.restore();
        }

        // 検証: 2回目のsendMessageの引数（ツール結果）に日本語の本だけが含まれているか
        const secondCallArgs: any = sendMessageMock.mock.calls[1].arguments;
        const books = secondCallArgs[0][0].functionResponse.response.books;

        assert.strictEqual(books.length, 1, '日本語の本だけが残るべきです');
        assert.strictEqual(books[0].title, 'Japanese Book');
    });
});

