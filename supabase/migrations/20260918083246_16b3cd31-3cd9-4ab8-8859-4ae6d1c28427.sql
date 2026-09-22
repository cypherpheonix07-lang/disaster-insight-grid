CREATE TABLE public.copilot_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New briefing',
  incident TEXT NOT NULL DEFAULT 'Cyclone Vaayu — Chennai 2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_threads TO authenticated;
GRANT ALL ON public.copilot_threads TO service_role;
ALTER TABLE public.copilot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own threads" ON public.copilot_threads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.copilot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.copilot_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_id TEXT,
  role TEXT NOT NULL,
  parts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX copilot_messages_thread_idx ON public.copilot_messages(thread_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copilot_messages TO authenticated;
GRANT ALL ON public.copilot_messages TO service_role;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own messages" ON public.copilot_messages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER update_copilot_threads_updated_at BEFORE UPDATE ON public.copilot_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();