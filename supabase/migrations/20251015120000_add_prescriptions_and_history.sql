-- Create prescriptions table (receitas médicas) - only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'prescriptions') THEN
        CREATE TABLE public.prescriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
            doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add medical notes to consultations (only if columns don't exist)
DO $$ 
BEGIN
    -- Verificar se a tabela consultations existe
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'consultations') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'consultations' 
                       AND column_name = 'medical_notes') THEN
            ALTER TABLE public.consultations ADD COLUMN medical_notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'consultations' 
                       AND column_name = 'diagnosis') THEN
            ALTER TABLE public.consultations ADD COLUMN diagnosis TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'consultations' 
                       AND column_name = 'prescribed_medications') THEN
            ALTER TABLE public.consultations ADD COLUMN prescribed_medications TEXT;
        END IF;
    ELSE
        RAISE NOTICE 'ATENÇÃO: Tabela consultations não existe. Execute a migration base primeiro!';
    END IF;
END $$;

-- Create consultation_history table for tracking changes - only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'consultation_history') THEN
        CREATE TABLE public.consultation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    previous_status consultation_status,
    new_status consultation_status NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.consultation_history ENABLE ROW LEVEL SECURITY;

-- Trigger to update prescriptions updated_at
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- Function to log consultation status changes
CREATE OR REPLACE FUNCTION public.log_consultation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.consultation_history (
            consultation_id,
            changed_by,
            previous_status,
            new_status,
            notes
        ) VALUES (
            NEW.id,
            auth.uid(),
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status = 'in_progress' THEN 'Consulta iniciada'
                WHEN NEW.status = 'completed' THEN 'Consulta finalizada'
                WHEN NEW.status = 'cancelled' THEN 'Consulta cancelada'
                ELSE 'Status alterado'
            END
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for consultation status changes
CREATE TRIGGER on_consultation_status_change
    AFTER UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION public.log_consultation_status_change();

-- RLS Policies for prescriptions
CREATE POLICY "Doctors can view their prescriptions"
    ON public.prescriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE doctors.id = prescriptions.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all prescriptions"
    ON public.prescriptions FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Atendentes can view prescriptions"
    ON public.prescriptions FOR SELECT
    USING (public.has_role(auth.uid(), 'atendente'));

CREATE POLICY "Doctors can create prescriptions"
    ON public.prescriptions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE doctors.id = prescriptions.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Doctors can update their prescriptions"
    ON public.prescriptions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.doctors
            WHERE doctors.id = prescriptions.doctor_id
            AND doctors.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update any prescription"
    ON public.prescriptions FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for consultation_history
CREATE POLICY "Doctors can view history of their consultations"
    ON public.consultation_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.consultations c
            JOIN public.doctors d ON d.id = c.doctor_id
            WHERE c.id = consultation_history.consultation_id
            AND d.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all history"
    ON public.consultation_history FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Atendentes can view history"
    ON public.consultation_history FOR SELECT
    USING (public.has_role(auth.uid(), 'atendente'));

-- Create storage bucket for prescriptions (execute this in Supabase dashboard or via API)
-- This is a comment as storage buckets are typically created via Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', false);

-- Storage policies would be:
-- CREATE POLICY "Authenticated users can upload prescriptions"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');
--
-- CREATE POLICY "Users can view their prescriptions"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');
