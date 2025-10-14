import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Users, Briefcase, Activity, Heart, Zap, ShoppingCart, MessageCircle, Home, List, Mail, Facebook, Instagram, Linkedin, Twitter, Shield } from 'lucide-react';

const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=%2B5519993511031&text&type=phone_number&app_absent=0';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navbar */}
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-purple-600 text-lg">Otyma Saúde</h1>
                <p className="text-xs text-gray-600">Medicina Acessível para Todos</p>
              </div>
            </div>

            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center gap-6">
              <a href="#inicio" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Home className="w-4 h-4" />
                Início
              </a>
              <a href="#servicos" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <List className="w-4 h-4" />
                Nossos Serviços
              </a>
              <a href="#parceiro" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Heart className="w-4 h-4" />
                Seja Parceiro
              </a>
              <a href="#blog" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <FileText className="w-4 h-4" />
                Blog
              </a>
              <a href="#contato" className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors">
                <Mail className="w-4 h-4" />
                Contato
              </a>
              <ShoppingCart className="w-5 h-5 text-gray-700 cursor-pointer hover:text-purple-600" />
              <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="bg-[#16a34a] hover:bg-[#15803d] text-white">
                Agendar Consulta
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 text-white py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Sua Saúde Conectada,<br />Simples e Acessível.
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto">
              Otyma Saúde: Inovação em serviços médicos online. Renove receitas, faça teleconsultas 24h e tenha acesso a uma ampla rede de benefícios.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} size="lg" className="bg-[#16a34a] hover:bg-[#15803d] text-white text-lg px-8 py-6">
                Conheça Nossos Planos
              </Button>
              <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6">
                <Zap className="w-5 h-5 mr-2" />
                Teleconsulta Imediata (Urgente)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Principais Serviços */}
      <section id="servicos" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-12">
            Nossos Principais Serviços
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Renovação de Receitas */}
            <Card className="hover:shadow-xl transition-shadow border-0 shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Renovação de Receitas Online</h3>
                <p className="text-gray-600 mb-4">
                  Renove suas receitas médicas (brancas, azuis ou amarelas) de forma rápida e segura.
                </p>
              </CardContent>
            </Card>

            {/* Teleconsulta 24H */}
            <Card className="hover:shadow-xl transition-shadow border-0 shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Teleconsulta 24H</h3>
                <p className="text-gray-600 mb-4">
                  Acesso a clínicos gerais 24/7 através do nosso app Conexão Saúde.
                </p>
              </CardContent>
            </Card>

            {/* Descontos Exclusivos */}
            <Card className="hover:shadow-xl transition-shadow border-0 shadow-lg">
              <CardContent className="pt-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Descontos Exclusivos</h3>
                <p className="text-gray-600 mb-4">
                  Economize em cirurgias, exames e procedimentos na rede Doutor Opera.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Serviços Avulsos */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-12">
            Serviços Avulsos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Renovação de Receitas */}
            <Card className="bg-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-purple-600 mb-3">Renovação de Receitas</h3>
                <p className="text-gray-700 mb-4">
                  Renove suas receitas médicas de forma rápida e segura, sem sair de casa. Válido para receitas brancas, azuis e amarelas.
                </p>
                <p className="text-2xl font-bold text-purple-600 mb-4">A partir de R$ 59,90</p>
                <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Renovar Receita →
                </Button>
              </CardContent>
            </Card>

            {/* Teleconsulta 24h */}
            <Card className="bg-cyan-50 border-cyan-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-8">
                <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold text-cyan-600 mb-3">Teleconsulta 24h</h3>
                <p className="text-gray-700 mb-4">
                  Consulte-se com um clínico geral a qualquer momento, 24 horas por dia, 7 dias por semana.
                </p>
                <p className="text-2xl font-bold text-cyan-600 mb-4">A partir de R$150,00</p>
                <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white">
                  Agendar Teleconsulta →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Cirurgias e Procedimentos */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-blue-600 mb-12">
            Cirurgias e Procedimentos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Colonoscopia</h3>
                <p className="text-2xl font-bold text-purple-600 mb-4">12x de R$ 76,00</p>
                <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white">
                  Saiba Mais →
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Balão Intra-gástrico</h3>
                <p className="text-2xl font-bold text-purple-600 mb-4">12x de R$ 760,00</p>
                <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white">
                  Saiba Mais →
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Prótese Peniana</h3>
                <p className="text-2xl font-bold text-purple-600 mb-4">12x de R$ 1.140,00</p>
                <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white">
                  Saiba Mais →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Seja Nosso Parceiro */}
      <section id="parceiro" className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-600 mb-6">
            Seja Nosso Parceiro
          </h2>
          <p className="text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
            A Otyma Saúde busca expandir sua rede de atendimento e convida médicos e profissionais da saúde a fazerem parte de nossa missão de oferecer medicina acessível e de qualidade para todos.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left">
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Para Médicos e Clínicas</h3>
                <p className="text-gray-600">
                  Amplie seu alcance e atenda mais pacientes através da nossa plataforma. Oferecemos suporte completo e uma estrutura que valoriza seu trabalho e expertise.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                  <Briefcase className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Para Profissionais da Saúde</h3>
                <p className="text-gray-600">
                  Se você é nutricionista, psicólogo, fisioterapeuta ou outro profissional da saúde, junte-se a nós para oferecer seus serviços a uma base de pacientes em crescimento.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button onClick={() => window.open(WHATSAPP_URL, '_blank')} size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
            <Heart className="w-5 h-5 mr-2" />
            Saiba Mais sobre Parcerias
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-12 border-t">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Otyma Saúde */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg">Otyma Saúde</h3>
              </div>
              <p className="text-sm text-gray-600">
                Facilitando seu acesso à saúde com serviços médicos online inovadores.
              </p>
            </div>

            {/* Links Rápidos */}
            <div>
              <h3 className="font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#inicio" className="hover:text-purple-600">Início</a></li>
                <li><a href="#servicos" className="hover:text-purple-600">Nossos Serviços</a></li>
                <li><a href="#blog" className="hover:text-purple-600">Blog</a></li>
                <li><a href="#contato" className="hover:text-purple-600">Contato</a></li>
              </ul>
            </div>

            {/* Siga-nos */}
            <div>
              <h3 className="font-bold mb-4">Siga-nos</h3>
              <div className="flex gap-3">
                <Facebook className="w-5 h-5 text-gray-600 hover:text-purple-600 cursor-pointer" />
                <Instagram className="w-5 h-5 text-gray-600 hover:text-purple-600 cursor-pointer" />
                <Linkedin className="w-5 h-5 text-gray-600 hover:text-purple-600 cursor-pointer" />
                <Twitter className="w-5 h-5 text-gray-600 hover:text-purple-600 cursor-pointer" />
              </div>
              <p className="text-xs text-gray-500 mt-4">
                CNPJ: 27.776.515/0001-34
              </p>
            </div>

            {/* Segurança */}
            <div>
              <h3 className="font-bold mb-4">Segurança</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-green-600 font-semibold">Site Seguro</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Seus dados estão protegidos em um ambiente seguro e criptografado.
              </p>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-gray-600">
            © 2025 Otyma Saúde. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#25D366] hover:bg-[#20BA5A] rounded-full flex items-center justify-center shadow-2xl hover:shadow-xl transition-all hover:scale-110 z-50 animate-pulse"
        aria-label="Contato WhatsApp"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </a>
    </div>
  );
};

export default Index;
