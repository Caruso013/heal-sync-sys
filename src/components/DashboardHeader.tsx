import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, Home, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  title: string;
  role: 'medico' | 'admin' | 'atendente';
  onLogout: () => void;
}

export default function DashboardHeader({ title, role, onLogout }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getNavLinks = () => {
    if (role === 'medico') {
      return [
        { label: 'Dashboard', path: '/medico/dashboard', icon: Home },
        { label: 'Perfil', path: '/medico/perfil', icon: User }
      ];
    }
    if (role === 'admin') {
      return [
        { label: 'Médicos', path: '/admin/medicos', icon: User },
        { label: 'Consultas', path: '/admin/consultas', icon: Home }
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <header className="bg-gradient-primary shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                onClick={() => navigate(link.path)}
                variant="ghost"
                className="text-white hover:bg-white/20 transition-colors"
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.label}
              </Button>
            ))}
            <Button
              onClick={onLogout}
              variant="outline"
              className="bg-white text-primary hover:bg-white/90"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            variant="ghost"
            size="icon"
            className="md:hidden text-white hover:bg-white/20"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-2 pb-2">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileMenuOpen(false);
                }}
                variant="ghost"
                className="text-white hover:bg-white/20 justify-start"
              >
                <link.icon className="w-4 h-4 mr-2" />
                {link.label}
              </Button>
            ))}
            <Button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              variant="outline"
              className="bg-white text-primary hover:bg-white/90 justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
