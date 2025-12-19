/**
 * Logic Verification Test for Workflow Triggers
 * This script simulates GitHub Action event payloads to verify the "if" condition logic.
 */

function shouldRunWorkflow(event) {
  const { action, issue, label } = event;
  const hasBookReportLabel = issue.labels.some(l => l.name === 'book-report');

  // Logic from .github/workflows/ingest-book-report.yml
  const condition =
    (action === 'opened' && hasBookReportLabel) ||
    (action === 'labeled' && label && label.name === 'book-report');

  return condition;
}

// Mock Data
const issueWithLabel = { labels: [{ name: 'book-report' }] };
const issueWithoutLabel = { labels: [] };
const issueWithOtherLabel = { labels: [{ name: 'book-report' }, { name: 'other' }] };

const tests = [
  {
    name: 'Case 1: Issue opened WITH book-report label (Template case)',
    event: { action: 'opened', issue: issueWithLabel },
    expected: true
  },
  {
    name: 'Case 2: Issue opened WITHOUT label',
    event: { action: 'opened', issue: issueWithoutLabel },
    expected: false
  },
  {
    name: 'Case 3: "book-report" label added manually',
    event: { action: 'labeled', issue: issueWithLabel, label: { name: 'book-report' } },
    expected: true
  },
  {
    name: 'Case 4: "other" label added manually (EXISTING BUG CASE)',
    // User adds 'other' label, issue ALREADY has 'book-report'
    event: { action: 'labeled', issue: issueWithOtherLabel, label: { name: 'other' } },
    expected: false // Should be FALSE. Old logic returned TRUE here.
  }
];

// Run Tests
console.log('--- Workflow Trigger Logic Verification ---\n');
let failed = false;

tests.forEach(test => {
  const result = shouldRunWorkflow(test.event);
  const status = result === test.expected ? 'PASS' : 'FAIL';
  if (result !== test.expected) failed = true;

  console.log(`[${status}] ${test.name}`);
  console.log(`       Expected: ${test.expected}, Got: ${result}\n`);
});

if (failed) {
  console.error('❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('✅ All logic tests passed. The fix effectively suppresses duplicate runs.');
}
