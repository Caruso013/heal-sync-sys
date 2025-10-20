import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DashboardHeader from "@/components/DashboardHeader";
import CallNotification from "@/components/CallNotification";
import { toast } from "sonner";
import { Clock, User, FileText, CheckCircle2, PlayCircle, Activity, AlertCircle } from "lucide-react";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (doctor) {
      const interval = setInterval(() => loadConsultations(doctor.id), 5000);
      return () => clearInterval(interval);
    }
  }, [doctor]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (!roles || roles[0]?.role !== 'medico') {
      navigate('/auth');
      return;
    }

    loadDoctorData(session.user.id);
  };

  const loadDoctorData = async (userId: string) => {
    try {
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('*, profiles(*)')
        .eq('user_id', userId)
        .single();

      if (doctorError) throw doctorError;

      if (doctorData.status !== 'approved') {
        toast.error("Sua conta ainda não foi aprovada pelo administrador");
        navigate('/auth');
        return;
      }

      setDoctor(doctorData);
      setIsAvailable(doctorData.is_available);
      loadConsultations(doctorData.id);
    } catch (error: any) {
      toast.error("Erro ao carregar dados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadConsultations = async (doctorId: string) => {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('doctor_id', doctorId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConsultations(data);
    }
  };

  const handleToggleAvailability = async (checked: boolean) => {
    if (!doctor) return;

    const hasActiveConsultation = consultations.some(c => c.status === 'in_progress');
    
    if (!checked && hasActiveConsultation) {
      toast.error("Você não pode ficar indisponível com consulta em andamento!");
      return;
    }

    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_available: checked })
        .eq('user_id', doctor.user_id);

      if (error) throw error;

      setIsAvailable(checked);
      toast.success(checked ? "Você está disponível para consultas!" : "Você está indisponível");
    } catch (error: any) {
      console.error("Erro ao atualizar disponibilidade:", error);
      toast.error("Erro ao atualizar disponibilidade: " + error.message);
    }
  };

  const handleStartConsultation = async (consultationId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', consultationId);

    if (error) {
      toast.error("Erro ao iniciar consulta");
    } else {
      toast.success("Consulta iniciada!");
      loadConsultations(doctor.id);
    }
  };

  const handleCompleteConsultation = async (consultationId: string) => {
    const { error } = await supabase
      .from('consultations')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', consultationId);

    if (error) {
      toast.error("Erro ao finalizar consulta");
    } else {
      toast.success("Consulta finalizada!");
      loadConsultations(doctor.id);
    }
  };

  const handleLogout = async () => {
    const hasActiveConsultation = consultations.some(c => c.status === 'in_progress');
    
    if (hasActiveConsultation) {
      toast.error("Você não pode sair com consulta em andamento!");
      return;
    }
    
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getConsultationTypeBadge = (type: string) => {
    return type === 'teleconsulta' ? (
      <Badge className="bg-blue-500">Teleconsulta</Badge>
    ) : (
      <Badge className="bg-green-500">Renovação de Receita</Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-medical-orange/10 text-medical-orange">Pendente</Badge>,
      in_progress: <Badge className="bg-medical-blue">Em Andamento</Badge>,
      completed: <Badge className="bg-medical-green">Concluída</Badge>
    };
    return badges[status as keyof typeof badges];
  };

  const pendingCount = consultations.filter(c => c.status === 'pending').length;
  const inProgressCount = consultations.filter(c => c.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-gradient-bg">
      <CallNotification />
      
      <DashboardHeader 
        title="👨‍⚕️ Painel Médico"
        role="medico"
        onLogout={handleLogout}
      />

      {!isAvailable && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-3">
          <div className="container mx-auto px-6 flex items-center justify-center gap-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Você está indisponível. Ative sua disponibilidade para receber consultas.</p>
          </div>
        </div>
      )}

      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Status Card */}
        <Card className="bg-gradient-primary text-white shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${isAvailable ? 'bg-medical-green' : 'bg-medical-red'} animate-pulse`} />
                <div>
                  <h2 className="text-2xl font-bold">
                    Dr(a). {doctor?.profiles?.full_name || 'Médico'}
                  </h2>
                  <p className="text-white/80">
                    {isAvailable ? 'Disponível para atendimentos' : 'Indisponível no momento'}
                  </p>
                </div>
              </div>
              <Switch
                id="availability"
                checked={isAvailable}
                onCheckedChange={handleToggleAvailability}
                className="data-[state=checked]:bg-medical-green"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-medical-orange/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-medical-orange" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
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
                  <p className="text-3xl font-bold">{inProgressCount}</p>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{doctor?.specialty}</p>
                  <p className="text-sm text-muted-foreground">Especialidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consultations List */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Minhas Consultas</CardTitle>
          </CardHeader>
          <CardContent>
            {consultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-600">Nenhuma consulta pendente</p>
                <p className="text-sm text-gray-500 mt-2">
                  Quando houver novas consultas, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultations.map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{consultation.patient_name}</span>
                          {getStatusBadge(consultation.status)}
                          {getConsultationTypeBadge(consultation.consultation_type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {consultation.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Criado: {new Date(consultation.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {consultation.status === 'pending' && (
                          <Button
                            onClick={() => handleStartConsultation(consultation.id)}
                            className="bg-medical-blue hover:bg-medical-blue/90"
                            size="sm"
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Iniciar
                          </Button>
                        )}
                        {consultation.status === 'in_progress' && (
                          <Button
                            onClick={() => handleCompleteConsultation(consultation.id)}
                            className="bg-medical-green hover:bg-medical-green/90"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;