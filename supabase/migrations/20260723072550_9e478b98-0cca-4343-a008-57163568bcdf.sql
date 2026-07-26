
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill from existing full_name where possible
UPDATE public.profiles
SET
  first_name = COALESCE(first_name, split_part(full_name, ' ', 1)),
  last_name = COALESCE(last_name, NULLIF(regexp_replace(full_name, '^\S+\s*', ''), ''))
WHERE full_name IS NOT NULL AND (first_name IS NULL OR last_name IS NULL);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name TEXT;
  v_first TEXT;
  v_last TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_first := split_part(v_full_name, ' ', 1);
  v_last := NULLIF(regexp_replace(v_full_name, '^\S+\s*', ''), '');

  INSERT INTO public.profiles (id, full_name, first_name, last_name, email, avatar_url)
  VALUES (
    NEW.id,
    v_full_name,
    v_first,
    v_last,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
