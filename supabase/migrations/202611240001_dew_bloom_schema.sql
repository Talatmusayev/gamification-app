-- Dew & Bloom isolated schema (prefixed with dew_ to coexist cleanly in cijferkompas)

CREATE TABLE IF NOT EXISTS public.dew_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'UTC',
  sleep_goal_min integer NOT NULL DEFAULT 450 CHECK (sleep_goal_min BETWEEN 300 AND 720),
  step_goal integer NOT NULL DEFAULT 6000 CHECK (step_goal BETWEEN 1000 AND 30000),
  bedtime_target_min integer,
  tracking_mode text NOT NULL DEFAULT 'phone_only' CHECK (tracking_mode IN ('phone_only', 'health_sync')),
  dew_balance integer NOT NULL DEFAULT 0 CHECK (dew_balance >= 0),
  sunlight_balance integer NOT NULL DEFAULT 0 CHECK (sunlight_balance >= 0),
  fog_level smallint NOT NULL DEFAULT 0 CHECK (fog_level BETWEEN 0 AND 3),
  is_pro boolean NOT NULL DEFAULT false,
  onboarding_completed boolean NOT NULL DEFAULT false,
  last_ai_insight_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dew_daily_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  sleep_min integer NOT NULL CHECK (sleep_min BETWEEN 0 AND 960),
  steps integer NOT NULL CHECK (steps BETWEEN 0 AND 60000),
  source text NOT NULL DEFAULT 'phone_only',
  dew_awarded integer NOT NULL DEFAULT 0 CHECK (dew_awarded >= 0),
  sunlight_awarded integer NOT NULL DEFAULT 0 CHECK (sunlight_awarded >= 0),
  revealed_at timestamptz NOT NULL DEFAULT now(),
  ai_insight text NOT NULL DEFAULT '',
  UNIQUE (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.dew_catalog_items (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  category text NOT NULL CHECK (category IN ('plant', 'decor', 'critter')),
  name text NOT NULL,
  dew_cost integer NOT NULL CHECK (dew_cost >= 0),
  sunlight_cost integer NOT NULL CHECK (sunlight_cost >= 0),
  is_pro boolean NOT NULL DEFAULT false,
  asset_key text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dew_garden_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biome_id text NOT NULL DEFAULT 'sunlit_meadow',
  item_id text NOT NULL REFERENCES public.dew_catalog_items(id),
  grid_x smallint NOT NULL CHECK (grid_x BETWEEN 0 AND 7),
  grid_y smallint NOT NULL CHECK (grid_y BETWEEN 0 AND 7),
  placed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, biome_id, grid_x, grid_y)
);

CREATE TABLE IF NOT EXISTS public.dew_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  rc_customer_id text,
  plan_type text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dew_daily_logs_user_date ON public.dew_daily_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_dew_garden_placements_user ON public.dew_garden_placements (user_id, biome_id);

ALTER TABLE public.dew_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_garden_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dew_profiles_select_own" ON public.dew_profiles
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "dew_profiles_insert_own" ON public.dew_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "dew_profiles_update_own" ON public.dew_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "dew_daily_logs_select_own" ON public.dew_daily_logs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "dew_catalog_items_read_all" ON public.dew_catalog_items
  FOR SELECT USING (true);

CREATE POLICY "dew_garden_placements_all_own" ON public.dew_garden_placements
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "dew_subscriptions_select_own" ON public.dew_subscriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.dew_protect_profile_balances()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    IF NEW.dew_balance IS DISTINCT FROM OLD.dew_balance
       OR NEW.sunlight_balance IS DISTINCT FROM OLD.sunlight_balance
       OR NEW.is_pro IS DISTINCT FROM OLD.is_pro THEN
      RAISE EXCEPTION 'Direct mutation of dew_balance, sunlight_balance, or is_pro is not allowed';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_dew_protect_profile_balances
  BEFORE UPDATE ON public.dew_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.dew_protect_profile_balances();

CREATE OR REPLACE FUNCTION public.dew_claim_morning_reveal(
  p_log_date date,
  p_sleep_min integer,
  p_steps integer,
  p_bedtime_offset_min integer DEFAULT NULL,
  p_source text DEFAULT 'phone_only'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile public.dew_profiles%ROWTYPE;
  v_existing public.dew_daily_logs%ROWTYPE;
  v_sleep integer;
  v_steps integer;
  v_ratio numeric;
  v_dew integer;
  v_sun integer;
  v_new_fog smallint;
  v_inserted public.dew_daily_logs%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.dew_profiles (user_id)
  VALUES (v_uid)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_profile FROM public.dew_profiles WHERE user_id = v_uid FOR UPDATE;

  SELECT * INTO v_existing
  FROM public.dew_daily_logs
  WHERE user_id = v_uid AND log_date = p_log_date;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'already_revealed', true,
      'dew_awarded', 0,
      'sunlight_awarded', 0,
      'new_fog_level', v_profile.fog_level,
      'dew_balance', v_profile.dew_balance,
      'sunlight_balance', v_profile.sunlight_balance,
      'log', to_jsonb(v_existing)
    );
  END IF;

  v_sleep := LEAST(GREATEST(COALESCE(p_sleep_min, 0), 0), 960);
  v_steps := LEAST(GREATEST(COALESCE(p_steps, 0), 0), 60000);

  v_ratio := CASE WHEN v_profile.sleep_goal_min > 0 THEN v_sleep::numeric / v_profile.sleep_goal_min::numeric ELSE 0 END;
  IF v_ratio >= 0.85 THEN
    v_dew := 100;
  ELSIF v_ratio >= 0.65 THEN
    v_dew := 70;
  ELSE
    v_dew := 40;
  END IF;

  IF p_bedtime_offset_min IS NOT NULL AND ABS(p_bedtime_offset_min) <= 45 THEN
    v_dew := v_dew + 25;
  END IF;

  v_sun := LEAST((v_steps / 1000) * 10, 150);
  IF v_profile.step_goal > 0 AND v_steps >= v_profile.step_goal THEN
    v_sun := v_sun + 30;
  END IF;

  IF v_sleep > 0 OR v_steps >= 2000 THEN
    v_new_fog := 0;
  ELSE
    v_new_fog := v_profile.fog_level;
  END IF;

  INSERT INTO public.dew_daily_logs (user_id, log_date, sleep_min, steps, source, dew_awarded, sunlight_awarded)
  VALUES (v_uid, p_log_date, v_sleep, v_steps, COALESCE(p_source, 'phone_only'), v_dew, v_sun)
  RETURNING * INTO v_inserted;

  UPDATE public.dew_profiles
  SET dew_balance = dew_balance + v_dew,
      sunlight_balance = sunlight_balance + v_sun,
      fog_level = v_new_fog,
      updated_at = now()
  WHERE user_id = v_uid
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object(
    'already_revealed', false,
    'dew_awarded', v_dew,
    'sunlight_awarded', v_sun,
    'new_fog_level', v_new_fog,
    'dew_balance', v_profile.dew_balance,
    'sunlight_balance', v_profile.sunlight_balance,
    'log', to_jsonb(v_inserted)
  );
END;
$$;
