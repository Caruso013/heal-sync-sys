-- Fix function search path for security with CASCADE
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Recreate triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();