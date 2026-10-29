/**
 * رسالة «تواصل» — الشكل الذي تكتبه النموذجان (ContactTab وMessagesFloatingButton)
 * إلى `contact_requests`. الحدود هنا تطابق قاعدة `contact_requests` في
 * firestore.rules؛ إن تغيّر أحدهما وجب تغيير الآخر (tests/contact-request.test.ts
 * يتحقق من ذلك).
 *
 * لا يستورد هذا الملف Firebase: الكتابة تُمرَّر إليه، فيُختبر مسار الخطأ بلا شبكة.
 */
export const CONTACT_LIMITS = { name: 200, email: 320, message: 5000 } as const;

export interface ContactInput {
  name: string;
  email: string;
  message: string;
  language?: string;
  source?: string;
}

export function buildContactRequest(input: ContactInput, createdAt: unknown): Record<string, unknown> {
  const data: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    message: input.message,
    createdAt,
    status: 'new',
  };
  if (input.language !== undefined) data.language = input.language;
  if (input.source !== undefined) data.source = input.source;
  return data;
}

export type ContactSendResult = { ok: boolean; error?: unknown };

/* النجاح لا يُعلن إلا بعد أن تقبل Firestore الكتابة؛ أي رفض (صلاحيات، شبكة،
   وضع العرض) يعود خطأً ليعرضه النموذج بدل رسالة «تم الإرسال». */
export async function sendContactRequest(
  write: (data: Record<string, unknown>) => Promise<unknown>,
  data: Record<string, unknown>,
): Promise<ContactSendResult> {
  try {
    await write(data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
