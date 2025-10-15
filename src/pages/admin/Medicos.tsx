import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, Search, RefreshCw, Mail, Phone, Stethoscope, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMedicos() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter]);

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

    if (!roles || roles[0]?.role !== 'admin') {
      navigate('/auth');
      return;
    }

    loadDoctors();
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar médicos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.profiles?.full_name?.toLowerCase().includes(term) ||
        d.profiles?.email?.toLowerCase().includes(term) ||
        d.crm?.toLowerCase().includes(term) ||
        d.specialty?.toLowerCase().includes(term)
      );
    }

    setFilteredDoctors(filtered);
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Médico aprovado!');
      loadDoctors();
    } catch (error) {
      toast.error('Erro ao aprovar médico');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      toast.success('Médico rejeitado');
      loadDoctors();
    } catch (error) {
      toast.error('Erro ao rejeitar médico');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const statusColors = {
    pending: 'bg-medical-yellow/10 text-medical-yellow',
    approved: 'bg-medical-green/10 text-medical-green',
    rejected: 'bg-medical-red/10 text-medical-red'
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader title="🛡️ Painel Admin - Médicos" role="admin" onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Filtros */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, email, CRM ou especialidade..."
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  size="sm"
                  className={statusFilter === 'all' ? 'bg-gradient-primary' : ''}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                  className={statusFilter === 'pending' ? 'bg-medical-yellow text-white' : ''}
                >
                  Pendentes
                </Button>
                <Button
                  variant={statusFilter === 'approved' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('approved')}
                  size="sm"
                  className={statusFilter === 'approved' ? 'bg-medical-green text-white' : ''}
                >
                  Aprovados
                </Button>
                <Button
                  variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('rejected')}
                  size="sm"
                  className={statusFilter === 'rejected' ? 'bg-medical-red text-white' : ''}
                >
                  Rejeitados
                </Button>
              </div>

              <Button onClick={loadDoctors} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Lista de Médicos ({filteredDoctors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => (
                <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {doctor.profiles?.full_name?.charAt(0) || 'M'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg">{doctor.profiles?.full_name}</h3>
                          <Badge className={statusColors[doctor.status as keyof typeof statusColors]}>
                            {statusLabels[doctor.status as keyof typeof statusLabels]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {doctor.profiles?.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            CRM: {doctor.crm} • {doctor.specialty}
                          </p>
                          <p className="text-xs text-gray-400">
                            Cadastrado em {new Date(doctor.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {doctor.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(doctor.id)}
                          className="bg-medical-green hover:bg-medical-green/90"
                          size="sm"
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          onClick={() => handleReject(doctor.id)}
                          variant="outline"
                          className="border-medical-red text-medical-red hover:bg-medical-red/10"
                          size="sm"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}