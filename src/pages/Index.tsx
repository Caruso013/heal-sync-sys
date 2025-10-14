import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Shield, Phone, Activity } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Hero Section */}
      <header className="bg-gradient-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Sistema Otyma Saúde
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Plataforma completa de gestão de teleconsultas médicas
          </p>
        </div>
      </header>

      {/* Login Cards */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Médico */}
          <Card className="shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Portal do Médico</CardTitle>
              <CardDescription>
                Acesse sua área profissional para atender pacientes e gerenciar consultas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/medico/login">
                <Button className="w-full bg-gradient-primary hover:opacity-90 shadow-lg text-lg py-6">
                  Acessar Portal Médico
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin */}
          <Card className="shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Portal Admin</CardTitle>
              <CardDescription>
                Gerencie médicos, consultas e supervisione toda a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/login">
                <Button className="w-full bg-gradient-secondary hover:opacity-90 shadow-lg text-lg py-6">
                  Acessar Administração
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Atendente */}
          <Card className="shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Portal Atendente</CardTitle>
              <CardDescription>
                Registre novas consultas e acompanhe solicitações pendentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/atendente">
                <Button className="w-full bg-gradient-success hover:opacity-90 shadow-lg text-lg py-6">
                  Acessar Atendimento
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-medical-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Activity className="w-6 h-6 text-medical-blue" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Atendimento em Tempo Real</h3>
              <p className="text-sm text-muted-foreground">
                Sistema de teleconsultas com atualizações instantâneas
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-medical-green/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-6 h-6 text-medical-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Múltiplas Especialidades</h3>
              <p className="text-sm text-muted-foreground">
                Suporte para diversos tipos de especialidades médicas
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-medical-purple/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-medical-purple" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Gestão Completa</h3>
              <p className="text-sm text-muted-foreground">
                Painel administrativo com controle total da operação
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-primary text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white/80">
            © 2025 Otyma Saúde - Sistema de Gestão de Teleconsultas
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
