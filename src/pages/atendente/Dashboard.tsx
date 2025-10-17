import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Phone, Stethoscope, Clock, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { masks, validate, unmask } from '@/lib/masks';
import { toast } from 'sonner';
import { useConsultationQueue } from '@/hooks/useConsultationQueue';
import { Progress } from '@/components/ui/progress';

export default function AttendantDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pendingConsultations, setPendingConsultations] = useState<any[]>([]);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const { queueStatus, timeRemaining, callNextDoctor } = useConsultationQueue(activeQueueId);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientCPF: '',
    specialty: '',
    consultationType: 'teleconsulta' as 'teleconsulta' | 'renovacao_receita',
    description: '',
    urgency: 'normal'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadPendingConsultations, 5000);
    return () => clearInterval(interval);
  }, []);

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

    if (!roles || roles[0]?.role !== 'atendente') {
      navigate('/auth');
      return;
    }

    loadPendingConsultations();
  };

  const loadPendingConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingConsultations(data || []);
    } catch (error) {
      console.error('Erro ao carregar consultas');
    }
  };

  const setField = (field: string, value: string) => {
    if (field === 'patientPhone') {
      setFormData({ ...formData, [field]: masks.phone(value) });
    } else if (field === 'patientCPF') {
      setFormData({ ...formData, [field]: masks.cpf(value) });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate.phone(formData.patientPhone)) {
      toast.error('Telefone inválido');
      return;
    }

    if (!validate.cpf(formData.patientCPF)) {
      toast.error('CPF inválido');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.from('consultations').insert({
        patient_name: formData.patientName,
        patient_phone: unmask.phone(formData.patientPhone),
        patient_cpf: unmask.cpf(formData.patientCPF),
        consultation_type: formData.consultationType,
        specialty: formData.specialty,
        description: formData.description,
        urgency: formData.urgency,
        created_by: session?.user.id
      });

      if (error) throw error;

      toast.success('Consulta criada com sucesso!');
      setFormData({
        patientName: '',
        patientPhone: '',
        patientCPF: '',
        specialty: '',
        consultationType: 'teleconsulta',
        description: '',
        urgency: 'normal'
      });
      loadPendingConsultations();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s atrás`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  };

  const urgencyColors = {
    baixa: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
  };

  const urgencyLabels = {
    baixa: 'Baixa',
    normal: 'Normal',
    alta: 'Alta',
    urgente: 'Urgente'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <header className="bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            📞 Painel do Atendente
          </h1>
          <Button onClick={handleLogout} variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário Aprimorado */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="w-6 h-6" />
                Nova Solicitação de Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Nome do Paciente *</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setField('patientName', e.target.value)}
                    className="border-2 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Telefone *</Label>
                    <Input
                      value={formData.patientPhone}
                      onChange={(e) => setField('patientPhone', e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="border-2 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">CPF *</Label>
                    <Input
                      value={formData.patientCPF}
                      onChange={(e) => setField('patientCPF', e.target.value)}
                      placeholder="000.000.000-00"
                      className="border-2 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Tipo de Consulta *</Label>
                  <Select value={formData.consultationType} onValueChange={(value: any) => setField('consultationType', value)}>
                    <SelectTrigger className="border-2 focus:border-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teleconsulta">Teleconsulta</SelectItem>
                      <SelectItem value="renovacao_receita">Renovação de Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Especialidade *</Label>
                  <Input
                    value={formData.specialty}
                    onChange={(e) => setField('specialty', e.target.value)}
                    placeholder="Ex: Clínico Geral, Cardiologia..."
                    className="border-2 focus:border-purple-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Sintomas/Descrição *</Label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setField('description', e.target.value)}
                    className="border-2 focus:border-purple-500"
                    placeholder="Descreva os sintomas ou motivo da consulta..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Nível de Urgência *</Label>
                  <Select value={formData.urgency} onValueChange={(value) => setField('urgency', value)}>
                    <SelectTrigger className="border-2 focus:border-purple-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-lg text-lg py-6"
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Solicitar Consulta Médica'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Pendentes Aprimorada */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="w-6 h-6 animate-pulse" />
                Fila de Atendimento ({pendingConsultations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                {pendingConsultations.length === 0 ? (
                  <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-lg">
                    <Stethoscope className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600">Nenhuma consulta na fila</p>
                    <p className="text-sm text-gray-400 mt-2">As novas solicitações aparecerão aqui</p>
                  </div>
                ) : (
                  pendingConsultations.map((consultation) => {
                    const isActiveQueue = activeQueueId === consultation.id;
                    const consultationQueue = isActiveQueue ? queueStatus : null;
                    
                    return (
                      <div key={consultation.id} className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-xl transition-all bg-gradient-to-br from-white to-gray-50 hover:border-purple-300 animate-fade-in">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg">
                              {consultation.patient_name?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-bold text-lg text-gray-900">{consultation.patient_name}</h3>
                                <Badge className={`${urgencyColors[consultation.urgency as keyof typeof urgencyColors]} font-semibold`}>
                                  {urgencyLabels[consultation.urgency as keyof typeof urgencyLabels]}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {consultation.consultation_type === 'teleconsulta' ? 'Teleconsulta' : 'Renovação de Receita'}
                                </Badge>
                                {consultation.call_attempts > 0 && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    {consultation.call_attempts} tentativa(s)
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 flex-shrink-0 text-purple-600" />
                                  <span className="font-medium">{consultation.patient_phone}</span>
                                </p>
                                <p className="flex items-center gap-2">
                                  <Stethoscope className="w-4 h-4 flex-shrink-0 text-blue-600" />
                                  <span className="font-medium">{consultation.specialty}</span>
                                </p>
                                <p className="flex items-start gap-2 mt-2">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                                  <span className="text-xs text-gray-500">{consultation.description}</span>
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                                  <Clock className="w-3 h-3" />
                                  {getTimeAgo(consultation.created_at)}
                                </p>
                              </div>

                              {/* Queue Status */}
                              {isActiveQueue && consultationQueue && (
                                <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 animate-scale-in">
                                  {consultationQueue.status === 'calling' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-blue-900">
                                          Chamando: Dr(a). {consultationQueue.doctorName}
                                        </p>
                                        <span className="text-lg font-bold text-blue-600">
                                          {timeRemaining}s
                                        </span>
                                      </div>
                                      <Progress value={(timeRemaining / 15) * 100} className="h-2" />
                                      <p className="text-xs text-blue-600">
                                        Aguardando resposta do médico...
                                      </p>
                                    </div>
                                  )}
                                  {consultationQueue.status === 'accepted' && (
                                    <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                      ✅ Consulta aceita!
                                    </p>
                                  )}
                                  {consultationQueue.status === 'waiting' && (
                                    <p className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Procurando médico disponível...
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {!isActiveQueue && !consultation.doctor_id && (
                              <Button
                                onClick={() => {
                                  setActiveQueueId(consultation.id);
                                  setTimeout(() => callNextDoctor(), 100);
                                }}
                                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover-scale"
                                size="sm"
                              >
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Iniciar Busca
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}