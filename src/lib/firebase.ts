import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Firebase App Check — the real defense against API abuse / cost attacks.
// Inert until you set VITE_RECAPTCHA_SITE_KEY (register a reCAPTCHA v3 site key
// in Firebase console → App Check), then it protects every backend call.
const recaptchaSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    console.warn('App Check init skipped:', err);
  }
}

// If using the "default" database ID, typical getFirestore is sufficient
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' && firebaseConfig.firestoreDatabaseId !== 'default' 
  ? initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);


