import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, RefreshCw, Mail, Phone, Stethoscope, UserCheck, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default function AdminMedicos() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('adminSession');
    if (!session) {
      navigate('/admin/login');
      return;
    }

    checkCacheAndLoad();
  }, [navigate]);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchTerm, statusFilter]);

  const checkCacheAndLoad = () => {
    const cachedData = localStorage.getItem('doctors_cache');
    const cacheTime = localStorage.getItem('doctors_cache_time');

    if (cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      if (age < CACHE_DURATION) {
        setDoctors(JSON.parse(cachedData));
        setLastFetch(new Date(parseInt(cacheTime)));
        setLoading(false);
        return;
      }
    }

    loadDoctors();
  };

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const result = await api.getDoctors(statusFilter !== 'all' ? statusFilter : undefined);
      if (result.success) {
        setDoctors(result.data);
        localStorage.setItem('doctors_cache', JSON.stringify(result.data));
        localStorage.setItem('doctors_cache_time', Date.now().toString());
        setLastFetch(new Date());
      }
    } catch (error) {
      toast.error('Erro ao carregar médicos');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    localStorage.removeItem('doctors_cache');
    localStorage.removeItem('doctors_cache_time');
    loadDoctors();
  };

  const filterDoctors = () => {
    let filtered = doctors;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(term) ||
        d.email?.toLowerCase().includes(term) ||
        d.crm?.toLowerCase().includes(term) ||
        d.specialty?.toLowerCase().includes(term)
      );
    }

    setFilteredDoctors(filtered);
    setCurrentPage(1);
  };

  const handleApprove = async (id: number) => {
    try {
      const result = await api.approveDoctor(id);
      if (result.success) {
        toast.success('Médico aprovado!');
        refreshData();
      }
    } catch (error) {
      toast.error('Erro ao aprovar médico');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const result = await api.rejectDoctor(id);
      if (result.success) {
        toast.success('Médico rejeitado');
        refreshData();
      }
    } catch (error) {
      toast.error('Erro ao rejeitar médico');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDoctors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage);

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
              {/* Busca */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, email, CRM ou especialidade..."
                  className="pl-10"
                />
              </div>

              {/* Filtros de Status */}
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

              {/* Refresh */}
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
              Lista de Médicos ({filteredDoctors.length})
              {totalPages > 1 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentItems.map((doctor) => (
                <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {doctor.name?.charAt(0) || 'M'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg">{doctor.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[doctor.status as keyof typeof statusColors]}`}>
                            {statusLabels[doctor.status as keyof typeof statusLabels]}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            {doctor.email}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            {doctor.phone}
                          </p>
                          <p className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 flex-shrink-0" />
                            {doctor.crm} • {doctor.specialty}
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

            {/* Paginação */}
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
