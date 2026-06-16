
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can insert errors" ON public.error_logs;
CREATE POLICY "Insert restricted to short messages" ON public.error_logs FOR INSERT TO authenticated, anon
  WITH CHECK (length(message) < 4000 AND length(source) < 200);
