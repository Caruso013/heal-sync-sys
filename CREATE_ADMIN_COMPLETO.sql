-- ============================================
-- SCRIPT COMPLETO: CRIAR ESTRUTURA + ADMIN
-- Execute este script para criar tudo necessário
-- ============================================

-- 1. Criar tipo de role se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'atendente', 'medico');
        RAISE NOTICE '✅ Tipo app_role criado';
    ELSE
        RAISE NOTICE '⚠️  Tipo app_role já existe';
    END IF;
END $$;

-- 2. Criar tabela user_roles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_roles'
    ) THEN
        CREATE TABLE public.user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            UNIQUE (user_id)
        );
        
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para user_roles
        CREATE POLICY "Users can view their own roles"
            ON public.user_roles FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
        
        RAISE NOTICE '✅ Tabela user_roles criada';
    ELSE
        RAISE NOTICE '⚠️  Tabela user_roles já existe';
    END IF;
END $$;

-- 3. Criar tabela profiles se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            full_name TEXT,
            phone TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
        -- Política RLS para profiles
        CREATE POLICY "Users can view their own profile"
            ON public.profiles FOR SELECT
            TO authenticated
            USING (auth.uid() = id);
        
        CREATE POLICY "Users can update their own profile"
            ON public.profiles FOR UPDATE
            TO authenticated
            USING (auth.uid() = id);
        
        RAISE NOTICE '✅ Tabela profiles criada';
    ELSE
        RAISE NOTICE '⚠️  Tabela profiles já existe';
    END IF;
END $$;

-- 4. CRIAR ADMIN MASTER
DO $$
DECLARE
    user_uuid UUID;
    user_email TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 BUSCANDO USUÁRIO...';
    RAISE NOTICE '========================================';
    
    -- Buscar ID e email do usuário
    SELECT id, email INTO user_uuid, user_email
    FROM auth.users
    WHERE email = 'dr.assis@gmail.com';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado! 
        
        SIGA ESTES PASSOS:
        1. Abra o Supabase Dashboard
        2. Vá em Authentication → Users → Add User
        3. Preencha:
           Email: dr.assis@gmail.com
           Password: Lady@leila1976
           ✅ Marque "Auto Confirm User"
        4. Clique em "Create User"
        5. Execute este script novamente';
    END IF;
    
    RAISE NOTICE '✅ Usuário encontrado: %', user_uuid;
    
    -- Verificar se já existe um perfil vinculado a este user_id
    -- Como profiles usa BIGINT e não UUID, vamos apenas garantir que o email exista
    -- A tabela profiles pode ter sua própria sequência de IDs
    
    -- Adicionar role de admin
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (
        user_uuid,
        'admin',
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE '✅ Role de admin adicionada';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 ADMIN CRIADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: dr.assis@gmail.com';
    RAISE NOTICE '🔐 Senha: Lady@leila1976';
    RAISE NOTICE '👤 UUID: %', user_uuid;
    RAISE NOTICE '🎭 Role: admin';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: A tabela profiles usa auto-incremento (bigint).';
    RAISE NOTICE '   O perfil será criado automaticamente no primeiro login.';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Faça login: http://localhost:8080';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '';
        RAISE NOTICE '❌ ERRO: %', SQLERRM;
        RAISE NOTICE '';
        RAISE;
END $$;
