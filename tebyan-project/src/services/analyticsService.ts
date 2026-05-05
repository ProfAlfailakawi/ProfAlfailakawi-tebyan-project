import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type EventType = 'search' | 'path_select' | 'feature_use';

export interface AnalyticsMetadata {
    [key: string]: any;
}

export const logEvent = async (type: EventType, language: string, query?: string, metadata?: AnalyticsMetadata) => {
    try {
        const safeMetadata = { ...metadata };
        if (safeMetadata) {
            Object.keys(safeMetadata).forEach(key => {
                if (safeMetadata[key] === undefined) {
                    delete safeMetadata[key];
                }
            });
        }
        await addDoc(collection(db, 'analytics'), {
            type,
            query: query || null,
            metadata: safeMetadata || {},
            language,
            timestamp: serverTimestamp(),
            // User agent can be helpful for mobile vs desktop analysis
            platform: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        });
    } catch (error) {
        console.error('Failed to log analytics event:', error);
    }
};
