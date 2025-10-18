// Este módulo será implementado futuramente quando as tabelas cascade forem criadas
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

export async function startCascade(consultationId: number): Promise<CascadeResult> {
  return {
    success: false,
    consultation_id: consultationId,
    doctors_notified: 0,
    round_number: 0,
    error: 'Função não implementada'
  };
}

export async function acceptConsultation(
  consultationId: number,
  doctorId: string
): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Função não implementada'
  };
}

export async function rejectConsultation(
  consultationId: number,
  doctorId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: 'Função não implementada'
  };
}

export async function getCascadeHistory(consultationId: number): Promise<CascadeHistory[]> {
  return [];
}

export async function getCascadeSettings(): Promise<CascadeSettings | null> {
  return null;
}

export async function updateCascadeSettings(
  settings: Partial<CascadeSettings>
): Promise<boolean> {
  return false;
}

export async function checkAndStartNextRound(consultationId: number): Promise<CascadeResult | null> {
  return null;
}

export async function getCascadeStats() {
  return null;
}
