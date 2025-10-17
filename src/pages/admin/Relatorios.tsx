import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, FileText, TrendingUp, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminRelatorios() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalConsultations: 0,
    totalDoctors: 0,
    activeDoctors: 0,
    pendingDoctors: 0,
    consultationsThisMonth: 0,
    consultationsToday: 0,
  });
  const [consultationsByStatus, setConsultationsByStatus] = useState<any[]>([]);
  const [consultationsByType, setConsultationsByType] = useState<any[]>([]);
  const [consultationsByMonth, setConsultationsByMonth] = useState<any[]>([]);
  const [topDoctors, setTopDoctors] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
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

    if (!roles || roles[0]?.role !== 'admin') {
      navigate('/auth');
      return;
    }

    loadAnalytics();
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Carregar estatísticas gerais
      const { data: consultations } = await supabase.from('consultations').select('*');
      const { data: doctors } = await supabase.from('doctors').select('*');

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const consultationsThisMonth = consultations?.filter(
        c => new Date(c.created_at) >= startOfMonth
      ).length || 0;

      const consultationsToday = consultations?.filter(
        c => new Date(c.created_at) >= startOfToday
      ).length || 0;

      setStats({
        totalConsultations: consultations?.length || 0,
        totalDoctors: doctors?.length || 0,
        activeDoctors: doctors?.filter(d => d.status === 'approved').length || 0,
        pendingDoctors: doctors?.filter(d => d.status === 'pending').length || 0,
        consultationsThisMonth,
        consultationsToday,
      });

      // Consultas por status
      const statusData = [
        { name: 'Pendentes', value: consultations?.filter(c => c.status === 'pending').length || 0 },
        { name: 'Em Andamento', value: consultations?.filter(c => c.status === 'in_progress').length || 0 },
        { name: 'Concluídas', value: consultations?.filter(c => c.status === 'completed').length || 0 },
        { name: 'Canceladas', value: consultations?.filter(c => c.status === 'cancelled').length || 0 },
      ];
      setConsultationsByStatus(statusData);

      // Consultas por tipo
      const typeData = [
        { name: 'Teleconsulta', value: consultations?.filter(c => c.consultation_type === 'teleconsulta').length || 0 },
        { name: 'Renovação de Receita', value: consultations?.filter(c => c.consultation_type === 'renovacao_receita').length || 0 },
      ];
      setConsultationsByType(typeData);

      // Consultas por mês (últimos 6 meses)
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const count = consultations?.filter(
          c => new Date(c.created_at) >= date && new Date(c.created_at) < nextMonth
        ).length || 0;
        
        monthlyData.push({
          month: date.toLocaleDateString('pt-BR', { month: 'short' }),
          consultas: count
        });
      }
      setConsultationsByMonth(monthlyData);

      // Médicos mais ativos (top 5)
      const { data: doctorsWithProfiles } = await supabase
        .from('doctors')
        .select('id, profiles(full_name)');

      const doctorStats = doctorsWithProfiles?.map(doctor => {
        const count = consultations?.filter(c => c.doctor_id === doctor.id).length || 0;
        return {
          name: (doctor.profiles as any)?.full_name || 'Médico',
          consultas: count
        };
      }).sort((a, b) => b.consultas - a.consultas).slice(0, 5) || [];

      setTopDoctors(doctorStats);

    } catch (error) {
      toast.error('Erro ao carregar relatórios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
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
      <DashboardHeader title="📊 Relatórios e Analytics" role="admin" onLogout={handleLogout} />

      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Consultas</CardTitle>
              <FileText className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.totalConsultations}</div>
              <p className="text-xs text-muted-foreground mt-1">Todas as consultas registradas</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Médicos Ativos</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.activeDoctors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingDoctors} aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
              <Calendar className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.consultationsThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.consultationsToday} hoje</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Consultas por Status */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Consultas por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={consultationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {consultationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Consultas por Tipo */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Consultas por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={consultationsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tendência Mensal */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência Mensal (Últimos 6 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consultationsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="consultas" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Médicos */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 5 Médicos Mais Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDoctors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="consultas" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
