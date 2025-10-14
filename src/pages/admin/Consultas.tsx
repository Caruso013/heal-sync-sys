import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Activity, CheckCircle, XCircle, Search, Filter, RefreshCw, Phone, User, Stethoscope, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const CACHE_DURATION = 5 * 60 * 1000;

export default function AdminConsultas() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      navigate('/admin/login');
      return;
    }

    checkCacheAndLoad();
  }, [navigate]);

  useEffect(() => {
    filterConsultations();
  }, [consultations, searchTerm, statusFilter]);

  const checkCacheAndLoad = () => {
    const cachedData = localStorage.getItem('consultations_cache');
    const cacheTime = localStorage.getItem('consultations_cache_time');

    if (cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CACHE_DURATION) {
        const data = JSON.parse(cachedData);
        setConsultations(data);
        calculateStats(data);
        setLastFetch(new Date(parseInt(cacheTime)));
        setLoading(false);
        return;
      }
    }

    loadConsultations();
  };

  const loadConsultations = async () => {
    setLoading(true);
    try {
      const result = await api.getAllConsultations(statusFilter !== 'all' ? statusFilter : undefined);
      if (result.success) {
        setConsultations(result.data);
        calculateStats(result.data);
        localStorage.setItem('consultations_cache', JSON.stringify(result.data));
        localStorage.setItem('consultations_cache_time', Date.now().toString());
        setLastFetch(new Date());
      }
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    setStats({
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      active: data.filter(c => c.status === 'active').length,
      completed: data.filter(c => c.status === 'completed').length,
      cancelled: data.filter(c => c.status === 'cancelled').length
    });
  };

  const refreshData = () => {
    localStorage.removeItem('consultations_cache');
    localStorage.removeItem('consultations_cache_time');
    loadConsultations();
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
        c.patient_phone?.toLowerCase().includes(term) ||
        c.doctor_name?.toLowerCase().includes(term) ||
        c.specialty?.toLowerCase().includes(term)
      );
    }

    setFilteredConsultations(filtered);
    setCurrentPage(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConsultations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);

  const statusColors = {
    pending: 'bg-medical-yellow/10 text-medical-yellow',
    active: 'bg-medical-blue/10 text-medical-blue',
    completed: 'bg-medical-green/10 text-medical-green',
    cancelled: 'bg-medical-red/10 text-medical-red'
  };

  const statusLabels = {
    pending: 'Aguardando',
    active: 'Ativa',
    completed: 'Concluída',
    cancelled: 'Cancelada'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader title="🛡️ Painel Admin - Consultas" role="admin" onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-purple/10 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-medical-purple" />
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-yellow/10 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-medical-yellow" />
                </div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Aguardando</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-blue/10 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-6 h-6 text-medical-blue" />
                </div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-green/10 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-6 h-6 text-medical-green" />
                </div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Concluídas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-red/10 flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-6 h-6 text-medical-red" />
                </div>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Canceladas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por paciente, telefone, médico ou especialidade..."
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
                  Todas
                </Button>
                <Button
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                  size="sm"
                  className={statusFilter === 'pending' ? 'bg-medical-yellow text-white' : ''}
                >
                  Aguardando
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                  size="sm"
                  className={statusFilter === 'active' ? 'bg-medical-blue text-white' : ''}
                >
                  Ativas
                </Button>
                <Button
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                  size="sm"
                  className={statusFilter === 'completed' ? 'bg-medical-green text-white' : ''}
                >
                  Concluídas
                </Button>
                <Button
                  variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('cancelled')}
                  size="sm"
                  className={statusFilter === 'cancelled' ? 'bg-medical-red text-white' : ''}
                >
                  Canceladas
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={refreshData} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                {lastFetch && (
                  <p className="text-xs text-gray-400 hidden md:block">
                    {lastFetch.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              Consultas ({filteredConsultations.length})
              {totalPages > 1 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentItems.map((consultation) => (
                <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold flex-shrink-0">
                        {consultation.patient_name?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{consultation.patient_name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[consultation.status as keyof typeof statusColors]}`}>
                            {statusLabels[consultation.status as keyof typeof statusLabels]}
                          </span>
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
                            <User className="w-4 h-4 flex-shrink-0" />
                            Médico: {consultation.doctor_name || 'Não atribuído'}
                          </p>
                          <p className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            {consultation.specialty}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className={page === currentPage ? 'bg-gradient-primary' : ''}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
