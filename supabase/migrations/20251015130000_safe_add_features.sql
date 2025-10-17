-- ============================================
-- MIGRATION SEGURA - Adiciona Receitas e Histórico
-- Detecta automaticamente os nomes corretos das tabelas
-- ============================================

-- 0. VERIFICAR TABELAS EXISTENTES
DO $$
DECLARE
    v_consultations_table TEXT;
    v_doctors_table TEXT;
BEGIN
    -- Detectar nome da tabela de consultas
    SELECT table_name INTO v_consultations_table
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name LIKE '%consultation%'
    LIMIT 1;
    
    -- Detectar nome da tabela de médicos
    SELECT table_name INTO v_doctors_table
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name LIKE '%doctor%'
    LIMIT 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TABELAS DETECTADAS:';
    RAISE NOTICE 'Consultations: %', COALESCE(v_consultations_table, 'NÃO ENCONTRADA');
    RAISE NOTICE 'Doctors: %', COALESCE(v_doctors_table, 'NÃO ENCONTRADA');
    RAISE NOTICE '========================================';
    
    IF v_consultations_table IS NULL THEN
        RAISE EXCEPTION 'ERRO: Tabela de consultas não encontrada! Verifique se as migrations base foram executadas.';
    END IF;
    
    IF v_doctors_table IS NULL THEN
        RAISE EXCEPTION 'ERRO: Tabela de médicos não encontrada! Verifique se as migrations base foram executadas.';
    END IF;
END $$;

-- 1. Criar tabela prescriptions (se não existir)
DO $$ 
DECLARE
    v_consultations_table TEXT := 'consultations';
    v_doctors_table TEXT := 'doctors';
BEGIN
    -- Detectar nomes reais das tabelas
    SELECT table_name INTO v_consultations_table
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name LIKE '%consultation%'
    LIMIT 1;
    
    SELECT table_name INTO v_doctors_table
    FROM information_schema.tables
    WHERE table_schema = 'public' 
    AND table_name LIKE '%doctor%'
    LIMIT 1;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prescriptions'
    ) THEN
        EXECUTE format('
            CREATE TABLE public.prescriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                consultation_id UUID REFERENCES public.%I(id) ON DELETE CASCADE NOT NULL,
                doctor_id UUID REFERENCES public.%I(id) ON DELETE SET NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                mime_type TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
            )', v_consultations_table, v_doctors_table);
        
        ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Tabela prescriptions criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela prescriptions já existe, pulando...';
    END IF;
END $$;

-- 2. Adicionar colunas em consultations (se não existirem)
DO $$ 
BEGIN
    -- medical_notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'medical_notes'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN medical_notes TEXT;
        RAISE NOTICE 'Coluna medical_notes adicionada!';
    ELSE
        RAISE NOTICE 'Coluna medical_notes já existe, pulando...';
    END IF;
    
    -- diagnosis
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'diagnosis'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN diagnosis TEXT;
        RAISE NOTICE 'Coluna diagnosis adicionada!';
    ELSE
        RAISE NOTICE 'Coluna diagnosis já existe, pulando...';
    END IF;
    
    -- prescribed_medications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'prescribed_medications'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN prescribed_medications TEXT;
        RAISE NOTICE 'Coluna prescribed_medications adicionada!';
    ELSE
        RAISE NOTICE 'Coluna prescribed_medications já existe, pulando...';
    END IF;
END $$;

-- 3. Criar tabela consultation_history (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'consultation_history'
    ) THEN
        CREATE TABLE public.consultation_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
            changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            previous_status public.consultation_status,
            new_status public.consultation_status NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.consultation_history ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE 'Tabela consultation_history criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela consultation_history já existe, pulando...';
    END IF;
END $$;

-- 4. Criar trigger para prescriptions updated_at (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_prescriptions_updated_at'
    ) THEN
        CREATE TRIGGER update_prescriptions_updated_at
            BEFORE UPDATE ON public.prescriptions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at();
        
        RAISE NOTICE 'Trigger update_prescriptions_updated_at criado!';
    ELSE
        RAISE NOTICE 'Trigger update_prescriptions_updated_at já existe, pulando...';
    END IF;
END $$;

-- 5. Criar função para logar mudanças de status
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

