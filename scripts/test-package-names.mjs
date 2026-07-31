/**
 * Unit tests for package display names (no DB required).
 * Run: node scripts/test-package-names.mjs
 */

import { getPackageDisplayName } from '../server/_utils/package-names.js';

const cases = [
  ['single', 'Perfect Baby Name Report'],
  ['premium', 'Complete Baby Name Blueprint'],
  ['namecheck-2', 'Name Check (2 Persons)'],
  ['namecheck', 'Name Check Report'],
];

let passed = 0;
for (const [input, expected] of cases) {
  const actual = getPackageDisplayName(input);
  if (actual !== expected) {
    console.error(`❌ getPackageDisplayName("${input}") => "${actual}", expected "${expected}"`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${input} → ${actual}`);
    passed++;
  }
}

console.log(`\n${passed}/${cases.length} package name tests passed`);
