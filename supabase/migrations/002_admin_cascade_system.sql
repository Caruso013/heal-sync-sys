-- ============================================
-- SISTEMA DE ADMIN + CASCATA TIPO UBER
-- Otyma Saúde - Admin Separado
-- ============================================

-- 1. ESPECIALIDADES (se não existir)
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE MÉDICOS (expandida)
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Dados profissionais
    crm VARCHAR(20) NOT NULL UNIQUE,
    crm_state VARCHAR(2) NOT NULL,
    specialty_id UUID REFERENCES public.specialties(id),
    bio TEXT,
    experience_years INTEGER,
    
    -- Status e aprovação
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    
    -- Disponibilidade e localização
    is_available BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    accepts_teleconsultation BOOLEAN DEFAULT true,
    accepts_prescription_renewal BOOLEAN DEFAULT true,
    
    -- Configurações de notificação
    whatsapp_number VARCHAR(20),
    notification_whatsapp BOOLEAN DEFAULT true,
    notification_email BOOLEAN DEFAULT true,
    notification_push BOOLEAN DEFAULT false,
    
    -- Estatísticas
    total_consultations INTEGER DEFAULT 0,
    total_accepted INTEGER DEFAULT 0,
    total_rejected INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    average_response_time INTEGER, -- em segundos
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    
    -- Documentos
    profile_photo_url TEXT,
    crm_document_url TEXT,
    diploma_url TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SISTEMA DE CASCATA - CONSULTAS
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS cascade_round INTEGER DEFAULT 1;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS cascade_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS total_doctors_notified INTEGER DEFAULT 0;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS attendant_notes TEXT;

-- 4. HISTÓRICO DE CASCATA (quem recebeu, quando, se aceitou/rejeitou)
CREATE TABLE IF NOT EXISTS public.cascade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id INTEGER REFERENCES public.consultation_requests(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
    
    -- Detalhes da notificação
    round_number INTEGER NOT NULL,
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notification_type VARCHAR(20) DEFAULT 'whatsapp' CHECK (notification_type IN ('whatsapp', 'email', 'push', 'sms')),
    
    -- Resposta do médico
    response VARCHAR(20) CHECK (response IN ('pending', 'accepted', 'rejected', 'expired')),
    responded_at TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER, -- tempo que levou para responder
    rejection_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CONFIGURAÇÕES DO SISTEMA DE CASCATA
CREATE TABLE IF NOT EXISTS public.cascade_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Configurações de tempo
    timeout_per_round_minutes INTEGER DEFAULT 5, -- tempo de espera por rodada
    max_rounds INTEGER DEFAULT 5, -- máximo de rodadas de cascata
    doctors_per_round INTEGER DEFAULT 3, -- quantos médicos notificar por vez
    
    -- Priorização
    prioritize_by VARCHAR(20) DEFAULT 'availability' CHECK (prioritize_by IN ('availability', 'rating', 'response_time', 'specialty_match', 'random')),
    
    -- Notificações
    enable_whatsapp BOOLEAN DEFAULT true,
    enable_email BOOLEAN DEFAULT true,
    enable_push BOOLEAN DEFAULT false,
    
    -- WhatsApp Template
    whatsapp_template TEXT DEFAULT 'Nova consulta disponível! Paciente: {patient_name}. Especialidade: {specialty}. Urgência: {urgency}. Aceitar em: {link}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO public.cascade_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- 6. TABELA DE ROLES (Admin, Atendente, Médico, Paciente)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'atendente', 'medico', 'paciente')),
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, role)
);

-- 7. LOGS DE AÇÕES DO ADMIN/ATENDENTE
CREATE TABLE IF NOT EXISTS public.action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'create_consultation', 'approve_doctor', 'reject_doctor', 'start_cascade', etc
    entity_type VARCHAR(50), -- 'consultation', 'doctor', 'patient', etc
    entity_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'consultation', 'approval')),
    
    -- Relacionamentos
    related_entity_type VARCHAR(50), -- 'consultation', 'doctor', etc
    related_entity_id TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_doctors_approval_status ON public.doctors(approval_status);
CREATE INDEX IF NOT EXISTS idx_doctors_is_available ON public.doctors(is_available);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctors_profile ON public.doctors(profile_id);

CREATE INDEX IF NOT EXISTS idx_cascade_history_consultation ON public.cascade_history(consultation_id);
CREATE INDEX IF NOT EXISTS idx_cascade_history_doctor ON public.cascade_history(doctor_id);
CREATE INDEX IF NOT EXISTS idx_cascade_history_response ON public.cascade_history(response);

