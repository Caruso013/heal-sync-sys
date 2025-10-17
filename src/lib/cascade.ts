/**
 * 🎯 Sistema de Cascata Tipo Uber
 * Gerencia a distribuição automática de consultas para médicos
 */

import { supabase } from '@/integrations/supabase/client';

export interface CascadeResult {
  success: boolean;
  consultation_id: number;
  doctors_notified: number;
  round_number: number;
  message?: string;
  error?: string;
}

export interface CascadeHistory {
  id: string;
  consultation_id: number;
  doctor_id: string;
  round_number: number;
  notified_at: string;
  notification_type: 'whatsapp' | 'email' | 'push' | 'sms';
  response: 'pending' | 'accepted' | 'rejected' | 'expired';
  responded_at?: string;
  response_time_seconds?: number;
  rejection_reason?: string;
  doctor_name?: string;
  doctor_email?: string;
  doctor_crm?: string;
  doctor_whatsapp?: string;
}

export interface CascadeSettings {
  timeout_per_round_minutes: number;
  max_rounds: number;
  doctors_per_round: number;
  prioritize_by: 'availability' | 'rating' | 'response_time' | 'specialty_match' | 'random';
  enable_whatsapp: boolean;
  enable_email: boolean;
  enable_push: boolean;
  whatsapp_template: string;
}

/**
 * Iniciar cascata para uma consulta
 */
export async function startCascade(consultationId: number): Promise<CascadeResult> {
  try {
    // Chamar função SQL do Supabase
    const { data, error } = await supabase
      .rpc('start_cascade', { p_consultation_id: consultationId });

    if (error) {
      console.error('Erro ao iniciar cascata:', error);
      return {
        success: false,
        consultation_id: consultationId,
        doctors_notified: 0,
        round_number: 0,
        error: error.message
      };
    }

    // Dados retornados pela função
    const result = Array.isArray(data) ? data[0] : data;

    if (!result || result.doctors_notified === 0) {
      return {
        success: false,
        consultation_id: consultationId,
        doctors_notified: 0,
        round_number: result?.round_number || 0,
        message: 'Nenhum médico disponível encontrado para esta especialidade'
      };
    }

    // Enviar notificações WhatsApp
    await sendCascadeNotifications(consultationId, result.round_number);

    return {
      success: true,
      consultation_id: consultationId,
      doctors_notified: result.doctors_notified,
      round_number: result.round_number,
      message: `${result.doctors_notified} médico(s) notificado(s) na rodada ${result.round_number}`
    };

  } catch (error: any) {
    console.error('Erro ao iniciar cascata:', error);
    return {
      success: false,
      consultation_id: consultationId,
      doctors_notified: 0,
      round_number: 0,
      error: error.message || 'Erro desconhecido'
    };
  }
}

/**
 * Médico aceita a consulta
 */
export async function acceptConsultation(
  consultationId: number,
  doctorId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .rpc('accept_consultation', {
        p_consultation_id: consultationId,
        p_doctor_id: doctorId
      });

    if (error) {
      console.error('Erro ao aceitar consulta:', error);
      return {
        success: false,
        message: 'Erro ao aceitar consulta: ' + error.message
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Esta consulta já foi aceita por outro médico'
      };
    }

    // Criar notificação para o atendente
    await createNotification({
      consultation_id: consultationId,
      type: 'consultation_accepted',
      message: `Consulta #${consultationId} foi aceita por um médico`
    });

    return {
      success: true,
      message: 'Consulta aceita com sucesso! Você pode iniciar o atendimento.'
    };

  } catch (error: any) {
    console.error('Erro ao aceitar consulta:', error);
    return {
      success: false,
      message: 'Erro ao aceitar consulta: ' + error.message
    };
  }
}

/**
 * Médico rejeita a consulta
 */
