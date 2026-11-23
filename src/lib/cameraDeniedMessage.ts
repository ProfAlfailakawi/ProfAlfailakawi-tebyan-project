/** Camera-denied hint. In the iOS app there is no browser: point to the system Settings path. */
export function cameraDeniedMessage(ar: boolean, native: boolean): string {
  if (native) {
    return ar
      ? 'يرجى السماح بالوصول إلى الكاميرا من «الإعدادات ‹ Tebyan ‹ الكاميرا» لتجربة الواقع المعزز.'
      : 'Please allow camera access in Settings › Tebyan › Camera to experience AR.';
  }
  return ar
    ? 'يرجى السماح بالوصول للكاميرا في إعدادات المتصفح لتجربة الواقع المعزز.'
    : 'Please allow camera access in browser settings to experience AR.';
}