CREATE INDEX IF NOT EXISTS idx_consultation_cascade_round ON public.consultation_requests(cascade_round);
CREATE INDEX IF NOT EXISTS idx_consultation_status ON public.consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_specialty ON public.consultation_requests(specialty);

CREATE INDEX IF NOT EXISTS idx_user_roles_profile ON public.user_roles(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_action_logs_user ON public.action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_action_logs_entity ON public.action_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS - SISTEMA DE CASCATA
-- ============================================

-- Função para iniciar cascata
CREATE OR REPLACE FUNCTION start_cascade(p_consultation_id INTEGER)
RETURNS TABLE(
    doctors_notified INTEGER,
    round_number INTEGER,
    success BOOLEAN
) AS $$
DECLARE
    v_specialty VARCHAR(100);
    v_doctors_per_round INTEGER;
    v_current_round INTEGER;
    v_notified_count INTEGER := 0;
BEGIN
    -- Buscar dados da consulta
    SELECT specialty, cascade_round INTO v_specialty, v_current_round
    FROM consultation_requests
    WHERE id = p_consultation_id;
    
    -- Buscar configuração
    SELECT doctors_per_round INTO v_doctors_per_round
    FROM cascade_settings
    LIMIT 1;
    
    -- Atualizar consulta
    UPDATE consultation_requests
    SET 
        cascade_started_at = NOW(),
        cascade_round = COALESCE(v_current_round, 0) + 1
    WHERE id = p_consultation_id;
    
    -- Selecionar médicos disponíveis (que não foram notificados ainda)
    WITH available_doctors AS (
        SELECT d.id
        FROM doctors d
        INNER JOIN specialties s ON d.specialty_id = s.id
        WHERE 
            d.approval_status = 'approved'
            AND d.is_available = true
            AND s.name = v_specialty
            AND d.id NOT IN (
                SELECT doctor_id 
                FROM cascade_history 
                WHERE consultation_id = p_consultation_id
            )
        ORDER BY d.rating_average DESC, d.average_response_time ASC
        LIMIT v_doctors_per_round
    )
    -- Inserir no histórico de cascata
    INSERT INTO cascade_history (consultation_id, doctor_id, round_number, notification_type, response)
    SELECT p_consultation_id, id, v_current_round + 1, 'whatsapp', 'pending'
    FROM available_doctors;
    
    GET DIAGNOSTICS v_notified_count = ROW_COUNT;
    
    -- Atualizar contador na consulta
    UPDATE consultation_requests
    SET total_doctors_notified = total_doctors_notified + v_notified_count
    WHERE id = p_consultation_id;
    
    RETURN QUERY SELECT v_notified_count, v_current_round + 1, (v_notified_count > 0);
END;
$$ LANGUAGE plpgsql;

-- Função para médico aceitar consulta
CREATE OR REPLACE FUNCTION accept_consultation(p_consultation_id INTEGER, p_doctor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_already_assigned BOOLEAN;
BEGIN
    -- Verificar se já tem médico atribuído
    SELECT (doctor_id IS NOT NULL) INTO v_already_assigned
    FROM consultation_requests
    WHERE id = p_consultation_id;
    
    IF v_already_assigned THEN
        RETURN false; -- Já foi aceita por outro médico
    END IF;
    
    -- Atribuir médico e mudar status
    UPDATE consultation_requests
    SET 
        doctor_id = p_doctor_id::TEXT,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_consultation_id AND doctor_id IS NULL;
    
    -- Atualizar histórico de cascata
    UPDATE cascade_history
    SET 
        response = 'accepted',
        responded_at = NOW(),
        response_time_seconds = EXTRACT(EPOCH FROM (NOW() - notified_at))::INTEGER
    WHERE consultation_id = p_consultation_id AND doctor_id = p_doctor_id;
    
    -- Marcar outros como expirados
    UPDATE cascade_history
    SET response = 'expired'
    WHERE consultation_id = p_consultation_id 
        AND doctor_id != p_doctor_id 
        AND response = 'pending';
    
    -- Atualizar estatísticas do médico
    UPDATE doctors
    SET 
        total_accepted = total_accepted + 1,
        updated_at = NOW()
    WHERE id = p_doctor_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para médico rejeitar consulta
CREATE OR REPLACE FUNCTION reject_consultation(
    p_consultation_id INTEGER, 
    p_doctor_id UUID,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Atualizar histórico de cascata
    UPDATE cascade_history
    SET 
        response = 'rejected',
        responded_at = NOW(),
        response_time_seconds = EXTRACT(EPOCH FROM (NOW() - notified_at))::INTEGER,
        rejection_reason = p_rejection_reason
    WHERE consultation_id = p_consultation_id AND doctor_id = p_doctor_id;
    
    -- Atualizar estatísticas do médico
    UPDATE doctors
    SET 
        total_rejected = total_rejected + 1,
        updated_at = NOW()
    WHERE id = p_doctor_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cascade_settings_updated_at BEFORE UPDATE ON public.cascade_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cascade_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar conforme necessidade)
CREATE POLICY "Permitir leitura de médicos" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Permitir atualização próprio perfil médico" ON public.doctors FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Permitir leitura de cascata" ON public.cascade_history FOR SELECT USING (true);

CREATE POLICY "Permitir leitura de notificações próprias" ON public.notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Permitir marcar como lida" ON public.notifications FOR UPDATE USING (recipient_id = auth.uid());

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir especialidades
INSERT INTO public.specialties (name, description, icon) VALUES
('Clínico Geral', 'Atendimento médico geral para diversas condições', '🩺'),
('Cardiologia', 'Especialista em coração e sistema cardiovascular', '❤️'),
('Dermatologia', 'Especialista em pele, cabelo e unhas', '🧴'),
('Pediatria', 'Especialista em saúde infantil', '👶'),
('Psiquiatria', 'Especialista em saúde mental', '🧠'),
('Ortopedia', 'Especialista em ossos, músculos e articulações', '🦴'),
('Ginecologia', 'Especialista em saúde da mulher', '👩'),
('Oftalmologia', 'Especialista em visão e saúde ocular', '👁️'),
('Nutrição', 'Especialista em alimentação e nutrição', '🥗'),
('Endocrinologia', 'Especialista em hormônios e metabolismo', '⚗️')
ON CONFLICT (name) DO NOTHING;

-- Criar admin padrão (atualizar com email real)
-- Primeiro criar o perfil
DO $$
DECLARE
    v_admin_profile_id UUID;
BEGIN
    -- Inserir perfil admin se não existir
    INSERT INTO public.profiles (id, email, full_name, phone)
    VALUES (
        gen_random_uuid(),
        'admin@otymasaude.com.br',
        'Administrador Principal',
        '(11) 99999-9999'
    )
    ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
    RETURNING id INTO v_admin_profile_id;
    
    -- Criar role de super_admin
    INSERT INTO public.user_roles (profile_id, role, permissions)
    VALUES (
        v_admin_profile_id,
        'super_admin',
        '["all"]'::jsonb
    )
    ON CONFLICT (profile_id, role) DO NOTHING;
END $$;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de médicos disponíveis com estatísticas
CREATE OR REPLACE VIEW doctors_available AS
SELECT 
    d.*,
    s.name as specialty_name,
    s.icon as specialty_icon,
    p.full_name,
    p.email,
    p.phone
FROM doctors d
LEFT JOIN specialties s ON d.specialty_id = s.id
LEFT JOIN profiles p ON d.profile_id = p.id
WHERE d.approval_status = 'approved' AND d.is_available = true;

-- View de consultas com detalhes
CREATE OR REPLACE VIEW consultations_detailed AS
SELECT 
    cr.*,
    p.full_name as doctor_name,
    p.email as doctor_email,
    d.crm as doctor_crm,
    d.whatsapp_number as doctor_whatsapp,
    s.name as specialty_name
FROM consultation_requests cr
LEFT JOIN doctors d ON cr.doctor_id::UUID = d.id
LEFT JOIN profiles p ON d.profile_id = p.id
LEFT JOIN specialties s ON cr.specialty = s.name;

-- View de histórico de cascata com detalhes
CREATE OR REPLACE VIEW cascade_history_detailed AS
SELECT 
    ch.*,
    p.full_name as doctor_name,
    p.email as doctor_email,
    d.crm as doctor_crm,
    d.whatsapp_number as doctor_whatsapp,
    cr.patient_name,
    cr.status as consultation_status
FROM cascade_history ch
LEFT JOIN doctors d ON ch.doctor_id = d.id
LEFT JOIN profiles p ON d.profile_id = p.id
LEFT JOIN consultation_requests cr ON ch.consultation_id = cr.id;

COMMENT ON TABLE public.doctors IS 'Tabela de médicos cadastrados no sistema';
COMMENT ON TABLE public.cascade_history IS 'Histórico de notificações do sistema de cascata tipo Uber';
COMMENT ON TABLE public.cascade_settings IS 'Configurações globais do sistema de cascata';
COMMENT ON FUNCTION start_cascade IS 'Inicia o processo de cascata para uma consulta, notificando médicos disponíveis';
COMMENT ON FUNCTION accept_consultation IS 'Permite que um médico aceite uma consulta';
COMMENT ON FUNCTION reject_consultation IS 'Permite que um médico rejeite uma consulta';
