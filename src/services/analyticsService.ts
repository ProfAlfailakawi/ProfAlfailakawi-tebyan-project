import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type EventType = 'search' | 'path_select' | 'feature_use';

export interface AnalyticsMetadata {
    [key: string]: any;
}

const scheduleAnalytics = (task: () => void) => {
    const win = window as typeof window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
    };
    if (typeof win.requestIdleCallback === 'function') {
        win.requestIdleCallback(task, { timeout: 1800 });
    } else {
        window.setTimeout(task, 120);
    }
};

const persistEvent = async (type: EventType, language: string, query?: string, metadata?: AnalyticsMetadata) => {
    try {
        const safeMetadata = { ...metadata };
        Object.keys(safeMetadata).forEach(key => {
            if (safeMetadata[key] === undefined) delete safeMetadata[key];
        });
        await addDoc(collection(db, 'analytics'), {
            type,
            query: query || null,
            metadata: safeMetadata,
            language,
            timestamp: serverTimestamp(),
            platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });
    } catch (error: any) {
        if (error?.message?.includes('permission')) {
            console.warn('[Analytics] Missing Firestore permissions. Event was not logged:', type);
        } else {
            console.error('Failed to log analytics event:', error);
        }
    }
};

// Analytics must never sit in the user's click path. Queue it after the UI paints.
export const logEvent = (type: EventType, language: string, query?: string, metadata?: AnalyticsMetadata) => {
    scheduleAnalytics(() => { void persistEvent(type, language, query, metadata); });
};
