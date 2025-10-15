import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from '@/components/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState<any>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', crm: '', specialty_id: '',
    bio: '', address: '', experience_years: ''
  });

  useEffect(() => {
    const session = localStorage.getItem('doctorSession');
    if (!session) {
      navigate('/medico/login');
      return;
    }

    const data = JSON.parse(session);
    setDoctorData(data);
    loadProfile(data.id);
    loadSpecialties();
  }, [navigate]);

  const loadProfile = async (id: number) => {
    try {
      const result = await api.getDoctorProfile(id);
      if (result.success) {
        const profile = result.data;
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          crm: profile.crm || '',
          specialty_id: profile.specialty_id || '',
          bio: profile.bio || '',
          address: profile.address || '',
          experience_years: profile.experience_years || ''
        });
        setPreviewUrl(profile.photo_url);
      }
    } catch (error) {
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !doctorData) return;
    
    setUploading(true);
    try {
      const result = await api.uploadPhoto(doctorData.id, selectedFile);
      if (result.success) {
        toast.success('Foto atualizada com sucesso!');
        setSelectedFile(null);
      }
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const result = await api.updateProfile(doctorData.id, formData);
      if (result.success) {
        toast.success('Perfil atualizado!');
        setIsEditing(false);
        
        // Atualizar sessão
        const updatedSession = { ...doctorData, ...formData };
        localStorage.setItem('doctorSession', JSON.stringify(updatedSession));
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getSpecialtyName = () => {
    const specialty = specialties.find(s => s.id === parseInt(formData.specialty_id));
    return specialty?.nome || 'Não definida';
  };

  if (loading || !doctorData) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      <DashboardHeader title="👨‍⚕️ Meu Perfil" role="medico" onLogout={handleLogout} />
      
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <Card className="shadow-xl overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-primary" />
          
          <CardContent className="relative">
            {/* Photo */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20">
              <div className="relative">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Foto do médico"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-primary flex items-center justify-center">
                    <span className="text-4xl text-white font-bold">
                      {formData.name.charAt(0) || 'M'}
                    </span>
                  </div>
                )}
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:shadow-glow transition-shadow">
                  <Camera className="w-5 h-5 text-primary" />
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="flex-1 pb-4">
                <h2 className="text-3xl font-bold">{formData.name}</h2>
                <p className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Stethoscope className="w-4 h-4" />
                  {getSpecialtyName()}
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {formData.email}
                </p>
              </div>

              <div className="flex gap-2 pb-4">
                {selectedFile && (
                  <Button
                    onClick={handleUploadPhoto}
                    disabled={uploading}
                    className="bg-gradient-success hover:opacity-90"
                  >
                    {uploading ? 'Enviando...' : 'Fazer Upload'}
                  </Button>
                )}
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
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-blue/10 flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-6 h-6 text-medical-blue" />
                </div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-xs text-muted-foreground">Consultas Hoje</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-green/10 flex items-center justify-center mx-auto mb-2">
                  <Award className="w-6 h-6 text-medical-green" />
                </div>
                <p className="text-2xl font-bold">247</p>
                <p className="text-xs text-muted-foreground">Total Atendidos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-purple/10 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 text-medical-purple" />
                </div>
                <p className="text-2xl font-bold">4h 30m</p>
                <p className="text-xs text-muted-foreground">Tempo Online</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-medical-orange/10 flex items-center justify-center mx-auto mb-2">
                  <Stethoscope className="w-6 h-6 text-medical-orange" />
                </div>
                <p className="text-2xl font-bold">98%</p>
                <p className="text-xs text-muted-foreground">Taxa Resposta</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1 */}
              <div className="space-y-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>

              {/* Coluna 2 */}
              <div className="space-y-4">
                <div>
                  <Label>CRM</Label>
                  <Input
                    value={formData.crm}
                    onChange={(e) => setFormData({ ...formData, crm: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Especialidade</Label>
                  {isEditing ? (
                    <select
                      value={formData.specialty_id}
                      onChange={(e) => setFormData({ ...formData, specialty_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Selecione...</option>
                      {specialties.map(s => (
                        <option key={s.id} value={s.id}>{s.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <Input value={getSpecialtyName()} disabled className="bg-gray-50" />
                  )}
                </div>
                <div>
                  <Label>Anos de Experiência</Label>
                  <Input
                    type="number"
                    value={formData.experience_years}
                    onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Biografia</Label>
                  <Textarea
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-gray-50' : ''}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="shadow-lg">
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
