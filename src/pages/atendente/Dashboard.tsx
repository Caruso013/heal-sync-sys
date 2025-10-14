import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Phone, Stethoscope, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { masks, validate, unmask } from '@/lib/masks';
import { toast } from 'sonner';

export default function AttendantDashboard() {
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [pendingConsultations, setPendingConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientCPF: '',
    specialityId: '',
    description: '',
    urgencyLevel: 'normal'
  });

  useEffect(() => {
    loadSpecialties();
    loadPendingConsultations();
    
    // Auto-refresh a cada 5 segundos
    const interval = setInterval(loadPendingConsultations, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSpecialties = async () => {
    try {
      const result = await api.getSpecialties();
      if (result.success) {
        setSpecialties(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades');
    }
  };

  const loadPendingConsultations = async () => {
    try {
      const result = await api.getPendingConsultations();
      if (result.success) {
        setPendingConsultations(result.data);
      }
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

    // Validações
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
      const result = await api.createConsultation({
        patient_name: formData.patientName,
        patient_phone: unmask.phone(formData.patientPhone),
        patient_cpf: unmask.cpf(formData.patientCPF),
        specialty_id: parseInt(formData.specialityId),
        description: formData.description,
        urgency_level: formData.urgencyLevel
      });

      if (result.success) {
        toast.success('Consulta criada com sucesso!');
        setFormData({
          patientName: '',
          patientPhone: '',
          patientCPF: '',
          specialityId: '',
          description: '',
          urgencyLevel: 'normal'
        });
        loadPendingConsultations();
      } else {
        toast.error(result.message || 'Erro ao criar consulta');
      }
    } catch (error) {
      toast.error('Erro ao criar consulta');
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-gradient-bg">
      <header className="bg-gradient-primary shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">📞 Painel do Atendente</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Nova Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nome do Paciente</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setField('patientName', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.patientPhone}
                    onChange={(e) => setField('patientPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div>
                  <Label>CPF</Label>
                  <Input
                    value={formData.patientCPF}
                    onChange={(e) => setField('patientCPF', e.target.value)}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>

                <div>
                  <Label>Especialidade</Label>
                  <select
                    value={formData.specialityId}
                    onChange={(e) => setField('specialityId', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Selecione...</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Sintomas/Descrição</Label>
                  <Textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setField('description', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Nível de Urgência</Label>
                  <select
                    value={formData.urgencyLevel}
                    onChange={(e) => setField('urgencyLevel', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 shadow-lg"
                  disabled={loading}
                >
                  {loading ? 'Criando...' : 'Solicitar Consulta'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Pendentes */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-secondary text-white">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Consultas Pendentes ({pendingConsultations.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {pendingConsultations.length === 0 ? (
                  <div className="text-center py-12">
                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma consulta pendente</p>
                  </div>
                ) : (
                  pendingConsultations.map((consultation) => (
                    <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                            {consultation.patient_name?.charAt(0) || 'P'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold">{consultation.patient_name}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${urgencyColors[consultation.urgency_level as keyof typeof urgencyColors]}`}>
                                {urgencyLabels[consultation.urgency_level as keyof typeof urgencyLabels]}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                {consultation.patient_phone}
                              </p>
                              <p className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4 flex-shrink-0" />
                                {consultation.specialty}
                              </p>
                              <p className="text-xs text-gray-400">
                                {getTimeAgo(consultation.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
