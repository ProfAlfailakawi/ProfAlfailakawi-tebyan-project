/**
 * إشعار عام (toast) يستخدم نفس مكوّن الإشعار في App.tsx بدل window.alert.
 * عرض فقط: يرسل حدثاً يلتقطه App فيعرضه.
 */
export type NotifyType = 'info' | 'error' | 'success';

export function notify(message: string, type: NotifyType = 'info') {
  try {
    window.dispatchEvent(new CustomEvent('tebyan_toast', { detail: { message, type } }));
  } catch {
    /* بيئة بلا window: لا شيء يُعرض */
  }
}
