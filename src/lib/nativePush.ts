/**
 * تنبيهات النظام (APNs) داخل تطبيق تبيان على iOS.
 *
 * الموقع يُحمَّل داخل WKWebView حيث لا Web Push؛ فنكلّم إضافة
 * @capacitor/push-notifications المسجّلة في التطبيق الأصلي عبر الجسر
 * (window.Capacitor.Plugins.PushNotifications). في المتصفح تعيد الدوال
 * "unsupported" ولا تفعل شيئاً، ولا يُضاف شيء إلى حزمة الموقع.
 */
import { auth } from './firebase';

export type NativePushPermission = 'granted' | 'denied' | 'default' | 'unsupported';

type Handle = { remove: () => Promise<void> };
type PushPlugin = {
  checkPermissions: () => Promise<{ receive: string }>;
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  addListener: (event: string, cb: (payload: any) => void) => Promise<Handle>;
};

const TOKEN_KEY = 'tebyan_native_push_token';

function getPlugin(): PushPlugin | null {
  try {
    const cap = (globalThis as any).window?.Capacitor || (globalThis as any).Capacitor;
    if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== 'ios') return null;
    return (cap.Plugins?.PushNotifications as PushPlugin) || null;
  } catch {
    return null;
  }
}

export const isNativePushAvailable = (): boolean => !!getPlugin();

const mapPermission = (value: string | undefined): NativePushPermission =>
  value === 'granted' ? 'granted' : value === 'denied' ? 'denied' : 'default';

export async function readNativePushPermission(): Promise<NativePushPermission> {
  const plugin = getPlugin();
  if (!plugin) return 'unsupported';
  try { return mapPermission((await plugin.checkPermissions()).receive); } catch { return 'unsupported'; }
}

/** يطلب إذن النظام (نافذة iOS الأصلية) إن لم يُحسم بعد. */
export async function requestNativePushPermission(): Promise<NativePushPermission> {
  const plugin = getPlugin();
  if (!plugin) return 'unsupported';
  try {
    const current = await readNativePushPermission();
    if (current !== 'default') return current;
    return mapPermission((await plugin.requestPermissions()).receive);
  } catch {
    return 'unsupported';
  }
}

/** يسجّل الجهاز لدى APNs ويعيد توكنه (hex) أو "" عند الفشل أو انتهاء المهلة. */
export async function registerNativePushToken(timeoutMs = 15000): Promise<string> {
  const plugin = getPlugin();
  if (!plugin) return '';
  const handles: Handle[] = [];
  try {
    return await new Promise<string>((resolve) => {
      const timer = setTimeout(() => resolve(''), timeoutMs);
      const done = (value: string) => { clearTimeout(timer); resolve(value); };
      (async () => {
        try {
          handles.push(await plugin.addListener('registration', (t: any) => done(String(t?.value || ''))));
          handles.push(await plugin.addListener('registrationError', () => done('')));
          await plugin.register();
        } catch {
          done('');
        }
      })();
    });
  } finally {
    await Promise.all(handles.map((h) => h.remove().catch(() => undefined)));
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

/** يرسل التوكن إلى الخادم (POST /api/push/subscribe-native) مربوطاً بحساب المستخدم. */
export async function sendNativeTokenToServer(token: string): Promise<boolean> {
  if (!token || !auth.currentUser) return false;
  try {
    const response = await fetch('/api/push/subscribe-native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      try { localStorage.setItem(TOKEN_KEY, token); } catch { /* تخزين غير متاح */ }
    }
    return response.ok;
  } catch {
    return false;
  }
}

/** نقرة واحدة: نافذة الإذن ثم التسجيل ثم إرسال التوكن. */
export async function enableNativePush(): Promise<NativePushPermission> {
  const permission = await requestNativePushPermission();
  if (permission !== 'granted') return permission;
  const token = await registerNativePushToken();
  if (token) await sendNativeTokenToServer(token);
  return permission;
}

/** يزيل توكن هذا الجهاز من حساب المستخدم (لا يمكن سحب إذن iOS من داخل التطبيق). */
export async function disableNativePush(): Promise<void> {
  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* */ }
  if (!token) return;
  try {
    await fetch('/api/push/unsubscribe-native', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ token }),
    });
  } catch { /* */ }
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
}

export function hasStoredNativeToken(): boolean {
  try { return !!localStorage.getItem(TOKEN_KEY); } catch { return false; }
}

/** مسار داخلي فقط: لا نتبع روابط خارجية من حمولة التنبيه. */
export function safePushPath(url: unknown): string | null {
  const value = String(url ?? '').trim();
  return /^\/(?!\/)\S{0,300}$/.test(value) ? value : null;
}

let started = false;
/**
 * يُستدعى مرة عند الإقلاع: يفتح صفحة التنبيه عند لمسه، ويجدّد التوكن بصمت
 * إن كان الإذن ممنوحاً من قبل (Apple قد تغيّر التوكن).
 */
export function initNativePush(navigate: (path: string) => void = (p) => window.location.assign(p)): void {
  const plugin = getPlugin();
  if (!plugin || started) return;
  started = true;
  plugin.addListener('pushNotificationActionPerformed', (action: any) => {
    const path = safePushPath(action?.notification?.data?.url);
    if (path) navigate(path);
  }).catch(() => undefined);
  void (async () => {
    if ((await readNativePushPermission()) !== 'granted' || !hasStoredNativeToken()) return;
    const refresh = async () => {
      const token = await registerNativePushToken();
      if (token) await sendNativeTokenToServer(token);
    };
    if (auth.currentUser) await refresh();
    else {
      const stop = auth.onAuthStateChanged((user) => { if (user) { stop(); void refresh(); } });
    }
  })();
}

/** يطلب من الخادم تنبيه صاحب الفكرة بردّ جديد (يتحقق الخادم من كل شيء). لا يفشل أبداً. */
export async function notifyRippleReply(replyId: string): Promise<void> {
  if (!replyId || !auth.currentUser) return;
  try {
    await fetch('/api/push/ripple-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ replyId }),
    });
  } catch { /* التنبيه إضافة لا تمنع الرد */ }
}
