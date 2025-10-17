import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QueueStatus {
  consultationId: string;
  doctorId?: string;
  doctorName?: string;
  timeoutAt?: string;
  status: 'waiting' | 'calling' | 'accepted' | 'completed';
  callAttempts: number;
}

export function useConsultationQueue(consultationId: string | null) {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const callNextDoctor = useCallback(async () => {
    if (!consultationId) return;
    
    try {
      const { data, error } = await supabase.rpc('call_next_doctor', { 
        p_consultation_id: consultationId 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const result = data[0];
        setQueueStatus({
          consultationId,
          doctorId: result.doctor_id,
          doctorName: result.doctor_name,
          timeoutAt: result.timeout_at,
          status: 'calling',
          callAttempts: 0
        });
        toast.info(`Chamando Dr(a). ${result.doctor_name}...`);
      } else {
        toast.error('Nenhum médico disponível no momento');
        setQueueStatus({ 
          consultationId, 
          status: 'waiting', 
          callAttempts: 0 
        });
      }
    } catch (error: any) {
      console.error('Erro ao chamar médico:', error);
      toast.error('Erro ao chamar médico');
    }
  }, [consultationId]);

  const handleTimeout = useCallback(async () => {
    if (!consultationId) return;
    
    try {
      await supabase.rpc('reject_or_timeout_consultation', { 
        p_consultation_id: consultationId 
      });
      toast.warning('Médico não respondeu, chamando próximo...');
      setTimeout(() => callNextDoctor(), 1000);
    } catch (error) {
      console.error('Erro ao processar timeout:', error);
    }
  }, [consultationId, callNextDoctor]);

  useEffect(() => {
    if (!queueStatus?.timeoutAt) return;
    
    const checkTimeout = setInterval(() => {
      const now = new Date();
      const timeout = new Date(queueStatus.timeoutAt!);
      const remaining = Math.max(0, Math.floor((timeout.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        handleTimeout();
      }
    }, 1000);
    
    return () => clearInterval(checkTimeout);
  }, [queueStatus?.timeoutAt, handleTimeout]);

  useEffect(() => {
    if (!consultationId) return;
    
    const channel = supabase
      .channel(`consultation-${consultationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultations',
        filter: `id=eq.${consultationId}`
      }, (payload) => {
        const consultation = payload.new;
        
        if (consultation.status === 'in_progress') {
          setQueueStatus({
            consultationId,
            status: 'accepted',
            callAttempts: consultation.call_attempts || 0
          });
          toast.success('Consulta aceita por um médico!');
        } else if (consultation.status === 'completed') {
          setQueueStatus({
            consultationId,
            status: 'completed',
            callAttempts: consultation.call_attempts || 0
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId]);

  return { queueStatus, timeRemaining, callNextDoctor, handleTimeout };
}

export function useDoctorCallNotification() {
  const [pendingCall, setPendingCall] = useState<any>(null);

  useEffect(() => {
    const checkCalls = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (!doctor) return;
      
      const { data: consultation } = await supabase
        .from('consultations')
        .select('*, profiles!inner(*)')
        .eq('doctor_id', doctor.id)
        .eq('status', 'pending')
        .not('call_timeout_at', 'is', null)
        .maybeSingle();
      
      setPendingCall(consultation || null);
    };
    
    const interval = setInterval(checkCalls, 2000);
    checkCalls();
    
    return () => clearInterval(interval);
  }, []);

  const acceptCall = async (consultationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;
      
      const { data, error } = await supabase.rpc('accept_consultation', {
        p_consultation_id: consultationId,
        p_doctor_user_id: session.user.id
      });
      
      if (error) throw error;
      
      if (data) {
        toast.success('Consulta aceita!');
        setPendingCall(null);
        return true;
      } else {
        toast.error('Esta consulta já foi aceita por outro médico');
        setPendingCall(null);
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao aceitar consulta:', error);
      toast.error('Erro ao aceitar consulta');
      return false;
    }
  };

  const rejectCall = async (consultationId: string) => {
    try {
      await supabase.rpc('reject_or_timeout_consultation', {
        p_consultation_id: consultationId
      });
      setPendingCall(null);
      toast.info('Consulta recusada');
      return true;
    } catch (error) {
      console.error('Erro ao recusar consulta:', error);
      return false;
    }
  };

  return { pendingCall, acceptCall, rejectCall };
}
