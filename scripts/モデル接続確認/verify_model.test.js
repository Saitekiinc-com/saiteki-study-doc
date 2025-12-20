const { test, describe, it, mock, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

// GoogleGenerativeAI のモックを作成
const mockGenerateContent = mock.fn();
const mockGetGenerativeModel = mock.fn(() => ({
  generateContent: mockGenerateContent
}));

const mockGoogleGenerativeAI = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  getGenerativeModel = mockGetGenerativeModel;
};

// requireのキャッシュ制御（mock.module）は Node 20 (CI環境) で非対応のため削除
// 代わりに verifyModel の DI (Dependency Injection) 機能を使用してテストする


const { verifyModel } = require('./verify_model.js');

describe('verify_model.js 単体テスト', () => {
  let exitMock;
  let consoleLogMock;
  let consoleErrorMock;

  beforeEach(() => {
    // process.exit をモック化
    exitMock = mock.method(process, 'exit', (code) => {
      throw new Error(`Process exited with code ${code}`);
    });
    // コンソール出力を抑制
    consoleLogMock = mock.method(console, 'log', () => {});
    consoleErrorMock = mock.method(console, 'error', () => {});

    // モックのリセット
    mockGetGenerativeModel.mock.resetCalls();
    mockGenerateContent.mock.resetCalls();
  });

  afterEach(() => {
    exitMock.mock.restore();
    consoleLogMock.mock.restore();
    consoleErrorMock.mock.restore();
  });

  it('APIキーが設定されており、正常に応答がある場合、成功ログを出力すること', async () => {
    const mockEnv = { GEMINI_API_KEY: 'dummy-key' };

    // generateContent の成功レスポンスをモック
    mockGenerateContent.mock.mockImplementation(async () => ({
      response: {
        text: () => 'Hello from Gemini'
      }
    }));

    await verifyModel(mockGoogleGenerativeAI, mockEnv);

    // 検証
    assert.strictEqual(mockGetGenerativeModel.mock.callCount(), 1);
    assert.strictEqual(exitMock.mock.callCount(), 0, 'process.exit が呼ばれてはいけません');

    // ログに成功メッセージが含まれているか (簡易チェック)
    const logs = consoleLogMock.mock.calls.map(c => c.arguments.join(' ')).join(' ');
    assert.match(logs, /Success! Model 'gemini-3-flash-preview' is available/);
    assert.match(logs, /Response: Hello from Gemini/);
  });

  it('APIキーが未設定の場合、エラーログを出力して終了すること', async () => {
    const mockEnv = {}; // キーなし

    try {
      await verifyModel(mockGoogleGenerativeAI, mockEnv);
      assert.fail('process.exit が呼ばれるはずです');
    } catch (e) {
      assert.strictEqual(e.message, 'Process exited with code 1');
    }

    const errors = consoleErrorMock.mock.calls.map(c => c.arguments[0]).join(' ');
    assert.match(errors, /GEMINI_API_KEY is missing/);
  });

  it('APIエラーが発生した場合、エラーログを出力して終了すること', async () => {
    const mockEnv = { GEMINI_API_KEY: 'dummy-key' };

    // APIエラーをモック
    mockGenerateContent.mock.mockImplementation(async () => {
      throw new Error('API Connection Failed');
    });

    try {
      await verifyModel(mockGoogleGenerativeAI, mockEnv);
      assert.fail('process.exit が呼ばれるはずです');
    } catch (e) {
      assert.strictEqual(e.message, 'Process exited with code 1');
    }

    const errors = consoleErrorMock.mock.calls.map(c => c.arguments[0]).join(' ');
    assert.match(errors, /Failed to use model/);
  });
});
