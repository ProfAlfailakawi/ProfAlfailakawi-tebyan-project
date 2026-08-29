const { assertFails, assertSucceeds, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const fs = require('fs');

async function main() {
  const testEnv = await initializeTestEnvironment({
    projectId: 'demo-tebyan-test',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8')
    }
  });

  const unauthedDb = testEnv.unauthenticatedContext().firestore();
  const authedDb = testEnv.authenticatedContext('user123', { email: 'user@example.com' }).firestore();
  const adminDb = testEnv.authenticatedContext('VfYbpLBoYFQGoVyBVOlMfVCESdm1', { email: 'admin@example.com' }).firestore();

  // Test system_settings/cron_state
  console.log('Testing cron_state writes...');
  await assertFails(unauthedDb.collection('system_settings').doc('cron_state').set({ triggered: true }));
  await assertFails(authedDb.collection('system_settings').doc('cron_state').set({ triggered: true }));
  await assertSucceeds(adminDb.collection('system_settings').doc('cron_state').set({ triggered: true }));

  console.log('Testing AI logs sizing...');
  // Valid log
  await assertSucceeds(adminDb.collection('ai_logs').doc('log1').set({ timestamp: 'now', query: 'q', promptSnippet: 'snip' }));

  // Test invalid overly large details
  await assertFails(adminDb.collection('ai_logs').doc('log2').set({
    timestamp: 'now',
    details: 'a'.repeat(2001)
  }));

  console.log('✅ Firestore Rules Tests Passed');
  await testEnv.cleanup();
}

main().catch(e => {
  console.error('❌ Tests failed:', e);
  process.exit(1);
});