export async function rejectConsultation(
  consultationId: number,
  doctorId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .rpc('reject_consultation', {
        p_consultation_id: consultationId,
        p_doctor_id: doctorId,
        p_rejection_reason: reason || 'Não especificado'
      });

    if (error) {
      console.error('Erro ao rejeitar consulta:', error);
      return {
        success: false,
        message: 'Erro ao rejeitar consulta: ' + error.message
      };
    }

    return {
      success: true,
      message: 'Consulta rejeitada. Ela será oferecida a outros médicos.'
    };

  } catch (error: any) {
    console.error('Erro ao rejeitar consulta:', error);
    return {
      success: false,
      message: 'Erro ao rejeitar consulta: ' + error.message
    };
  }
}

/**
 * Buscar histórico de cascata de uma consulta
 */
export async function getCascadeHistory(consultationId: number): Promise<CascadeHistory[]> {
  try {
    const { data, error } = await supabase
      .from('cascade_history_detailed')
      .select('*')
      .eq('consultation_id', consultationId)
      .order('round_number', { ascending: true })
      .order('notified_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return [];
  }
}

/**
 * Buscar configurações da cascata
 */
export async function getCascadeSettings(): Promise<CascadeSettings | null> {
  try {
    const { data, error } = await supabase
      .from('cascade_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return null;
    }

    return data;

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }
}

/**
 * Atualizar configurações da cascata
 */
export async function updateCascadeSettings(
  settings: Partial<CascadeSettings>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cascade_settings')
      .update(settings)
      .limit(1);

    if (error) {
      console.error('Erro ao atualizar configurações:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return false;
  }
}

/**
 * Verificar se deve iniciar próxima rodada
 */
export async function checkAndStartNextRound(consultationId: number): Promise<CascadeResult | null> {
  try {
    // Buscar consulta atual
    const { data: consultation, error: consultationError } = await supabase
      .from('consultation_requests')
      .select('*, cascade_round, cascade_started_at, status')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return null;
    }

    // Se já foi atribuída, não fazer nada
    if (consultation.status === 'assigned' || consultation.doctor_id) {
      return null;
    }

    // Buscar configurações
    const settings = await getCascadeSettings();
    if (!settings) return null;

    // Calcular tempo desde início da rodada
    const cascadeStartTime = new Date(consultation.cascade_started_at).getTime();
    const now = Date.now();
    const minutesElapsed = (now - cascadeStartTime) / (1000 * 60);

    // Se ainda não passou o timeout, aguardar
    if (minutesElapsed < settings.timeout_per_round_minutes) {
      return null;
    }

    // Verificar se atingiu máximo de rodadas
    if (consultation.cascade_round >= settings.max_rounds) {
      // Marcar como não atendida
      await supabase
        .from('consultation_requests')
        .update({ status: 'unattended' })
        .eq('id', consultationId);

      await createNotification({
        consultation_id: consultationId,
        type: 'consultation_unattended',
        message: `Consulta #${consultationId} não foi aceita após ${settings.max_rounds} rodadas`
      });

      return null;
    }

    // Iniciar próxima rodada
    return await startCascade(consultationId);

  } catch (error) {
    console.error('Erro ao verificar próxima rodada:', error);
    return null;
  }
}

/**
 * Enviar notificações WhatsApp (placeholder - integrar com API real)
 */
async function sendCascadeNotifications(consultationId: number, roundNumber: number): Promise<void> {
  try {
    // Buscar médicos notificados nesta rodada
    const { data: history } = await supabase
      .from('cascade_history_detailed')
      .select('*')
      .eq('consultation_id', consultationId)
      .eq('round_number', roundNumber)
      .eq('response', 'pending');

    if (!history || history.length === 0) return;

    // Buscar dados da consulta
    const { data: consultation } = await supabase
      .from('consultations_detailed')
      .select('*')
      .eq('id', consultationId)
      .single();

    if (!consultation) return;

    // Para cada médico, enviar WhatsApp
    for (const entry of history) {
      if (entry.doctor_whatsapp) {
        // TODO: Integrar com API de WhatsApp real (Twilio, Evolution, etc)
        console.log('📱 Enviando WhatsApp para:', entry.doctor_whatsapp);
        console.log('Mensagem:', formatWhatsAppMessage(consultation, entry));

        // Marcar como enviado
        await supabase
          .from('consultation_requests')
          .update({
            whatsapp_sent: true,
            whatsapp_sent_at: new Date().toISOString()
          })
          .eq('id', consultationId);
      }
    }

  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
  }
}

/**
 * Formatar mensagem de WhatsApp
 */
function formatWhatsAppMessage(consultation: any, doctor: any): string {
  const baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:8080';
  const acceptUrl = `${baseUrl}/consulta/${consultation.id}/aceitar?doctor=${doctor.doctor_id}`;
  const rejectUrl = `${baseUrl}/consulta/${consultation.id}/recusar?doctor=${doctor.doctor_id}`;

  return `
🏥 *Nova Consulta Disponível - Rodada ${doctor.round_number}*

👤 *Paciente:* ${consultation.patient_name}
📞 *Telefone:* ${consultation.patient_phone}
🩺 *Especialidade:* ${consultation.specialty}
⚠️ *Urgência:* ${consultation.urgency.toUpperCase()}

📝 *Descrição:*
${consultation.description || 'Não informada'}

⏰ *Tempo para responder:* 5 minutos

✅ Aceitar: ${acceptUrl}
❌ Recusar: ${rejectUrl}

_Sistema de Teleconsulta - Otyma Saúde_
  `.trim();
}

/**
 * Criar notificação no sistema
 */
async function createNotification(params: {
  consultation_id: number;
  type: string;
  message: string;
}): Promise<void> {
  try {
    // Buscar admins e atendentes para notificar
    const { data: roles } = await supabase
      .from('user_roles')
      .select('profile_id')
      .in('role', ['super_admin', 'admin', 'atendente']);

    if (!roles) return;

    // Criar notificação para cada um
    const notifications = roles.map(role => ({
      recipient_id: role.profile_id,
      title: 'Atualização de Consulta',
      message: params.message,
      type: 'consultation',
      related_entity_type: 'consultation',
      related_entity_id: params.consultation_id.toString()
    }));

    await supabase.from('notifications').insert(notifications);

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
  }
}

/**
 * Estatísticas da cascata
 */
export async function getCascadeStats() {
  try {
    const { data, error } = await supabase
      .from('cascade_history')
      .select('response, round_number, response_time_seconds');

    if (error || !data) {
      return null;
    }

    const stats = {
      total_notifications: data.length,
      total_accepted: data.filter(d => d.response === 'accepted').length,
      total_rejected: data.filter(d => d.response === 'rejected').length,
      total_expired: data.filter(d => d.response === 'expired').length,
      average_response_time: 0,
      acceptance_rate: 0,
      rejection_rate: 0,
      by_round: {} as Record<number, any>
    };

    // Calcular tempo médio de resposta
    const responseTimes = data
      .filter(d => d.response_time_seconds)
      .map(d => d.response_time_seconds!);
    
    if (responseTimes.length > 0) {
      stats.average_response_time = 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    // Taxas
    stats.acceptance_rate = (stats.total_accepted / stats.total_notifications) * 100;
    stats.rejection_rate = (stats.total_rejected / stats.total_notifications) * 100;

    // Estatísticas por rodada
    for (const entry of data) {
      if (!stats.by_round[entry.round_number]) {
        stats.by_round[entry.round_number] = {
          notified: 0,
          accepted: 0,
          rejected: 0,
          expired: 0
        };
      }
      
      stats.by_round[entry.round_number].notified++;
      if (entry.response === 'accepted') stats.by_round[entry.round_number].accepted++;
      if (entry.response === 'rejected') stats.by_round[entry.round_number].rejected++;
      if (entry.response === 'expired') stats.by_round[entry.round_number].expired++;
    }

    return stats;

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}
