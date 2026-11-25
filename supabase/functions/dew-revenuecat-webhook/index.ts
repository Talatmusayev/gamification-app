declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

type RevenueCatEventType =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'TRIAL_CONVERTED'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'NON_RENEWING_PURCHASE'
  | string;

interface RevenueCatWebhookEvent {
  id?: string;
  type?: RevenueCatEventType;
  app_user_id?: string | null;
  original_app_user_id?: string | null;
  aliases?: string[] | null;
  product_id?: string | null;
  entitlement_ids?: string[] | null;
  period_type?: string | null;
  purchased_at_ms?: number | null;
  expiration_at_ms?: number | null;
  cancel_reason?: string | null;
  store?: string | null;
  environment?: string | null;
}

interface RevenueCatWebhookPayload {
  api_version?: string;
  event?: RevenueCatWebhookEvent;
}

interface TrialReminderSchedule {
  userId: string;
  productId: string;
  trialEndsAt: string;
  remindAt: string;
  dispatched: boolean;
}

const HANDLED_EVENTS = new Set<string>([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'TRIAL_CONVERTED',
  'CANCELLATION',
  'EXPIRATION',
  'NON_RENEWING_PURCHASE',
]);

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.get('authorization')?.trim();
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? null;
}

function resolveSupabaseUserId(event: RevenueCatWebhookEvent): string | null {
  const candidates: Array<string | null | undefined> = [
    event.app_user_id,
    event.original_app_user_id,
    ...(Array.isArray(event.aliases) ? event.aliases : []),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && UUID_REGEX.test(candidate.trim())) {
      return candidate.trim();
    }
  }

  return null;
}

function inferPlanType(productId?: string | null): string {
  const normalized = (productId ?? '').toLowerCase();
  if (normalized.includes('lifetime') || normalized.includes('forever')) {
    return 'lifetime_pro';
  }
  if (normalized.includes('annual') || normalized.includes('year')) {
    return 'annual_pro';
  }
  if (normalized.includes('month')) {
    return 'monthly_pro';
  }
  return 'pro';
}

function resolveSubscriptionState(
  event: RevenueCatWebhookEvent,
  nowMs: number,
): {
  isPro: boolean;
  planType: string;
  status: string;
  expiresAtIso: string | null;
} {
  const eventType = (event.type ?? '').toUpperCase();
  const planType = inferPlanType(event.product_id);
  const expiresAtMs =
    typeof event.expiration_at_ms === 'number' &&
    Number.isFinite(event.expiration_at_ms)
      ? event.expiration_at_ms
      : null;
  const expiresAtIso =
    expiresAtMs !== null ? new Date(expiresAtMs).toISOString() : null;
  const isTrial = (event.period_type ?? '').toUpperCase() === 'TRIAL';

  switch (eventType) {
    case 'INITIAL_PURCHASE':
      return {
        isPro: true,
        planType,
        status: isTrial ? 'trialing' : 'active',
        expiresAtIso,
      };

    case 'RENEWAL':
    case 'TRIAL_CONVERTED':
      return {
        isPro: true,
        planType,
        status: 'active',
        expiresAtIso,
      };

    case 'NON_RENEWING_PURCHASE':
      return {
        isPro: true,
        planType: planType === 'pro' ? 'lifetime_pro' : planType,
        status: 'lifetime',
        expiresAtIso: null,
      };

    case 'CANCELLATION': {
      // RevenueCat CANCELLATION signals auto-renew disabled; entitlement stays active until expiration_at_ms.
      const stillActive = expiresAtMs === null || expiresAtMs > nowMs;
      return {
        isPro: stillActive,
        planType,
        status: stillActive ? 'cancelled_grace' : 'expired',
        expiresAtIso,
      };
    }

    case 'EXPIRATION':
    default:
      return {
        isPro: false,
        planType: planType === 'pro' ? 'free' : planType,
        status: 'expired',
        expiresAtIso,
      };
  }
}

