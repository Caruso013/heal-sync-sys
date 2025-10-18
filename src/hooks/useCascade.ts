// Este hook será implementado futuramente quando as tabelas cascade forem criadas
export function useCascade() {
  return {
    history: [],
    loading: false,
    error: null,
    currentRound: 0,
    status: 'idle' as const,
    start: async () => ({ success: false, consultation_id: 0, doctors_notified: 0, round_number: 0 }),
    accept: async () => ({ success: false, message: '' }),
    reject: async () => ({ success: false, message: '' }),
    reload: async () => {},
    checkNextRound: async () => null
  };
}

export function useActiveCascades() {
  return {
    cascades: [],
    loading: false,
    reload: async () => {}
  };
}

export function useCascadeStats() {
  return {
    stats: null,
    loading: false,
    reload: async () => {}
  };
}
