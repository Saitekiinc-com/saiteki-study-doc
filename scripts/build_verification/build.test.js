
const { execSync } = require('child_process');
const { test } = require('node:test');

test('Docs Build Verification', () => {
  try {
    // Run the build command
    // stdio: 'inherit' allows seeing the build output in the test log
    execSync('npm run docs:build', { stdio: 'inherit' });
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
});
