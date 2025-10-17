import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Calendar, User, FileText, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Historico() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
  const [consultationHistory, setConsultationHistory] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterConsultations();
  }, [consultations, searchTerm, statusFilter]);

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
      const { data: doctorData, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setDoctor(doctorData);
      loadConsultations(doctorData.id);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadConsultations = async (doctorId: string) => {
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConsultations(data);
    }
  };

  const filterConsultations = () => {
    let filtered = consultations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.patient_name?.toLowerCase().includes(term) ||
        c.patient_cpf?.includes(term) ||
        c.specialty?.toLowerCase().includes(term)
      );
    }

    setFilteredConsultations(filtered);
  };

  const loadConsultationDetails = async (consultation: any) => {
    setSelectedConsultation(consultation);

    // Carregar histórico
    const { data: historyData } = await supabase
      .from('consultation_history')
      .select('*')
      .eq('consultation_id', consultation.id)
      .order('created_at', { ascending: true });

    setConsultationHistory(historyData || []);

    // Carregar receitas
    const { data: prescData } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('consultation_id', consultation.id);

    setPrescriptions(prescData || []);
  };

  const handleDownloadPrescription = async (prescription: any) => {
    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .download(prescription.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = prescription.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao baixar receita');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-orange-100 text-orange-800">Pendente</Badge>,
      in_progress: <Badge className="bg-blue-500">Em Andamento</Badge>,
      completed: <Badge className="bg-green-500">Concluída</Badge>,
      cancelled: <Badge variant="outline" className="bg-red-100 text-red-800">Cancelada</Badge>
    };
    return badges[status as keyof typeof badges];
  };

  const getConsultationTypeBadge = (type: string) => {
    return type === 'teleconsulta' ? (
      <Badge className="bg-blue-500">Teleconsulta</Badge>
    ) : (
      <Badge className="bg-green-500">Renovação de Receita</Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader 
        title="📋 Histórico de Consultas"
        role="medico"
        onLogout={handleLogout}
      />

      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Filtros */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente, CPF ou especialidade..."
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Consultas */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Total: {filteredConsultations.length} consultas</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredConsultations.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-600">Nenhuma consulta encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConsultations.map((consultation) => (
                  <div 
                    key={consultation.id} 
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white cursor-pointer"
                    onClick={() => loadConsultationDetails(consultation)}
                  >
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{consultation.patient_name}</span>
                          {getStatusBadge(consultation.status)}
                          {getConsultationTypeBadge(consultation.consultation_type)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(consultation.created_at).toLocaleString('pt-BR')}
                          </p>
                          {consultation.completed_at && (
                            <p className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Finalizada: {new Date(consultation.completed_at).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Detalhes */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Consulta</DialogTitle>
            <DialogDescription>
              Informações completas e histórico
            </DialogDescription>
          </DialogHeader>
          
          {selectedConsultation && (
            <div className="space-y-6">
              {/* Informações do Paciente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Paciente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Nome:</strong> {selectedConsultation.patient_name}</p>
                  <p><strong>CPF:</strong> {selectedConsultation.patient_cpf}</p>
                  <p><strong>Telefone:</strong> {selectedConsultation.patient_phone}</p>
                  <p><strong>Especialidade:</strong> {selectedConsultation.specialty}</p>
                  <p><strong>Urgência:</strong> {selectedConsultation.urgency}</p>
                  <p><strong>Descrição:</strong> {selectedConsultation.description}</p>
                </CardContent>
              </Card>

              {/* Notas Médicas */}
              {selectedConsultation.medical_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas Médicas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedConsultation.medical_notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Diagnóstico */}
              {selectedConsultation.diagnosis && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Diagnóstico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedConsultation.diagnosis}</p>
                  </CardContent>
                </Card>
              )}

              {/* Medicamentos */}
              {selectedConsultation.prescribed_medications && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medicamentos Prescritos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedConsultation.prescribed_medications}</p>
                  </CardContent>
                </Card>
              )}

              {/* Receitas */}
              {prescriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{prescription.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(prescription.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadPrescription(prescription)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Histórico de Mudanças */}
              {consultationHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Histórico de Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {consultationHistory.map((history, index) => (
                        <div key={history.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            {index < consultationHistory.length - 1 && (
                              <div className="w-0.5 h-full bg-gray-300 my-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium">{history.notes}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(history.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