-- 6. Criar trigger para mudanças de status (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_consultation_status_change'
    ) THEN
        CREATE TRIGGER on_consultation_status_change
            AFTER UPDATE ON public.consultations
            FOR EACH ROW
            EXECUTE FUNCTION public.log_consultation_status_change();
        
        RAISE NOTICE 'Trigger on_consultation_status_change criado!';
    ELSE
        DROP TRIGGER on_consultation_status_change ON public.consultations;
        CREATE TRIGGER on_consultation_status_change
            AFTER UPDATE ON public.consultations
            FOR EACH ROW
            EXECUTE FUNCTION public.log_consultation_status_change();
        
        RAISE NOTICE 'Trigger on_consultation_status_change recriado!';
    END IF;
END $$;

-- 7. RLS Policies para prescriptions
DO $$
BEGIN
    -- Doctors can view their prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Doctors can view their prescriptions'
    ) THEN
        CREATE POLICY "Doctors can view their prescriptions"
            ON public.prescriptions FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.doctors
                    WHERE doctors.id = prescriptions.doctor_id
                    AND doctors.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Policy "Doctors can view their prescriptions" criada!';
    END IF;

    -- Admins can view all prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Admins can view all prescriptions'
    ) THEN
        CREATE POLICY "Admins can view all prescriptions"
            ON public.prescriptions FOR SELECT
            USING (public.has_role(auth.uid(), 'admin'));
        RAISE NOTICE 'Policy "Admins can view all prescriptions" criada!';
    END IF;

    -- Atendentes can view prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Atendentes can view prescriptions'
    ) THEN
        CREATE POLICY "Atendentes can view prescriptions"
            ON public.prescriptions FOR SELECT
            USING (public.has_role(auth.uid(), 'atendente'));
        RAISE NOTICE 'Policy "Atendentes can view prescriptions" criada!';
    END IF;

    -- Doctors can create prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Doctors can create prescriptions'
    ) THEN
        CREATE POLICY "Doctors can create prescriptions"
            ON public.prescriptions FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.doctors
                    WHERE doctors.id = prescriptions.doctor_id
                    AND doctors.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Policy "Doctors can create prescriptions" criada!';
    END IF;

    -- Doctors can update their prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Doctors can update their prescriptions'
    ) THEN
        CREATE POLICY "Doctors can update their prescriptions"
            ON public.prescriptions FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.doctors
                    WHERE doctors.id = prescriptions.doctor_id
                    AND doctors.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Policy "Doctors can update their prescriptions" criada!';
    END IF;

    -- Doctors can delete their prescriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Doctors can delete their prescriptions'
    ) THEN
        CREATE POLICY "Doctors can delete their prescriptions"
            ON public.prescriptions FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.doctors
                    WHERE doctors.id = prescriptions.doctor_id
                    AND doctors.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Policy "Doctors can delete their prescriptions" criada!';
    END IF;

    -- Admins can update any prescription
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Admins can update any prescription'
    ) THEN
        CREATE POLICY "Admins can update any prescription"
            ON public.prescriptions FOR UPDATE
            USING (public.has_role(auth.uid(), 'admin'));
        RAISE NOTICE 'Policy "Admins can update any prescription" criada!';
    END IF;
END $$;

-- 8. RLS Policies para consultation_history
DO $$
BEGIN
    -- Doctors can view history of their consultations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consultation_history' 
        AND policyname = 'Doctors can view history of their consultations'
    ) THEN
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
        RAISE NOTICE 'Policy "Doctors can view history of their consultations" criada!';
    END IF;

    -- Admins can view all history
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consultation_history' 
        AND policyname = 'Admins can view all history'
    ) THEN
        CREATE POLICY "Admins can view all history"
            ON public.consultation_history FOR SELECT
            USING (public.has_role(auth.uid(), 'admin'));
        RAISE NOTICE 'Policy "Admins can view all history" criada!';
    END IF;

    -- Atendentes can view history
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consultation_history' 
        AND policyname = 'Atendentes can view history'
    ) THEN
        CREATE POLICY "Atendentes can view history"
            ON public.consultation_history FOR SELECT
            USING (public.has_role(auth.uid(), 'atendente'));
        RAISE NOTICE 'Policy "Atendentes can view history" criada!';
    END IF;
END $$;

-- 9. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Criar bucket "prescriptions" em Storage';
    RAISE NOTICE '2. Configurar políticas de Storage';
    RAISE NOTICE '3. Rodar o projeto: npm run dev';
    RAISE NOTICE '========================================';
END $$;
