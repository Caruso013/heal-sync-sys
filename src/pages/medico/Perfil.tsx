import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, Stethoscope, Mail, Calendar, Award, Clock, FileText } from 'lucide-react';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
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

    loadProfile(session.user.id);
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*, profiles(*)')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Erro ao carregar perfil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          specialty: profile.specialty,
          crm: profile.crm,
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Perfil atualizado!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader title="👨‍⚕️ Meu Perfil" role="medico" onLogout={handleLogout} />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
        {/* Profile Card */}
        <Card className="shadow-xl overflow-hidden hover-scale">
          {/* Banner */}
          <div className="h-32 bg-gradient-primary" />
          
          <CardContent className="relative">
            {/* Photo */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20">
              <div className="relative">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt="Foto do médico"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-primary flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                      {profile.profiles?.full_name?.charAt(0) || 'M'}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:shadow-glow transition-shadow">
                  <Camera className="w-5 h-5 text-primary" />
                </label>
              </div>

              <div className="flex-1 pb-4">
                <h2 className="text-3xl font-bold">{profile.profiles?.full_name}</h2>
                <p className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Stethoscope className="w-4 h-4" />
                  {profile.specialty}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {profile.profiles?.email}
                </p>
              </div>

              <div className="flex gap-2 pb-4">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="bg-gradient-primary hover:opacity-90">
                    Editar Perfil
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} className="bg-gradient-success hover:opacity-90">
                      Salvar
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline">
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow animate-scale-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-blue/10 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-medical-blue" />
                </div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Consultas Hoje</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-scale-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-green/10 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-medical-green" />
                </div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Total Atendidos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-scale-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-purple/10 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-medical-purple" />
                </div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Tempo Online</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow animate-scale-in">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-orange/10 flex items-center justify-center mx-auto mb-2">
                  <Stethoscope className="w-6 h-6 text-medical-orange" />
                </div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Taxa Resposta</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={profile.profiles?.full_name || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={profile.profiles?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={profile.profiles?.phone || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>CRM</Label>
                  <Input
                    value={profile.crm}
                    onChange={(e) => setProfile({ ...profile, crm: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Especialidade</Label>
                  <Input
                    value={profile.specialty}
                    onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Input
                    value={profile.status === 'approved' ? 'Aprovado' : profile.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="shadow-lg animate-fade-in">
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum documento enviado</p>
              <Button disabled className="mt-4" variant="outline">
                Adicionar Documento
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
