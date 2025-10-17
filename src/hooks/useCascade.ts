/**
 * 🎯 Hook para gerenciar sistema de cascata
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  startCascade,
  acceptConsultation,
  rejectConsultation,
  getCascadeHistory,
  checkAndStartNextRound,
  type CascadeResult,
  type CascadeHistory
} from '@/lib/cascade';

export function useCascade(consultationId: number | null) {
  const [history, setHistory] = useState<CascadeHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'expired'>('idle');

  // Carregar histórico
  const loadHistory = useCallback(async () => {
    if (!consultationId) return;

    try {
      setLoading(true);
      const data = await getCascadeHistory(consultationId);
      setHistory(data);

      // Calcular rodada atual
      const maxRound = Math.max(...data.map(h => h.round_number), 0);
      setCurrentRound(maxRound);

      // Determinar status
      const hasAccepted = data.some(h => h.response === 'accepted');
      const allExpired = data.length > 0 && data.every(h => h.response === 'expired' || h.response === 'rejected');
      
      if (hasAccepted) {
        setStatus('completed');
      } else if (allExpired) {
        setStatus('expired');
      } else {
        setStatus('running');
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [consultationId]);

  // Iniciar cascata
  const start = useCallback(async (): Promise<CascadeResult> => {
    if (!consultationId) {
      return {
        success: false,
        consultation_id: 0,
        doctors_notified: 0,
        round_number: 0,
        error: 'ID da consulta não fornecido'
      };
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await startCascade(consultationId);
      
      if (result.success) {
        setStatus('running');
        await loadHistory();
      } else {
        setError(result.error || result.message || 'Erro ao iniciar cascata');
      }

      return result;
    } catch (err: any) {
      const error = err.message || 'Erro ao iniciar cascata';
      setError(error);
      return {
        success: false,
        consultation_id: consultationId,
        doctors_notified: 0,
        round_number: 0,
        error
      };
    } finally {
      setLoading(false);
    }
  }, [consultationId, loadHistory]);

  // Aceitar consulta
  const accept = useCallback(async (doctorId: string) => {
    if (!consultationId) return { success: false, message: 'ID da consulta não fornecido' };

    try {
      setLoading(true);
      const result = await acceptConsultation(consultationId, doctorId);
      
      if (result.success) {
        setStatus('completed');
        await loadHistory();
      }

      return result;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro ao aceitar consulta'
      };
    } finally {
      setLoading(false);
    }
  }, [consultationId, loadHistory]);

  // Rejeitar consulta
  const reject = useCallback(async (doctorId: string, reason?: string) => {
    if (!consultationId) return { success: false, message: 'ID da consulta não fornecido' };

    try {
      setLoading(true);
      const result = await rejectConsultation(consultationId, doctorId, reason);
      
      if (result.success) {
        await loadHistory();
      }

      return result;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Erro ao rejeitar consulta'
      };
    } finally {
      setLoading(false);
    }
  }, [consultationId, loadHistory]);

  // Verificar próxima rodada
  const checkNextRound = useCallback(async () => {
    if (!consultationId) return null;

    try {
      const result = await checkAndStartNextRound(consultationId);
      if (result?.success) {
        await loadHistory();
      }
      return result;
    } catch (err) {
      console.error('Erro ao verificar próxima rodada:', err);
      return null;
    }
  }, [consultationId, loadHistory]);

  // Carregar histórico ao montar
  useEffect(() => {
    if (consultationId) {
      loadHistory();
    }
  }, [consultationId, loadHistory]);

  // Listener em tempo real
  useEffect(() => {
    if (!consultationId) return;

    const channel = supabase
      .channel(`cascade:${consultationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cascade_history',
          filter: `consultation_id=eq.${consultationId}`
        },
        (payload) => {
          console.log('Atualização em tempo real:', payload);
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, loadHistory]);

  // Auto-verificar próxima rodada (a cada 30 segundos)
  useEffect(() => {
    if (!consultationId || status !== 'running') return;

    const interval = setInterval(() => {
      checkNextRound();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [consultationId, status, checkNextRound]);

  return {
    history,
    loading,
    error,
    currentRound,
    status,
    start,
    accept,
    reject,
    reload: loadHistory,
    checkNextRound
  };
}

/**
 * 🔔 Hook para monitorar todas as cascatas ativas
 */
export function useActiveCascades() {
  const [cascades, setCascades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActive = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('consultations_detailed')
        .select('*')
        .eq('status', 'pending')
        .not('cascade_started_at', 'is', null)
        .order('cascade_started_at', { ascending: false });

      if (error) throw error;

      setCascades(data || []);
    } catch (err) {
      console.error('Erro ao carregar cascatas ativas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActive();
  }, [loadActive]);

  // Listener em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('active-cascades')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'consultation_requests'
        },
        () => {
          loadActive();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadActive]);

  return {
    cascades,
    loading,
    reload: loadActive
  };
}

/**
 * 📊 Hook para estatísticas de cascata
 */
export function useCascadeStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar estatísticas gerais
      const { data, error } = await supabase
        .from('cascade_history')
        .select('response, round_number, response_time_seconds');

      if (error) throw error;

      // Calcular estatísticas
      const total = data.length;
      const accepted = data.filter(d => d.response === 'accepted').length;
      const rejected = data.filter(d => d.response === 'rejected').length;
      const expired = data.filter(d => d.response === 'expired').length;
      const pending = data.filter(d => d.response === 'pending').length;

      const responseTimes = data
        .filter(d => d.response_time_seconds)
        .map(d => d.response_time_seconds);

      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      setStats({
        total,
        accepted,
        rejected,
        expired,
        pending,
        acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
        rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime),
        avgResponseTimeFormatted: formatSeconds(avgResponseTime)
      });

    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    reload: loadStats
  };
}

// Utilitário
function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}min ${remainingSeconds}s`;
}
