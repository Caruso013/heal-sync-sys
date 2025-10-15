import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, Clock, Stethoscope, User } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminConsultas() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

    loadConsultations();
  };

  const loadConsultations = async () => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (error) {
      toast.error('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const stats = {
    pending: consultations.filter(c => c.status === 'pending').length,
    in_progress: consultations.filter(c => c.status === 'in_progress').length,
    completed: consultations.filter(c => c.status === 'completed').length,
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.in_progress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Todas as Consultas ({consultations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{consultation.patient_name}</span>
                        <Badge>{consultation.status}</Badge>
                        <Badge variant="outline">{consultation.consultation_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{consultation.specialty}</p>
                    </div>
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