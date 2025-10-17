import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Download, Trash2 } from 'lucide-react';

interface PrescriptionUploadProps {
  consultationId: string;
  doctorId: string;
  onUploadComplete?: () => void;
}

interface Prescription {
  id: string;
  file_name: string;
  file_path: string;
  notes: string | null;
  created_at: string;
}

export default function PrescriptionUpload({ 
  consultationId, 
  doctorId,
  onUploadComplete 
}: PrescriptionUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('consultation_id', consultationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, [consultationId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas arquivos PDF ou imagens (JPG, PNG) são permitidos');
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo');
      return;
    }

    setUploading(true);

    try {
      // Upload para Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${consultationId}_${Date.now()}.${fileExt}`;
      const filePath = `${doctorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Salvar metadata no banco
      const { error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          consultation_id: consultationId,
          doctor_id: doctorId,
          file_path: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          notes: notes || null
        });

      if (dbError) throw dbError;

      toast.success('Receita enviada com sucesso!');
      setSelectedFile(null);
      setNotes('');
      loadPrescriptions();
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao enviar receita');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (prescription: Prescription) => {
    try {
      const { data, error } = await supabase.storage
        .from('prescriptions')
        .download(prescription.file_path);

      if (error) throw error;

      // Criar URL temporária e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = prescription.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Download iniciado');
    } catch (error: any) {
      toast.error('Erro ao baixar receita');
      console.error(error);
    }
  };

  const handleDelete = async (prescriptionId: string, filePath: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;

    try {
      // Deletar do storage
      await supabase.storage
        .from('prescriptions')
        .remove([filePath]);

      // Deletar do banco
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

      if (error) throw error;

      toast.success('Receita excluída');
      loadPrescriptions();
    } catch (error: any) {
      toast.error('Erro ao excluir receita');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="prescription-file">Arquivo da Receita (PDF ou Imagem)</Label>
              <Input
                id="prescription-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
                className="mt-2"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Arquivo selecionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="prescription-notes">Observações (opcional)</Label>
              <Textarea
                id="prescription-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Tomar 1 comprimido a cada 8 horas..."
                rows={3}
                disabled={uploading}
                className="mt-2"
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Receita
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de receitas existentes */}
      {loading ? (
        <div className="text-center py-4">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : prescriptions.length > 0 ? (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Receitas Enviadas</h4>
          {prescriptions.map((prescription) => (
            <Card key={prescription.id} className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{prescription.file_name}</p>
                      {prescription.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{prescription.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(prescription.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(prescription)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(prescription.id, prescription.file_path)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
