// Test file to verify sanitization works correctly
import { sanitizeHtml } from '@/lib/sanitize';

// Test cases for XSS prevention
const testCases = [
  {
    input: '<img src=x onerror="alert(\'xss\')">',
    expected: '', // All HTML tags removed
    description: 'XSS via img onerror - should be completely removed',
  },
  {
    input: '<script>alert("xss")</script>',
    expected: '', // Script tags and content removed
    description: 'XSS via script tag - should be completely removed',
  },
  {
    input: '<iframe src="http://evil.com"></iframe>',
    expected: '', // Iframe removed
    description: 'XSS via iframe - should be completely removed',
  },
  {
    input: 'Hello <b>world</b>',
    expected: 'Hello world', // Text is preserved, tags removed
    description: 'Safe HTML tags - should preserve text only',
  },
  {
    input: '<div onclick="alert(\'xss\')">Click me</div>',
    expected: 'Click me', // Text preserved, tags and attributes removed
    description: 'XSS via event handler - text preserved, tags removed',
  },
  {
    input: '"><script>alert(String.fromCharCode(88,83,83))</script>',
    expected: '&quot;&gt;', // Dangerous characters escaped
    description: 'Encoded XSS attempt - should be escaped',
  },
];

console.log('=== SANITIZATION TEST RESULTS ===\n');

testCases.forEach((testCase) => {
  const result = sanitizeHtml(testCase.input);
  const passed = result === testCase.expected || result.trim() === testCase.expected.trim();

  console.log(`Test: ${testCase.description}`);
  console.log(`Input:    "${testCase.input}"`);
  console.log(`Expected: "${testCase.expected}"`);
  console.log(`Got:      "${result}"`);
  console.log(`Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});
