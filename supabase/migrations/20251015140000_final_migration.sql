-- ============================================
-- MIGRATION FINAL - Adiciona Receitas e Histórico
-- Usa consultation_requests com BIGINT (não UUID!)
-- ============================================

-- 1. Criar tabela prescriptions (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prescriptions'
    ) THEN
        CREATE TABLE public.prescriptions (
            id BIGSERIAL PRIMARY KEY,
            consultation_id BIGINT REFERENCES public.consultation_requests(id) ON DELETE CASCADE NOT NULL,
            doctor_id UUID,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Tabela prescriptions criada!';
    ELSE
        RAISE NOTICE '⚠️  Tabela prescriptions já existe, pulando...';
    END IF;
END $$;

-- 2. Adicionar colunas em consultation_requests (se não existirem)
DO $$ 
BEGIN
    -- medical_notes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultation_requests' 
        AND column_name = 'medical_notes'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN medical_notes TEXT;
        RAISE NOTICE '✅ Coluna medical_notes adicionada!';
    ELSE
        RAISE NOTICE '⚠️  Coluna medical_notes já existe!';
    END IF;
    
    -- diagnosis
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultation_requests' 
        AND column_name = 'diagnosis'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN diagnosis TEXT;
        RAISE NOTICE '✅ Coluna diagnosis adicionada!';
    ELSE
        RAISE NOTICE '⚠️  Coluna diagnosis já existe!';
    END IF;
    
    -- prescribed_medications
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultation_requests' 
        AND column_name = 'prescribed_medications'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN prescribed_medications TEXT;
        RAISE NOTICE '✅ Coluna prescribed_medications adicionada!';
    ELSE
        RAISE NOTICE '⚠️  Coluna prescribed_medications já existe!';
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
            id BIGSERIAL PRIMARY KEY,
            consultation_id BIGINT REFERENCES public.consultation_requests(id) ON DELETE CASCADE NOT NULL,
            changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            previous_status TEXT,
            new_status TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.consultation_history ENABLE ROW LEVEL SECURITY;
        
        RAISE NOTICE '✅ Tabela consultation_history criada!';
    ELSE
        RAISE NOTICE '⚠️  Tabela consultation_history já existe!';
    END IF;
END $$;

-- 4. Criar trigger para prescriptions updated_at (se não existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'update_prescriptions_updated_at'
        ) THEN
            CREATE TRIGGER update_prescriptions_updated_at
                BEFORE UPDATE ON public.prescriptions
                FOR EACH ROW
                EXECUTE FUNCTION public.update_updated_at();
            
            RAISE NOTICE '✅ Trigger update_prescriptions_updated_at criado!';
        ELSE
            RAISE NOTICE '⚠️  Trigger update_prescriptions_updated_at já existe!';
        END IF;
    ELSE
        RAISE NOTICE '⚠️  Função update_updated_at não existe, pulando trigger...';
    END IF;
END $$;

-- 5. Criar função para logar mudanças de status
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION public.log_consultation_status_change()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $func$
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
                OLD.status::TEXT,
                NEW.status::TEXT,
                CASE 
                    WHEN NEW.status::TEXT = 'in_progress' THEN 'Consulta iniciada'
                    WHEN NEW.status::TEXT = 'completed' THEN 'Consulta finalizada'
                    WHEN NEW.status::TEXT = 'cancelled' THEN 'Consulta cancelada'
                    ELSE 'Status alterado'
                END
            );
        END IF;
        RETURN NEW;
    END;
    $func$;
    
    RAISE NOTICE '✅ Função log_consultation_status_change criada/atualizada!';
END $$;

-- 6. Criar trigger para mudanças de status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_consultation_status_change'
        AND tgrelid = 'public.consultation_requests'::regclass
    ) THEN
        DROP TRIGGER on_consultation_status_change ON public.consultation_requests;
        RAISE NOTICE '⚠️  Trigger anterior removido!';
    END IF;
    
    CREATE TRIGGER on_consultation_status_change
        AFTER UPDATE ON public.consultation_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.log_consultation_status_change();
    
    RAISE NOTICE '✅ Trigger on_consultation_status_change criado!';
END $$;

-- 7. RLS Policies para prescriptions
DO $$
BEGIN
    -- Policy 1: SELECT para authenticated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Authenticated users can view prescriptions'
    ) THEN
        CREATE POLICY "Authenticated users can view prescriptions"
            ON public.prescriptions FOR SELECT
            TO authenticated
            USING (true);
        RAISE NOTICE '✅ Policy SELECT criada para prescriptions!';
    END IF;

    -- Policy 2: INSERT para authenticated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Authenticated users can create prescriptions'
    ) THEN
        CREATE POLICY "Authenticated users can create prescriptions"
            ON public.prescriptions FOR INSERT
            TO authenticated
            WITH CHECK (true);
        RAISE NOTICE '✅ Policy INSERT criada para prescriptions!';
    END IF;

    -- Policy 3: UPDATE para authenticated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Authenticated users can update prescriptions'
    ) THEN
        CREATE POLICY "Authenticated users can update prescriptions"
            ON public.prescriptions FOR UPDATE
            TO authenticated
            USING (true);
        RAISE NOTICE '✅ Policy UPDATE criada para prescriptions!';
    END IF;

    -- Policy 4: DELETE para authenticated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'prescriptions' 
        AND policyname = 'Authenticated users can delete prescriptions'
    ) THEN
        CREATE POLICY "Authenticated users can delete prescriptions"
            ON public.prescriptions FOR DELETE
            TO authenticated
            USING (true);
        RAISE NOTICE '✅ Policy DELETE criada para prescriptions!';
    END IF;
END $$;

-- 8. RLS Policies para consultation_history
DO $$
BEGIN
    -- Policy 1: SELECT para authenticated
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'consultation_history' 
        AND policyname = 'Authenticated users can view history'
    ) THEN
        CREATE POLICY "Authenticated users can view history"
            ON public.consultation_history FOR SELECT
            TO authenticated
            USING (true);
        RAISE NOTICE '✅ Policy SELECT criada para consultation_history!';
    END IF;
END $$;

-- 9. Mensagem final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 MIGRATION CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 O que foi criado:';
    RAISE NOTICE '  ✅ Tabela prescriptions';
    RAISE NOTICE '  ✅ Tabela consultation_history';
    RAISE NOTICE '  ✅ 3 colunas em consultation_requests';
    RAISE NOTICE '  ✅ Triggers e funções';
    RAISE NOTICE '  ✅ Políticas RLS';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Próximos passos:';
    RAISE NOTICE '  1. Criar bucket "prescriptions" em Storage';
    RAISE NOTICE '  2. Configurar políticas de Storage (ver CONFIGURACAO.md)';
    RAISE NOTICE '  3. Atualizar os tipos do Supabase no projeto';
    RAISE NOTICE '  4. Rodar: npm run dev';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
