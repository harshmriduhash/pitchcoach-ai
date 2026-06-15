REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.profiles TO authenticated;
GRANT UPDATE (name, role, product_description, icp_title, deal_size_range, onboarding_completed, leaderboard_visible, streak_goal, updated_at) ON public.profiles TO authenticated;

CREATE TABLE public.persona_secrets (
  persona_id UUID PRIMARY KEY REFERENCES public.personas(id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL,
  objection_patterns TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.persona_secrets TO service_role;
ALTER TABLE public.persona_secrets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.persona_secrets (persona_id, system_prompt, objection_patterns)
SELECT id, system_prompt, objection_patterns FROM public.personas;
ALTER TABLE public.personas DROP COLUMN system_prompt;
ALTER TABLE public.personas DROP COLUMN objection_patterns;