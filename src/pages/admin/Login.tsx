import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.loginAdmin(email, password);
      
      if (result.success) {
        localStorage.setItem('adminSession', JSON.stringify(result.data));
        toast.success('Login administrativo realizado!');
        navigate('/admin/medicos');
      } else {
        toast.error(result.message || 'Erro ao fazer login');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
            Login Administrativo
          </CardTitle>
          <p className="text-muted-foreground mt-2">Acesso restrito à administração</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@otyma.com"
                required
                className="transition-all focus:shadow-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                className="transition-all focus:shadow-md"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-secondary hover:opacity-90 transition-all shadow-lg hover:shadow-glow"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
