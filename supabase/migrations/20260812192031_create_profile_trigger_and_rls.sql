-- Trigger function to automatically create a patient profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
BEGIN
  -- Safely extract and trim full_name, converting empty strings to NULL
  v_full_name := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), '');

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    onboarding_completed
  ) VALUES (
    NEW.id,
    v_full_name,
    'patient'::public.user_role,
    false
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger to invoke handle_new_user after an auth.user is created
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- Row Level Security (RLS) Policies for public.profiles

-- Ensure anon role has absolutely no access
REVOKE ALL ON public.profiles FROM anon;

-- Grant only SELECT and UPDATE to authenticated users
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Policy: Allow authenticated users to select ONLY their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy: Allow authenticated users to update ONLY their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- Role and ID Protection Mechanism
-- This database-level mechanism prevents authenticated users from changing their
-- id or role, while allowing them to update permitted fields like full_name.
-- It simply ignores malicious changes to protected fields during web requests,
-- without breaking the entire update operation, and allows trusted database operations
-- (running as postgres or service_role) to make changes.
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user = 'authenticated' THEN
    NEW.id = OLD.id;
    NEW.role = OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_fields();
