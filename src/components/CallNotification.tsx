import { useEffect, useState } from 'react';
import { useDoctorCallNotification } from '@/hooks/useConsultationQueue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Phone, User, AlertCircle, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function CallNotification() {
  const { pendingCall, acceptCall, rejectCall } = useDoctorCallNotification();
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  useEffect(() => {
    if (!pendingCall) {
      setHasPlayedSound(false);
      setTimeRemaining(15);
      return;
    }

    // Tocar som de notificação
    if (!hasPlayedSound) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZUQ8MVKrm775rIQQ3kdf0yoExBSaAzvHajUEIGmm98OycUg8PVq/n9L1rIQQ3ktn0xYIzBSB4x/HekUEIHW/A8OibUg8PVrDn9L1sIgQ4lNn0xoI0BSF5yPHfkUEIHnDA8OmbUg8OVrHo9L5sIgQ4ldv1x4M0BSJ6yPLgkkIJH3HB8OqcUxAPV7Lp9b5sIwU5ltv1yIM1BSN7yfLgk0IJIHLC8OuWIQ==');
      audio.play().catch(() => {});
      setHasPlayedSound(true);
    }

    // Timer de countdown
    if (!pendingCall.call_timeout_at) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const timeout = new Date(pendingCall.call_timeout_at);
      const remaining = Math.max(0, Math.floor((timeout.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pendingCall, hasPlayedSound]);

  const handleAccept = async () => {
    if (pendingCall) {
      await acceptCall(pendingCall.id);
    }
  };

  const handleReject = async () => {
    if (pendingCall) {
      await rejectCall(pendingCall.id);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors = {
      urgente: 'bg-red-500',
      alta: 'bg-orange-500',
      normal: 'bg-blue-500',
      baixa: 'bg-gray-500'
    };
    return colors[urgency as keyof typeof colors] || 'bg-gray-500';
  };

  const getConsultationType = (type: string) => {
    return type === 'teleconsulta' ? 'Teleconsulta' : 'Renovação de Receita';
  };

  if (!pendingCall) return null;

  const progressPercentage = (timeRemaining / 15) * 100;

  return (
    <AlertDialog open={!!pendingCall}>
      <AlertDialogContent className="max-w-md animate-scale-in">
        <AlertDialogHeader>
          <div className="flex items-center justify-between mb-4">
            <AlertDialogTitle className="text-2xl flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary animate-pulse" />
              Nova Consulta!
            </AlertDialogTitle>
            <div className="text-3xl font-bold text-primary">
              {timeRemaining}s
            </div>
          </div>
          
          <Progress value={progressPercentage} className="h-2 mb-4" />
          
          <AlertDialogDescription className="space-y-4 text-left">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="font-semibold text-foreground">{pendingCall.patient_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium text-foreground">
                  {getConsultationType(pendingCall.consultation_type)}
                </p>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Urgência</p>
                <Badge className={getUrgencyColor(pendingCall.urgency)}>
                  {pendingCall.urgency}
                </Badge>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Especialidade</p>
              <p className="text-sm font-medium text-foreground">{pendingCall.specialty}</p>
            </div>

            {pendingCall.description && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm text-foreground">{pendingCall.description}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-1" />
              <p className="text-xs text-yellow-700 dark:text-yellow-500">
                Você tem {timeRemaining} segundos para responder. Se não aceitar, a consulta será oferecida ao próximo médico.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            onClick={handleReject}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Recusar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAccept}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Aceitar Consulta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
