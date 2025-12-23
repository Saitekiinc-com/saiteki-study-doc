/**
 * CI/CDP専用ビルド検証テスト
 * 
 * 注意: このテストは実際に `npm run docs:build` を実行するため、
 * ローカル開発時には明示的にスキップすることを推奨します。
 * 
 * ローカルでスキップする方法:
 *   npm test -- --test-name-pattern="^(?!Docs Build Verification)"
 * 
 * またはこのファイルを除外:
 *   npm test -- 'scripts/**\/*.test.ts' 'tests/**\/*.test.ts'
 * 
 * CI環境では通常どおり実行されます。
 */

const { execSync } = require('child_process');
const { test } = require('node:test');

test('Docs Build Verification', { skip: process.env.SKIP_BUILD_TEST === 'true' }, () => {
  try {
    // Run the build command
    // stdio: 'inherit' allows seeing the build output in the test log
    execSync('npm run docs:build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
});
