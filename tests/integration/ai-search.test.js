const { test, describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { main } = require('../../scripts/recommend-books.js');

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
        } catch (e) {
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
        const exitMock = mock.method(process, 'exit', (code) => {
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
        } catch (e) {
            // main() は catch ブロックで console.error を吐き、process.exit(1) を呼ぶはず
            assert.strictEqual(e.message, 'Process exited with code 1');
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }
    });
});
