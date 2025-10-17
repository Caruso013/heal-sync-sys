-- Adicionar novos campos na tabela consultations
ALTER TABLE public.consultations 
ADD COLUMN IF NOT EXISTS queue_position INTEGER,
ADD COLUMN IF NOT EXISTS call_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS call_timeout_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS doctors_called UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS call_attempts INTEGER DEFAULT 0;

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_doctors_available ON public.doctors(is_available, status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_consultations_queue ON public.consultations(status, created_at) WHERE status = 'pending';

-- FUNÇÃO: get_next_available_doctor
CREATE OR REPLACE FUNCTION public.get_next_available_doctor(p_specialty TEXT, p_excluded_doctors UUID[])
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE 
  v_doctor_id UUID;
BEGIN
  SELECT id INTO v_doctor_id 
  FROM doctors
  WHERE status = 'approved' 
    AND is_available = true
    AND specialty ILIKE '%' || p_specialty || '%'
    AND id != ALL(p_excluded_doctors)
    AND NOT EXISTS (
      SELECT 1 FROM consultations 
      WHERE doctor_id = doctors.id 
        AND status = 'in_progress'
    )
  ORDER BY (
    SELECT MAX(completed_at) 
    FROM consultations 
    WHERE doctor_id = doctors.id
  ) NULLS FIRST, created_at ASC
  LIMIT 1;
  
  RETURN v_doctor_id;
END;
$$;

-- FUNÇÃO: call_next_doctor
CREATE OR REPLACE FUNCTION public.call_next_doctor(p_consultation_id UUID)
RETURNS TABLE (
  doctor_id UUID, 
  doctor_name TEXT, 
  timeout_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_consultation RECORD;
  v_next_doctor_id UUID;
  v_doctor_name TEXT;
  v_timeout_at TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO v_consultation 
  FROM consultations 
  WHERE id = p_consultation_id;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Consulta não encontrada'; 
  END IF;
  
  v_next_doctor_id := get_next_available_doctor(
    v_consultation.specialty, 
    COALESCE(v_consultation.doctors_called, ARRAY[]::UUID[])
  );
  
  IF v_next_doctor_id IS NULL THEN 
    RETURN; 
  END IF;
  
  SELECT p.full_name INTO v_doctor_name 
  FROM doctors d 
  JOIN profiles p ON d.user_id = p.id 
  WHERE d.id = v_next_doctor_id;
  
  v_timeout_at := NOW() + INTERVAL '15 seconds';
  
  UPDATE consultations SET
    doctor_id = v_next_doctor_id,
    call_started_at = NOW(),
    call_timeout_at = v_timeout_at,
    doctors_called = array_append(
      COALESCE(doctors_called, ARRAY[]::UUID[]), 
      v_next_doctor_id
    ),
    call_attempts = COALESCE(call_attempts, 0) + 1,
    updated_at = NOW()
  WHERE id = p_consultation_id;
  
  RETURN QUERY SELECT v_next_doctor_id, v_doctor_name, v_timeout_at;
END;
$$;

-- FUNÇÃO: accept_consultation
CREATE OR REPLACE FUNCTION public.accept_consultation(
  p_consultation_id UUID, 
  p_doctor_user_id UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_doctor_id UUID;
  v_consultation RECORD;
BEGIN
  SELECT id INTO v_doctor_id 
  FROM doctors 
  WHERE user_id = p_doctor_user_id;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Médico não encontrado'; 
  END IF;
  
  SELECT * INTO v_consultation 
  FROM consultations 
  WHERE id = p_consultation_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Consulta não encontrada'; 
  END IF;
  
  IF v_consultation.doctor_id != v_doctor_id 
     OR v_consultation.status != 'pending' 
     OR NOW() > v_consultation.call_timeout_at THEN
    RETURN FALSE;
  END IF;
  
  UPDATE consultations SET
    status = 'in_progress', 
    started_at = NOW(), 
    call_started_at = NULL, 
    call_timeout_at = NULL, 
    updated_at = NOW()
  WHERE id = p_consultation_id;
  
  RETURN TRUE;
END;
$$;

-- FUNÇÃO: reject_or_timeout_consultation
CREATE OR REPLACE FUNCTION public.reject_or_timeout_consultation(p_consultation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE consultations SET 
    doctor_id = NULL, 
    call_started_at = NULL, 
    call_timeout_at = NULL, 
    updated_at = NOW()
  WHERE id = p_consultation_id 
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Habilitar realtime para consultations
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultations;