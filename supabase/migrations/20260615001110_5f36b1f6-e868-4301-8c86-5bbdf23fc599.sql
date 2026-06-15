DROP POLICY IF EXISTS "Users manage custom personas" ON public.personas;
CREATE POLICY "Users can view own custom personas" ON public.personas FOR SELECT TO authenticated USING (created_by = auth.uid() AND is_custom = true);
CREATE POLICY "Users can create custom personas" ON public.personas FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND is_custom = true);
CREATE POLICY "Users can update own custom personas" ON public.personas FOR UPDATE TO authenticated USING (created_by = auth.uid() AND is_custom = true) WITH CHECK (created_by = auth.uid() AND is_custom = true);
CREATE POLICY "Users can delete own custom personas" ON public.personas FOR DELETE TO authenticated USING (created_by = auth.uid() AND is_custom = true);