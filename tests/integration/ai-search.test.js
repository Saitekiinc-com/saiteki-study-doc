const { test, describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { main } = require('../../scripts/recommend-books.js');

describe('Integration: AI Search Loop', () => {

    it('should initialize chat and send message with mocked client', async () => {
        // Mock process.exit to prevent test runner death
        const exitMock = mock.method(process, 'exit', () => { throw new Error('Process exited'); });

        // Mock fs.writeFileSync to avoid writing roadmap_body.md
        // We only mock it on the module used by recommend-books.
        // Since we can't easily mock require('fs') without a loader,
        // we will rely on file cleanup or just let it write.
        // But we MUST check if recommend-books is exiting due to missing vectors.json

        // Setup Mock for GenAI
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

        // Prepare Env
        process.env.USER_REQUEST = "【役割】: Test Role";

        // Log suppression
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => {};
        console.error = () => {};
        // Keeping console output to debug failure!

        try {
            await main(mockGenAI);
        } catch (e) {
            if (e.message === 'Process exited') {
                assert.fail('main() called process.exit()');
            }
            throw e;
        } finally {
            console.log = originalLog;
            console.error = originalError;
            exitMock.mock.restore();
        }

        // Verify calls
        assert.strictEqual(mockModel.startChat.mock.callCount(), 1, 'startChat should be called');
        assert.strictEqual(sendMessageMock.mock.callCount(), 1, 'sendMessage should be called');
    });
});
