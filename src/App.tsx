import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Médico
import DoctorDashboard from "./pages/medico/Dashboard";
import DoctorProfile from "./pages/medico/Perfil";

// Admin
import AdminMedicos from "./pages/admin/Medicos";
import AdminConsultas from "./pages/admin/Consultas";
import CriarAtendente from "./pages/admin/CriarAtendente";
import CriarMedico from "./pages/admin/CriarMedico";

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
          <Route 
            path="/medico/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['medico']}>
                <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/medico/perfil" 
            element={
              <ProtectedRoute allowedRoles={['medico']}>
                <DoctorProfile />
              </ProtectedRoute>
            } 
          />

          {/* Admin Routes */}
          <Route 
            path="/admin/medicos" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminMedicos />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/consultas" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminConsultas />
              </ProtectedRoute>
            } 
          />
            <Route 
              path="/admin/criar-atendente" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CriarAtendente />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/criar-medico" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <CriarMedico />
                </ProtectedRoute>
              } 
            />

          {/* Atendente Routes */}
          <Route 
            path="/atendente" 
            element={
              <ProtectedRoute allowedRoles={['atendente']}>
                <AttendantDashboard />
              </ProtectedRoute>
            } 
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
