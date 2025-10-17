-- Migration: Cascade Notifications + accept_consultation RPC
-- Creates notifications table (if not exists), and a stored procedure to atomically accept a consultation

/* Notifications table already exists in your schema; this migration will ensure required columns and indexes exist. */

-- Add columns to notifications table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'consultation_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN consultation_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'doctor_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN doctor_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'priority_order'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN priority_order integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'responded_at'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN responded_at timestamptz;
  END IF;
END$$;

-- Indexes for fast lookup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='notifications' AND indexname='idx_notifications_consultation') THEN
    CREATE INDEX idx_notifications_consultation ON public.notifications(consultation_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='notifications' AND indexname='idx_notifications_doctor') THEN
    CREATE INDEX idx_notifications_doctor ON public.notifications(doctor_id);
  END IF;
END$$;

-- Stored procedure: accept_consultation
-- Atomically mark consultation as 'active' and mark the notification responded, delete or mark other notifications as cancelled
CREATE OR REPLACE FUNCTION public.accept_consultation(_consultation_id uuid, _doctor_id uuid)
RETURNS TABLE(success boolean, message text) LANGUAGE plpgsql AS $$
DECLARE
  v_consultation_exists integer;
  v_lock boolean;
BEGIN
  -- Ensure the consultation exists and is still pending
  SELECT COUNT(*) INTO v_consultation_exists FROM public.consultation_requests WHERE id = _consultation_id AND status = 'pending';
  IF v_consultation_exists = 0 THEN
    RETURN QUERY SELECT false, 'Consulta não encontrada ou já atendida';
    RETURN;
  END IF;

  -- Lock the consultation row
  PERFORM 1 FROM public.consultation_requests WHERE id = _consultation_id FOR UPDATE;

  -- Re-check after lock
  SELECT COUNT(*) INTO v_consultation_exists FROM public.consultation_requests WHERE id = _consultation_id AND status = 'pending';
  IF v_consultation_exists = 0 THEN
    RETURN QUERY SELECT false, 'Consulta já aceita por outro médico';
    RETURN;
  END IF;

  -- Update consultation to active and set assigned doctor and started_at
  UPDATE public.consultation_requests
  SET status = 'active', assigned_doctor_id = _doctor_id, started_at = now(), updated_at = now()
  WHERE id = _consultation_id;

  -- Mark this doctor's notification as responded
  UPDATE public.notifications
  SET responded_at = now()
  WHERE consultation_id = _consultation_id AND doctor_id = _doctor_id;

  -- Mark other notifications for this consultation as responded_at (or delete them)
  UPDATE public.notifications
  SET responded_at = now()
  WHERE consultation_id = _consultation_id AND (doctor_id IS NULL OR doctor_id <> _doctor_id) AND responded_at IS NULL;

  RETURN QUERY SELECT true, 'Consulta aceita com sucesso';
END;
$$;

-- Grant execute to authenticated role (if using Supabase RLS)
GRANT EXECUTE ON FUNCTION public.accept_consultation(uuid, uuid) TO authenticated;
