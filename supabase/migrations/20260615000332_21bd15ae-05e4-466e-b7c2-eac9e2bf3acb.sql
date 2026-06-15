CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'team');
CREATE TYPE public.sales_role AS ENUM ('sdr', 'ae', 'founder', 'manager', 'other');
CREATE TYPE public.call_status AS ENUM ('pending', 'active', 'ended', 'scoring', 'complete', 'failed');
CREATE TYPE public.call_type AS ENUM ('cold_call', 'discovery', 'investor', 'objection', 'custom');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role public.sales_role NOT NULL DEFAULT 'other',
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  product_description TEXT NOT NULL DEFAULT '',
  icp_title TEXT NOT NULL DEFAULT '',
  deal_size_range TEXT NOT NULL DEFAULT '',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  leaderboard_visible BOOLEAN NOT NULL DEFAULT true,
  streak_goal INTEGER NOT NULL DEFAULT 5 CHECK (streak_goal BETWEEN 1 AND 7),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Visible profiles appear on leaderboard" ON public.profiles FOR SELECT TO anon, authenticated USING (leaderboard_visible = true);
GRANT SELECT ON public.profiles TO anon;

CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  persona_type TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT 'red',
  system_prompt TEXT NOT NULL,
  objection_patterns TEXT[] NOT NULL DEFAULT '{}',
  opening_line TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT custom_persona_owner CHECK ((is_custom AND created_by IS NOT NULL) OR (NOT is_custom AND created_by IS NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT SELECT ON public.personas TO anon;
GRANT ALL ON public.personas TO service_role;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active system personas are public" ON public.personas FOR SELECT TO anon, authenticated USING (is_active = true AND is_custom = false);
CREATE POLICY "Users manage custom personas" ON public.personas FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid() AND is_custom = true);

CREATE TABLE public.call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  persona_id UUID NOT NULL REFERENCES public.personas(id),
  call_type public.call_type NOT NULL,
  status public.call_status NOT NULL DEFAULT 'pending',
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  target_duration_minutes INTEGER NOT NULL DEFAULT 10 CHECK (target_duration_minutes BETWEEN 1 AND 60),
  score_overall NUMERIC(5,2),
  score_opening NUMERIC(5,2),
  score_talk_ratio NUMERIC(5,2),
  score_objection_handling NUMERIC(5,2),
  score_filler_words NUMERIC(5,2),
  score_value_framing NUMERIC(5,2),
  score_discovery_questions NUMERIC(5,2),
  score_next_step NUMERIC(5,2),
  score_confidence NUMERIC(5,2),
  talk_ratio_user NUMERIC(5,2),
  filler_word_count INTEGER NOT NULL DEFAULT 0,
  objections_raised INTEGER NOT NULL DEFAULT 0,
  objections_handled INTEGER NOT NULL DEFAULT 0,
  top_strength TEXT,
  critical_weakness TEXT,
  feedback TEXT,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  transcript JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_sessions TO authenticated;
GRANT ALL ON public.call_sessions TO service_role;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own calls" ON public.call_sessions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX call_sessions_user_created_idx ON public.call_sessions(user_id, created_at DESC);

CREATE TABLE public.call_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.call_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  turn_order INTEGER NOT NULL,
  speaker TEXT NOT NULL CHECK (speaker IN ('user', 'ai')),
  text TEXT NOT NULL CHECK (char_length(text) <= 5000),
  duration_ms INTEGER NOT NULL DEFAULT 0,
  filler_word_count INTEGER NOT NULL DEFAULT 0,
  filler_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  turn_score NUMERIC(5,2),
  ai_coaching_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, turn_order)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_turns TO authenticated;
GRANT ALL ON public.call_turns TO service_role;
ALTER TABLE public.call_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own call turns" ON public.call_turns FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_duration_minutes INTEGER NOT NULL DEFAULT 0,
  avg_score_overall NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  best_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  scores_by_dimension JSONB NOT NULL DEFAULT '{}'::jsonb,
  leaderboard_score NUMERIC(7,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT SELECT ON public.user_stats TO anon;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stats" ON public.user_stats FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leaderboard stats are public when opted in" ON public.user_stats FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.leaderboard_visible = true));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER personas_updated_at BEFORE UPDATE ON public.personas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON public.call_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name) VALUES (NEW.id, COALESCE(NEW.email, ''), COALESCE(NEW.raw_user_meta_data->>'name', ''));
  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.personas (slug, name, description, difficulty, persona_type, accent, system_prompt, objection_patterns, opening_line, is_free) VALUES
('gatekeeper','The Gatekeeper','Will not transfer you. Has heard every opener. Times your call from the first word.',3,'cold_call','red','Guard access aggressively. Be terse, skeptical, and interrupt weak openings.','{"Who is this?","What is this regarding?","Send an email."}','Yeah, who is this?',true),
('budget-ghost','The Budget Ghost','Loved your pitch. Went quiet for 3 weeks. Learn to earn the follow-up.',3,'follow_up','amber','Sound interested but noncommittal. Make the rep establish urgency and a concrete next step.','{"We are still reviewing.","Circle back next quarter.","I need internal buy-in."}','Hey — sorry, it has been a hectic few weeks.',true),
('champion','The Champion','Thinks you are perfect. Now convince the CFO who joined the call.',2,'discovery','green','Be supportive, but introduce an exacting CFO objection after value is established.','{"How do I sell this internally?","The CFO needs ROI."}','I loved what I saw. I brought our CFO along today.',true),
('competitor-loyalist','The Competitor Loyalist','Has used your competitor for four years. Give them a reason to switch.',4,'objection','blue','Defend the incumbent and demand concrete switching value without being impossible.','{"Our current tool works.","Switching is disruptive.","Why are you better?"}','We have used your competitor for four years. Why would we move?',false),
('technical-sceptic','The Technical Sceptic','Needs to understand the architecture before anything else. Do not skip steps.',4,'technical','cyan','Ask precise architecture, security, integration, and reliability questions.','{"How does SSO work?","Where is data stored?","What is your uptime?"}','Before we talk price, walk me through your architecture.',false),
('price-objector','The Price Objector','Your price is too high. Every time. Reframe value.',4,'objection','amber','Challenge price repeatedly until the rep quantifies business value and cost of inaction.','{"Too expensive.","We can build it.","Cut the price."}','I will save us time: your price is too high.',false),
('time-poor-executive','The Time-Poor Executive','Has four minutes. Make your case. They will hang up.',5,'cold_call','red','Be impatient and concise. End the call after repeated rambling or irrelevant claims.','{"Get to the point.","Why should I care?","You have 30 seconds."}','You have four minutes. Go.',false),
('internal-detractor','The Internal Detractor','Someone inside does not want this. Help your champion handle it.',4,'enterprise','purple','Surface political risk, adoption resistance, and competing internal priorities.','{"Operations will block this.","The VP prefers the status quo."}','Our operations lead does not want another tool.',false),
('rescheduler','The Rescheduler','Books, cancels, reschedules. Practice persistence, not just pitch.',2,'follow_up','blue','Be busy and evasive until the rep creates enough relevance for a firm commitment.','{"Can we move this?","Try me next month.","Email me times."}','I only have a minute — we may need to reschedule.',false),
('series-a-cfo','The Series A CFO','Investor persona. Defend your CAC, churn, burn, and moat.',5,'investor','green','Interrogate the business model like a rigorous Series A investor. Ask one hard question at a time.','{"What is your CAC payback?","Why will incumbents not copy this?","How much runway remains?"}','Start with revenue, burn, and months of runway.',false);