import { auth } from './firebase';

/** App Store 1.2: التواصل مع المشرفين بشأن المحتوى المخالف. */
export const MODERATION_EMAIL = 'info@skygateeducation.com';

export const REPORT_REASONS = ['spam', 'abuse', 'inappropriate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

/** POST /api/ripple-reports: يقبل الزائر؛ يُربط البلاغ بالـuid إن كان مسجلاً. */
export async function reportRipple(rippleId: string, reason: ReportReason, note: string): Promise<void> {
  const response = await fetch('/api/ripple-reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ rippleId, reason, note: note.trim() }),
  });
  if (!response.ok) throw new Error(`report-failed-${response.status}`);
}

export type RippleReportRow = {
  id: string;
  rippleId: string;
  reason: ReportReason;
  note: string;
  reporterUid: string | null;
  rippleAuthorId: string | null;
  rippleExcerpt: string;
  status: string;
  createdAt: string | null;
};

/** GET /api/admin/ripple-reports: للمشرفين فقط (يتحقق الخادم من الهوية). */
export async function fetchRippleReports(): Promise<RippleReportRow[]> {
  const response = await fetch('/api/admin/ripple-reports', { headers: await authHeader() });
  if (!response.ok) throw new Error(`reports-failed-${response.status}`);
  return (await response.json()).reports as RippleReportRow[];
}
