import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Activity, CheckCircle, Calendar, Phone, Stethoscope } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0 });

  useEffect(() => {
    const session = localStorage.getItem('doctorSession');
    if (!session) {
      navigate('/medico/login');
      return;
    }

    const data = JSON.parse(session);
    setDoctorData(data);
    setIsAvailable(data.is_available || false);
    loadConsultations(data.id);
  }, [navigate]);

  const loadConsultations = async (doctorId: number) => {
    try {
      const result = await api.getConsultations(doctorId);
      if (result.success) {
        setConsultations(result.data);
        calculateStats(result.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    setStats({
      pending: data.filter(c => c.status === 'pending').length,
      active: data.filter(c => c.status === 'active').length,
      completed: data.filter(c => c.status === 'completed').length
    });
  };

  const handleToggleAvailability = async () => {
    try {
      const newStatus = !isAvailable;
      const result = await api.toggleAvailability(doctorData.id, newStatus);
      
      if (result.success) {
        setIsAvailable(newStatus);
        const updatedSession = { ...doctorData, is_available: newStatus };
        localStorage.setItem('doctorSession', JSON.stringify(updatedSession));
        toast.success(newStatus ? 'Você está disponível!' : 'Você está indisponível');
      }
    } catch (error) {
      toast.error('Erro ao atualizar disponibilidade');
    }
  };

  const handleStartConsultation = async (id: number) => {
    try {
      const result = await api.startConsultation(id);
      if (result.success) {
        toast.success('Consulta iniciada!');
        loadConsultations(doctorData.id);
      }
    } catch (error) {
      toast.error('Erro ao iniciar consulta');
    }
  };

  const handleCompleteConsultation = async (id: number) => {
    try {
      const result = await api.completeConsultation(id);
      if (result.success) {
        toast.success('Consulta concluída!');
        loadConsultations(doctorData.id);
      }
    } catch (error) {
      toast.error('Erro ao concluir consulta');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorSession');
    navigate('/medico/login');
  };

  if (loading || !doctorData) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader title="👨‍⚕️ Painel Médico" role="medico" onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Status Card */}
        <Card className="bg-gradient-primary text-white shadow-xl hover:shadow-2xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${isAvailable ? 'bg-medical-green' : 'bg-medical-red'} animate-pulse`} />
                <div>
                  <h2 className="text-2xl font-bold">
                    Você está {isAvailable ? 'ONLINE' : 'OFFLINE'}
                  </h2>
                  <p className="text-white/80">
                    {isAvailable ? 'Disponível para atendimentos' : 'Indisponível no momento'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggleAvailability}
                variant="outline"
                className="bg-white text-primary hover:bg-white/90 font-semibold"
              >
                {isAvailable ? 'Ficar Indisponível' : 'Ficar Disponível'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-medical-orange/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-medical-orange" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Aguardando atendimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-medical-blue/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-medical-blue" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Consultas ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-medical-green/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-medical-green" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Atendimentos finalizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Minhas Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-600">Nenhuma consulta disponível</p>
                <p className="text-sm text-gray-500 mt-2">
                  Quando houver novas consultas atribuídas a você, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => {
                  const statusColors = {
                    pending: 'bg-medical-orange/10 text-medical-orange',
                    active: 'bg-medical-blue/10 text-medical-blue',
                    completed: 'bg-medical-green/10 text-medical-green'
                  };

                  const statusLabels = {
                    pending: 'Pendente',
                    active: 'Em Atendimento',
                    completed: 'Concluída'
                  };

                  return (
                    <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                            {consultation.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-semibold text-gray-900">{consultation.patient_name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[consultation.status as keyof typeof statusColors]}`}>
                                {statusLabels[consultation.status as keyof typeof statusLabels]}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                {consultation.patient_phone}
                              </p>
                              <p className="flex items-center gap-2 text-sm text-gray-600">
                                <Stethoscope className="w-4 h-4 flex-shrink-0" />
                                {consultation.specialty_name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {consultation.status === 'pending' && (
                            <Button
                              onClick={() => handleStartConsultation(consultation.id)}
                              className="bg-medical-blue hover:bg-medical-blue/90"
                              size="sm"
                            >
                              Iniciar
                            </Button>
                          )}
                          {consultation.status === 'active' && (
                            <Button
                              onClick={() => handleCompleteConsultation(consultation.id)}
                              className="bg-medical-green hover:bg-medical-green/90"
                              size="sm"
                            >
                              Concluir
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
