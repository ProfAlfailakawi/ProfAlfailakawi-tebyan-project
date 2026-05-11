import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { qawlFaslService } from './qawlFaslService';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';

export const cronService = {
  async runDailyTasks() {
    try {
      const today = new Date().toDateString(); // E.g., "Wed Apr 29 2026"
      const cronRef = doc(db, 'system_settings', 'cron_state');
      
      // Use a transaction to ensure only one client performs the heavy generation per day
      const shouldRun = await runTransaction(db, async (transaction) => {
        let cronDoc;
        try {
          console.log('[Cron] Transaction: Getting cron_state...');
          cronDoc = await transaction.get(cronRef);
        } catch (error: any) {
           console.error('[Cron] Transaction: Get failed:', error);
           handleFirestoreError(error, OperationType.GET, 'system_settings/cron_state');
        }
        
        if (!cronDoc.exists()) {
          console.log('[Cron] Transaction: Document doesn\'t exist, setting new state...');
          try {
            transaction.set(cronRef, { lastDailyQawlFasl: today });
          } catch (err) {
            console.error('[Cron] Transaction: set call failed:', err);
            throw err;
          }
          return true;
        } else {
          const data = cronDoc.data();
          console.log('[Cron] Transaction: Current state is:', data.lastDailyQawlFasl);
          if (data.lastDailyQawlFasl !== today) {
            console.log('[Cron] Transaction: Updating state to:', today);
            try {
              transaction.update(cronRef, { lastDailyQawlFasl: today });
            } catch (err) {
              console.error('[Cron] Transaction: update call failed:', err);
              throw err;
            }
            return true;
          }
        }
        console.log('[Cron] Transaction: No action needed.');
        return false;
      });

      if (shouldRun) {
        console.log('[Cron] Triggering daily tasks for:', today);
        // Fire and forget, running in background
        const tasks = [
          { name: 'generateDailyQawlFaslQuestions', fn: () => qawlFaslService.generateDailyQawlFaslQuestions() },
          { name: 'analyzeSearchLogs', fn: () => qawlFaslService.analyzeSearchLogs() },
          { name: 'autoGenerateMissingDrafts', fn: () => qawlFaslService.autoGenerateMissingDrafts() }
        ];

        Promise.all(tasks.map(t => 
          t.fn().catch(err => {
            console.error(`[Cron] Task "${t.name}" failed:`, err);
            throw err; // Re-throw to be caught by the main Promise.all
          })
        )).then(() => {
            console.log('[Cron] Daily background generation and analytics completed.');
        }).catch(err => {
            console.error('[Cron] Daily background tasks total failure:', err);
            // Revert the date so someone else can attempt later
            setDoc(cronRef, { lastDailyQawlFasl: 'failed' }, { merge: true })
              .catch(e => console.error('[Cron] Failed to revert state:', e));
        });
      } else {
        console.log('[Cron] Daily tasks have already been triggered today.');
      }
    } catch (error: any) {
      console.error('[Cron] Failed to check/run daily tasks:', error?.message || error);
    }
  }
};
