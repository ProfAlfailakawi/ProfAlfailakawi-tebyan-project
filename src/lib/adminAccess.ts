/**
 * Single source of truth for the owner/admin identities on the client.
 * Keep in sync with isAdmin() and /admins/{uid} in firestore.rules.
 * (The client check is only UX; Firestore rules are the real gate.)
 */
export const OWNER_UID = 'VfYbpLBoYFQGoVyBVOlMfVCESdm1';

export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'ah_f@hotmail.com',
  'alfailakawidrahmad@gmail.com',
  'alfailakawidrahmad@outlook.com',
  'dr.ahmad@gmail.com',
  'dr.ahmad.alfailakawi@gmail.com',
]);

export function isAdminIdentity(user: { uid?: string | null; email?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return user.uid === OWNER_UID || ADMIN_EMAILS.has((user.email || '').toLowerCase());
}
