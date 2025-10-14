const API_BASE = 'http://localhost:5000/api';

export const api = {
  // Autenticação
  loginMedico: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/medico/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  loginAdmin: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  // Médico
  toggleAvailability: async (doctorId: number, isAvailable: boolean) => {
    const response = await fetch(`${API_BASE}/doctor/toggle-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_id: doctorId, is_available: isAvailable })
    });
    return response.json();
  },

  getConsultations: async (doctorId: number) => {
    const response = await fetch(`${API_BASE}/doctor/consultations?doctor_id=${doctorId}`);
    return response.json();
  },

  startConsultation: async (id: number) => {
    const response = await fetch(`${API_BASE}/consultas/${id}/iniciar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  completeConsultation: async (id: number) => {
    const response = await fetch(`${API_BASE}/consultas/${id}/concluir`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  getDoctorProfile: async (id: number) => {
    const response = await fetch(`${API_BASE}/doctor/profile/${id}`);
    return response.json();
  },

  updateProfile: async (id: number, data: any) => {
    const response = await fetch(`${API_BASE}/doctor/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  uploadPhoto: async (doctorId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doctor_id', doctorId.toString());
    const response = await fetch(`${API_BASE}/doctor/upload-photo`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  },

  // Admin
  getDoctors: async (status: string = 'all') => {
    const response = await fetch(`${API_BASE}/admin/doctors?status=${status}`);
    return response.json();
  },

  approveDoctor: async (id: number) => {
    const response = await fetch(`${API_BASE}/admin/doctors/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  rejectDoctor: async (id: number) => {
    const response = await fetch(`${API_BASE}/admin/doctors/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
  },

  getAllConsultations: async (status: string = 'all') => {
    const response = await fetch(`${API_BASE}/admin/consultations?status=${status}`);
    return response.json();
  },

  // Especialidades
  getSpecialties: async () => {
    const response = await fetch(`${API_BASE}/especialidades`);
    return response.json();
  },

  // Consultas
  createConsultation: async (data: any) => {
    const response = await fetch(`${API_BASE}/consultas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  getPendingConsultations: async () => {
    const response = await fetch(`${API_BASE}/consultas/pendentes`);
    return response.json();
  }
};
