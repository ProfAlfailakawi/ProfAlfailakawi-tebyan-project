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
          cronDoc = await transaction.get(cronRef);
        } catch (error) {
           handleFirestoreError(error, OperationType.GET, 'system_settings/cron_state');
        }
        
        if (!cronDoc.exists()) {
          transaction.set(cronRef, { lastDailyQawlFasl: today });
          return true;
        } else {
          const data = cronDoc.data();
          if (data.lastDailyQawlFasl !== today) {
            transaction.update(cronRef, { lastDailyQawlFasl: today });
            return true;
          }
        }
        return false;
      });

      if (shouldRun) {
        console.log('[Cron] Triggering daily tasks for:', today);
        // Fire and forget, running in background
        Promise.all([
          qawlFaslService.generateDailyQawlFaslQuestions(),
          qawlFaslService.analyzeSearchLogs(),
          qawlFaslService.autoGenerateMissingDrafts()
        ]).then(() => {
            console.log('[Cron] Daily background generation and analytics completed.');
        }).catch(err => {
            console.error('[Cron] Daily background tasks failed:', err);
            // Revert the date so someone else can attempt later
            setDoc(cronRef, { lastDailyQawlFasl: 'failed' }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, 'system_settings/cron_state'));
        });
      } else {
        console.log('[Cron] Daily tasks have already been triggered today.');
      }
    } catch (error) {
      console.error('[Cron] Failed to check/run daily tasks:', error);
    }
  }
};
