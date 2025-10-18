-- Migration: Add foreign key from doctors.profile_id to profiles.id
-- Safe migration: will NULL-out orphan references before adding the FK

DO $$
BEGIN
  -- If constraint already exists, skip
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctors_profile_id_fkey'
  ) THEN
    RAISE NOTICE 'Constraint doctors_profile_id_fkey already exists, skipping.';
  ELSE
    -- Detect orphaned profile_id values
    IF EXISTS (
      SELECT 1
      FROM public.doctors d
      WHERE d.profile_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = d.profile_id)
    ) THEN
      RAISE NOTICE 'Orphaned doctors.profile_id values found. Setting them to NULL before creating FK.';

      UPDATE public.doctors d
      SET profile_id = NULL
      WHERE d.profile_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = d.profile_id);

      RAISE NOTICE 'Orphan cleanup complete.';
    ELSE
      RAISE NOTICE 'No orphaned doctors.profile_id values found.';
    END IF;

    -- Add the foreign key constraint
    ALTER TABLE public.doctors
      ADD CONSTRAINT doctors_profile_id_fkey
      FOREIGN KEY (profile_id)
      REFERENCES public.profiles (id)
      ON DELETE CASCADE;

    RAISE NOTICE 'Constraint doctors_profile_id_fkey created successfully.';
  END IF;
END $$;
