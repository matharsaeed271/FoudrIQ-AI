-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  company TEXT,
  role TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  compact_layout BOOLEAN NOT NULL DEFAULT false,
  keyboard_shortcuts BOOLEAN NOT NULL DEFAULT true,
  ai_autopilot BOOLEAN NOT NULL DEFAULT true,
  notify_blueprints BOOLEAN NOT NULL DEFAULT true,
  notify_weekly_reports BOOLEAN NOT NULL DEFAULT true,
  notify_product_updates BOOLEAN NOT NULL DEFAULT false,
  notify_marketing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Startups table
CREATE TABLE public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled startup',
  industry TEXT,
  problem TEXT,
  solution TEXT,
  business_model TEXT,
  revenue_model TEXT,
  pricing TEXT,
  marketing_plan TEXT,
  score INTEGER,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.startups TO authenticated;
GRANT ALL ON public.startups TO service_role;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "startups_select_own" ON public.startups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "startups_insert_own" ON public.startups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "startups_update_own" ON public.startups FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "startups_delete_own" ON public.startups FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER startups_set_updated_at BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX startups_user_id_created_at_idx ON public.startups(user_id, created_at DESC);

REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Storage: avatars bucket policies (bucket created via storage tool)
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
