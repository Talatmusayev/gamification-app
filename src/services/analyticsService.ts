export type AnalyticsEventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'health_permission_result'
  | 'paywall_viewed'
  | 'trial_started'
  | 'subscription_purchased'
  | 'morning_reveal_completed'
  | 'garden_item_placed'
  | 'widget_installed'
  | 'progress_card_shared';

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;
export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export interface QueuedAnalyticsEvent {
  event: AnalyticsEventName;
  properties: Record<string, string | number | boolean | null>;
  timestamp: string;
}

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const MAX_BATCH_SIZE = 20;

const BLOCKED_PII_KEYS = new Set([
  'sleepmin',
  'sleep_min',
  'steps',
  'email',
  'user_email',
  'phone',
  'fullname',
  'full_name',
]);

let eventQueue: QueuedAnalyticsEvent[] = [];
let distinctId = 'anonymous-sanctuary-device';

function getPostHogKey(): string | undefined {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

function getPostHogHost(): string {
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim();
  if (!host) {
    return DEFAULT_POSTHOG_HOST;
  }
  return host.endsWith('/') ? host.slice(0, -1) : host;
}

/**
 * Strips health PII fields (`sleepMin`, `steps`, `email`, etc.) before any
 * analytics or external SDK payload is queued or transmitted.
 */
export function sanitizeAnalyticsProperties(
  properties?: AnalyticsProperties,
): Record<string, string | number | boolean | null> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (BLOCKED_PII_KEYS.has(key.toLowerCase())) {
      continue;
    }
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function setAnalyticsDistinctId(id: string | null): void {
  distinctId = id && id.trim().length > 0 ? id.trim() : 'anonymous-sanctuary-device';
}

export function getQueuedEvents(): readonly QueuedAnalyticsEvent[] {
  return eventQueue;
}

export function clearAnalyticsQueue(): void {
  eventQueue = [];
}

/**
 * Queues a PRD §5.1 PostHog event after stripping any blocked health/PII fields.
 * Automatically flushes over PostHog HTTP capture when `EXPO_PUBLIC_POSTHOG_KEY` is set.
 */
export function trackEvent(
  event: AnalyticsEventName,
  properties?: AnalyticsProperties,
): QueuedAnalyticsEvent {
  const entry: QueuedAnalyticsEvent = {
    event,
    properties: sanitizeAnalyticsProperties(properties),
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(entry);

  if (getPostHogKey() && eventQueue.length >= MAX_BATCH_SIZE) {
    void flushAnalyticsQueue();
  }

  return entry;
}

/**
 * Sends queued events to PostHog HTTP batch capture when `EXPO_PUBLIC_POSTHOG_KEY` is configured.
 * Acts as a safe no-op queue when unconfigured (Expo Go / local tests).
 */
export async function flushAnalyticsQueue(): Promise<{
  flushed: number;
  sent: boolean;
}> {
  const apiKey = getPostHogKey();
  if (!apiKey || eventQueue.length === 0) {
    return { flushed: 0, sent: false };
  }

  const batch = eventQueue.slice(0, MAX_BATCH_SIZE);
  const payload = {
    api_key: apiKey,
    batch: batch.map((item) => ({
      event: item.event,
      distinct_id: distinctId,
      timestamp: item.timestamp,
      properties: item.properties,
    })),
  };

  try {
    const response = await fetch(`${getPostHogHost()}/batch/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return { flushed: 0, sent: false };
    }

    eventQueue = eventQueue.slice(batch.length);
    return { flushed: batch.length, sent: true };
  } catch {
    return { flushed: 0, sent: false };
  }
}
