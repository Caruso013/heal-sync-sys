-- ============================================
-- SCRIPT RÁPIDO: CRIAR ADMIN MASTER
-- Execute este script DEPOIS de criar o usuário no Dashboard
-- ============================================

-- IMPORTANTE: Primeiro crie o usuário manualmente:
-- 1. Vá em: Supabase Dashboard → Authentication → Users → Add User
-- 2. Email: dr.assis@gmail.com
-- 3. Password: Lady@leila1976
-- 4. Marque "Auto Confirm User"
-- 5. Clique em "Create User"
-- 6. Depois execute este script abaixo:

-- Adicionar perfil e role de admin
DO $$
DECLARE
    user_uuid UUID;
    column_exists BOOLEAN;
BEGIN
    -- Buscar ID do usuário
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'dr.assis@gmail.com';
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION '❌ Usuário não encontrado! Crie o usuário no Dashboard primeiro.';
    END IF;
    
    -- Verificar se a coluna full_name existe
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'full_name'
    ) INTO column_exists;
    
    -- Criar perfil (com ou sem full_name dependendo da estrutura)
    IF column_exists THEN
        INSERT INTO public.profiles (id, email, full_name, phone, created_at, updated_at)
        VALUES (
            user_uuid,
            'dr.assis@gmail.com',
            'Dr. Assis (Admin Master)',
            NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET full_name = 'Dr. Assis (Admin Master)',
            updated_at = NOW();
    ELSE
        -- Se full_name não existe, inserir apenas email
        INSERT INTO public.profiles (id, email, phone, created_at, updated_at)
        VALUES (
            user_uuid,
            'dr.assis@gmail.com',
            NULL,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET updated_at = NOW();
    END IF;
    
    -- Criar role de admin
    INSERT INTO public.user_roles (user_id, role, created_at)
    VALUES (
        user_uuid,
        'admin',
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ADMIN CRIADO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Email: dr.assis@gmail.com';
    RAISE NOTICE '🔐 Senha: Lady@leila1976';
    RAISE NOTICE '👤 Nome: Dr. Assis (Admin Master)';
    RAISE NOTICE '🎭 Role: admin';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Agora você pode fazer login no sistema!';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    
END $$;
