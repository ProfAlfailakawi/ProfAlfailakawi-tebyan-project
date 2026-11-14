import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import { auth } from './firebase';
import { clearLocalUserDataOnSignOut } from './localUserData';

/**
 * Self-service account deletion (App Store guideline 5.1.1(v)).
 * Re-authenticates, asks the server to erase this user's data and Auth record
 * (DELETE /api/account, which verifies the ID token), then signs out locally.
 */
export async function deleteMyAccount(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('not-signed-in');

  if (user.providerData.some((p) => p.providerId === 'password') && user.email) {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } else {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  const idToken = await user.getIdToken(true);
  const response = await fetch('/api/account', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) throw new Error(`delete-failed-${response.status}`);

  clearLocalUserDataOnSignOut();
  try { await auth.signOut(); } catch { /* the Auth user is already gone */ }
}
