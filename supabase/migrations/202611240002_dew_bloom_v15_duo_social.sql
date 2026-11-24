-- Dew & Bloom v1.5 Duo Shared Gardens & Social schema

CREATE TABLE IF NOT EXISTS public.dew_duo_gardens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Shared Sunlit Meadow',
  invite_code text NOT NULL UNIQUE,
  biome_id text NOT NULL DEFAULT 'sunlit_meadow',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dew_duo_members (
  garden_id uuid NOT NULL REFERENCES public.dew_duo_gardens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Keeper',
  role text NOT NULL CHECK (role IN ('owner', 'partner')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (garden_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.dew_duo_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id uuid NOT NULL REFERENCES public.dew_duo_gardens(id) ON DELETE CASCADE,
  placed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  grid_x smallint NOT NULL CHECK (grid_x BETWEEN 0 AND 7),
  grid_y smallint NOT NULL CHECK (grid_y BETWEEN 0 AND 7),
  placed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (garden_id, grid_x, grid_y)
);

CREATE TABLE IF NOT EXISTS public.dew_sunlight_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garden_id uuid NOT NULL REFERENCES public.dew_duo_gardens(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_date date NOT NULL DEFAULT CURRENT_DATE,
  message text NOT NULL DEFAULT 'Warm sunlight sent to your partner''s meadow',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (garden_id, sender_id, nudge_date)
);

CREATE INDEX IF NOT EXISTS idx_dew_duo_members_user ON public.dew_duo_members (user_id);
CREATE INDEX IF NOT EXISTS idx_dew_duo_placements_garden ON public.dew_duo_placements (garden_id);
CREATE INDEX IF NOT EXISTS idx_dew_sunlight_nudges_garden_date ON public.dew_sunlight_nudges (garden_id, nudge_date DESC);

ALTER TABLE public.dew_duo_gardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_duo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_duo_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dew_sunlight_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dew_duo_gardens_select_member" ON public.dew_duo_gardens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dew_duo_gardens_insert_own" ON public.dew_duo_gardens
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "dew_duo_members_select_member" ON public.dew_duo_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = garden_id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dew_duo_members_insert_self" ON public.dew_duo_members
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "dew_duo_placements_select_member" ON public.dew_duo_placements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = garden_id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dew_duo_placements_insert_member" ON public.dew_duo_placements
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = placed_by
    AND EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = garden_id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dew_sunlight_nudges_select_member" ON public.dew_sunlight_nudges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = garden_id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "dew_sunlight_nudges_insert_sender" ON public.dew_sunlight_nudges
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = sender_id
    AND EXISTS (
      SELECT 1 FROM public.dew_duo_members m
      WHERE m.garden_id = garden_id AND m.user_id = (SELECT auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.dew_join_duo_garden(
  p_invite_code text,
  p_display_name text DEFAULT 'Partner'
)
RETURNS public.dew_duo_gardens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_garden public.dew_duo_gardens;
  v_member_count integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_garden
  FROM public.dew_duo_gardens
  WHERE invite_code = upper(trim(p_invite_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.dew_duo_members
    WHERE garden_id = v_garden.id AND user_id = v_uid
  ) THEN
    RETURN v_garden;
  END IF;

  SELECT count(*) INTO v_member_count
  FROM public.dew_duo_members
  WHERE garden_id = v_garden.id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'This shared meadow already has two keepers';
  END IF;

  INSERT INTO public.dew_duo_members (garden_id, user_id, display_name, role)
  VALUES (v_garden.id, v_uid, COALESCE(NULLIF(trim(p_display_name), ''), 'Partner'), 'partner');

  RETURN v_garden;
END;
$$;

REVOKE ALL ON FUNCTION public.dew_join_duo_garden(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dew_join_duo_garden(text, text) TO authenticated;
