const assert = require('assert');

// 1. Verify aiCore functions are exported correctly.
async function runTests() {
  try {
    const aiCore = require('./functions/aiCore.cjs');
    assert(typeof aiCore.generateGrounded === 'function', 'aiCore.generateGrounded should be a function');
    console.log('✅ aiCore.cjs loaded successfully and exports generateGrounded.');

    const pkg = require('./package.json');
    assert(pkg.name === 'react-example', 'package name should match');

    console.log('✅ All tests passed.');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    process.exit(1);
  }
}

runTests();
