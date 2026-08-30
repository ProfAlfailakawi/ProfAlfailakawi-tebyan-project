export type EventType = 'search' | 'path_select' | 'feature_use';

export interface AnalyticsMetadata {
  [key: string]: any;
}

const scheduleAnalytics = (task: () => void) => {
  const win = window as typeof window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  };
  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(task, { timeout: 2200 });
  } else {
    window.setTimeout(task, 180);
  }
};

const persistEvent = async (
  type: EventType,
  language: string,
  query?: string,
  metadata?: AnalyticsMetadata,
) => {
  try {
    // Analytics must not make Firebase part of the first-load bundle.
    const [{ db }, firestore] = await Promise.all([
      import('../lib/firebase'),
      import('firebase/firestore'),
    ]);
    const safeMetadata = { ...metadata };
    Object.keys(safeMetadata).forEach((key) => {
      if (safeMetadata[key] === undefined) delete safeMetadata[key];
    });
    await firestore.addDoc(firestore.collection(db, 'analytics'), {
      type,
      query: query || null,
      metadata: safeMetadata,
      language,
      timestamp: firestore.serverTimestamp(),
      platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    });
  } catch (error: any) {
    if (error?.message?.includes('permission')) {
      console.warn('[Analytics] Event was not logged:', type);
    } else {
      console.warn('[Analytics] Deferred event failed:', type, error);
    }
  }
};

export const logEvent = (
  type: EventType,
  language: string,
  query?: string,
  metadata?: AnalyticsMetadata,
) => {
  scheduleAnalytics(() => {
    void persistEvent(type, language, query, metadata);
  });
};
