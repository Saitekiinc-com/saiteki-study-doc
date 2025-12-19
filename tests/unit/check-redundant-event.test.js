
const { test } = require('node:test');
const assert = require('node:assert');
const { checkRedundantEvent } = require('../../scripts/check-redundant-event.js');

// 正常系: 'labeled' 以外のイベント（例: opened）はスキップしない
test('checkRedundantEvent does not skip for non-labeled events (正常系: labeled以外)', (t) => {
  const mockContext = {
    payload: {
      action: 'opened',
      issue: { created_at: new Date().toISOString() }
    }
  };
  let outputKey, outputValue;
  const mockCore = {
    setOutput: (key, value) => { outputKey = key; outputValue = value; }
  };

  checkRedundantEvent({ context: mockContext, core: mockCore });
  assert.strictEqual(outputKey, 'skip');
  assert.strictEqual(outputValue, 'false');
});

// 正常系（スキップ対象）: 'labeled' イベントだが、作成直後（60秒以内）なので重複としてスキップする
test('checkRedundantEvent skips for labeled event if created recently (< 60s) (正常系: 直後のlabeledはスキップ)', (t) => {
  const now = Date.now();
  const recentTime = new Date(now - 30000).toISOString(); // 30秒前

  const mockContext = {
    payload: {
      action: 'labeled',
      issue: { created_at: recentTime }
    }
  };
  let outputKey, outputValue;
  const mockCore = {
    setOutput: (key, value) => { outputKey = key; outputValue = value; }
  };

  checkRedundantEvent({ context: mockContext, core: mockCore });
  assert.strictEqual(outputKey, 'skip');
  assert.strictEqual(outputValue, 'true');
});

// 正常系: 'labeled' イベントで、作成から時間が経過している（60秒以上）場合はスキップしない
test('checkRedundantEvent does not skip for labeled event if created long ago (> 60s) (正常系: 時間経過後のlabeledは実行)', (t) => {
  const now = Date.now();
  const oldTime = new Date(now - 70000).toISOString(); // 70秒前

  const mockContext = {
    payload: {
      action: 'labeled',
      issue: { created_at: oldTime }
    }
  };
  let outputKey, outputValue;
  const mockCore = {
    setOutput: (key, value) => { outputKey = key; outputValue = value; }
  };

  checkRedundantEvent({ context: mockContext, core: mockCore });
  assert.strictEqual(outputKey, 'skip');
  assert.strictEqual(outputValue, 'false');
});

// 異常系: created_at が存在しない場合は安全にスキップせず続行する
test('checkRedundantEvent handles missing created_at gracefully (異常系: created_at欠損)', (t) => {
  const mockContext = {
    payload: {
      action: 'labeled',
      issue: { } // created_at なし
    }
  };
  let outputKey, outputValue;
  const mockCore = {
    setOutput: (key, value) => { outputKey = key; outputValue = value; }
  };

  checkRedundantEvent({ context: mockContext, core: mockCore });
  assert.strictEqual(outputKey, 'skip');
  assert.strictEqual(outputValue, 'false');
});
