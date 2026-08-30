export type EventType = 'search' | 'path_select' | 'feature_use';

/**
 * Funnel events for measuring whether the "one intelligence" simplification
 * actually worked. These let us later compute Time-to-First-Question,
 * Time-to-First-Answer, first-session completion, % opening the services
 * directory, % using "continue", and returning-user rate — i.e. whether a new
 * user succeeds WITHOUT any human explanation.
 *
 * They are persisted through the same bounded, anonymous-safe `analytics`
 * collection write, tagged with `type: 'funnel'` and the specific event name in
 * metadata, so no Firestore rule change is required.
 */
export type FunnelEvent =
  | 'home_view'
  | 'first_input_started'
  | 'first_question_submitted'
  | 'first_answer_shown'
  | 'continue_clicked'
  | 'secondary_option_opened'
  | 'clarification_shown'
  | 'clarification_answered'
  | 'simulation_suggested'
  | 'simulation_started'
  | 'plan_suggested'
  | 'plan_started'
  | 'next_best_action_taken'
  | 'save_result'
  | 'services_directory_opened'
  | 'help_opened'
  | 'returning_user_resume'
  // Inline-capability funnel (measuring the zero-navigation experience)
  | 'capability_suggested'
  | 'capability_started'
  | 'capability_completed'
  | 'capability_abandoned'
  | 'capability_failed'
  | 'inline_simulation_started'
  | 'inline_decision_completed'
  | 'inline_plan_generated'
  | 'inline_research_opened'
  // The number we want to drive DOWN over time: how often we had to leave the
  // unified session and send the user to a standalone tool.
  | 'external_tab_handoff';

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

/**
 * Log a simplification-funnel event. Fire-and-forget, never throws, and safe
 * for anonymous users. Query text is only attached for the submit event and is
 * length-bounded to respect the Firestore log rules.
 */
export const logFunnel = (
  event: FunnelEvent,
  language: string,
  metadata?: AnalyticsMetadata,
) => {
  const meta: AnalyticsMetadata = { event, ...(metadata || {}) };
  scheduleAnalytics(() => {
    void persistEvent('feature_use', language, undefined, meta);
  });
};