async function scheduleTrialReminderHook(params: {
  userId: string;
  event: RevenueCatWebhookEvent;
  nowMs: number;
}): Promise<TrialReminderSchedule | null> {
  const { userId, event, nowMs } = params;
  const isInitialTrial =
    (event.type ?? '').toUpperCase() === 'INITIAL_PURCHASE' &&
    (event.period_type ?? '').toUpperCase() === 'TRIAL';

  if (!isInitialTrial || typeof event.expiration_at_ms !== 'number') {
    return null;
  }

  const trialEndsAt = new Date(event.expiration_at_ms).toISOString();
  const remindAtMs = Math.max(
    nowMs,
    event.expiration_at_ms - FORTY_EIGHT_HOURS_MS,
  );
  const remindAt = new Date(remindAtMs).toISOString();

  const reminderWebhookUrl = Deno.env.get('TRIAL_REMINDER_WEBHOOK_URL')?.trim();
  let dispatched = false;

  if (reminderWebhookUrl) {
    try {
      const hookSecret = Deno.env.get('TRIAL_REMINDER_WEBHOOK_SECRET')?.trim();
      const res = await fetch(reminderWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(hookSecret ? { Authorization: `Bearer ${hookSecret}` } : {}),
        },
        body: JSON.stringify({
          user_id: userId,
          template: 'dew_trial_day5_reminder',
          trial_ends_at: trialEndsAt,
          remind_at: remindAt,
        }),
      });
      dispatched = res.ok;
    } catch {
      dispatched = false;
    }
  }

  return {
    userId,
    productId: event.product_id ?? 'annual_pro',
    trialEndsAt,
    remindAt,
    dispatched,
  };
}

async function upsertSubscriptionAndProfile(params: {
  supabaseUrl: string;
  serviceRoleKey: string;
  userId: string;
  rcCustomerId: string | null;
  planType: string;
  status: string;
  expiresAtIso: string | null;
  isPro: boolean;
  nowIso: string;
}): Promise<{ ok: boolean; error?: string }> {
  const baseHeaders = {
    apikey: params.serviceRoleKey,
    Authorization: `Bearer ${params.serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  const subRes = await fetch(
    `${params.supabaseUrl}/rest/v1/dew_subscriptions?on_conflict=user_id`,
    {
      method: 'POST',
      headers: {
        ...baseHeaders,
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        user_id: params.userId,
        rc_customer_id: params.rcCustomerId,
        plan_type: params.planType,
        status: params.status,
        expires_at: params.expiresAtIso,
        updated_at: params.nowIso,
      }),
    },
  );

  if (!subRes.ok) {
    const detail = await subRes.text().catch(() => '');
    return {
      ok: false,
      error: `Failed to upsert dew_subscriptions (${subRes.status}): ${detail}`,
    };
  }

  const profileRes = await fetch(
    `${params.supabaseUrl}/rest/v1/dew_profiles?user_id=eq.${encodeURIComponent(params.userId)}`,
    {
      method: 'PATCH',
      headers: baseHeaders,
      body: JSON.stringify({
        is_pro: params.isPro,
        updated_at: params.nowIso,
      }),
    },
  );

  if (!profileRes.ok) {
    const detail = await profileRes.text().catch(() => '');
    return {
      ok: false,
      error: `Failed to update dew_profiles (${profileRes.status}): ${detail}`,
    };
  }

  return { ok: true };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const expectedToken = Deno.env.get('REVENUECAT_WEBHOOK_AUTH_TOKEN')?.trim();
  if (!expectedToken) {
    return jsonResponse(
      { error: 'REVENUECAT_WEBHOOK_AUTH_TOKEN is not configured' },
      500,
    );
  }

  const providedToken = extractBearerToken(req);
  if (!providedToken || !constantTimeEquals(providedToken, expectedToken)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim().replace(/\/+$/, '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: 'Supabase service credentials are not configured' },
      500,
    );
  }

  let payload: RevenueCatWebhookPayload;
  try {
    payload = (await req.json()) as RevenueCatWebhookPayload;
  } catch {
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const event = payload.event;
  if (!event || typeof event.type !== 'string') {
    return jsonResponse({ error: 'Missing RevenueCat event object' }, 400);
  }

  const eventType = event.type.toUpperCase();
  if (!HANDLED_EVENTS.has(eventType)) {
    return jsonResponse({ ok: true, ignored: eventType });
  }

  const userId = resolveSupabaseUserId(event);
  if (!userId) {
    return jsonResponse({ ok: true, ignored: 'non_uuid_app_user_id' });
  }

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const resolved = resolveSubscriptionState(event, nowMs);

  const dbResult = await upsertSubscriptionAndProfile({
    supabaseUrl,
    serviceRoleKey,
    userId,
    rcCustomerId: event.original_app_user_id ?? event.app_user_id ?? null,
    planType: resolved.planType,
    status: resolved.status,
    expiresAtIso: resolved.expiresAtIso,
    isPro: resolved.isPro,
    nowIso,
  });

  if (!dbResult.ok) {
    return jsonResponse({ error: dbResult.error }, 502);
  }

  const trialReminder = await scheduleTrialReminderHook({
    userId,
    event,
    nowMs,
  });

  return jsonResponse({
    ok: true,
    event_id: event.id ?? null,
    event_type: eventType,
    user_id: userId,
    is_pro: resolved.isPro,
    plan_type: resolved.planType,
    status: resolved.status,
    expires_at: resolved.expiresAtIso,
    trial_reminder: trialReminder,
  });
});
