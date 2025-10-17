import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

// Médico
import DoctorDashboard from "./pages/medico/Dashboard";
import DoctorProfile from "./pages/medico/Perfil";

// Admin
import AdminMedicos from "./pages/admin/Medicos";
import AdminConsultas from "./pages/admin/Consultas";
import CriarAtendente from "./pages/admin/CriarAtendente";

// Atendente
import AttendantDashboard from "./pages/atendente/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />

          {/* Médico Routes */}
          <Route path="/medico/dashboard" element={<DoctorDashboard />} />
          <Route path="/medico/perfil" element={<DoctorProfile />} />

          {/* Admin Routes */}
          <Route path="/admin/medicos" element={<AdminMedicos />} />
          <Route path="/admin/consultas" element={<AdminConsultas />} />
          <Route path="/admin/criar-atendente" element={<CriarAtendente />} />

          {/* Atendente Routes */}
          <Route path="/atendente" element={<AttendantDashboard />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
