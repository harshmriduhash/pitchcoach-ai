DROP POLICY IF EXISTS "Visible profiles appear on leaderboard" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;

DROP POLICY IF EXISTS "Leaderboard stats are public when opted in" ON public.user_stats;
REVOKE SELECT ON public.user_stats FROM anon;

REVOKE ALL ON public.personas FROM anon;
REVOKE ALL ON public.personas FROM authenticated;
GRANT SELECT (id, slug, name, description, difficulty, persona_type, accent, opening_line, is_custom, created_by, is_active, is_free, created_at, updated_at) ON public.personas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.personas TO authenticated;