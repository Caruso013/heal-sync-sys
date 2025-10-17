import { supabase } from './client';
import type { Database } from './types';

export const actions = {
  // Create notifications for a consultation cascade.
  // doctors: array of doctor ids in priority order
  createCascadeNotifications: async (consultationId: string, doctors: string[]) => {
    try {
      const payload = doctors.map((doctorId, idx) => ({
        consultation_id: consultationId,
        doctor_id: doctorId,
        priority_order: idx + 1,
        sent_at: new Date().toISOString()
      }));

      const { data, error } = await supabase.from('notifications').insert(payload).select();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Call RPC to accept a consultation atomically
  acceptConsultationRpc: async (consultationId: string, doctorId: string) => {
    const { data, error } = await supabase.rpc('accept_consultation', { _consultation_id: consultationId, _doctor_id: doctorId });
    return { data, error };
  },

  // Mark notification responded (fallback)
  markNotificationResponded: async (notificationId: string) => {
    const { data, error } = await supabase.from('notifications').update({ responded_at: new Date().toISOString() }).eq('id', notificationId).select().single();
    return { data, error };
  }
};
