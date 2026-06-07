import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import Projects from "@/pages/Projects";
import Agenda from "@/pages/Agenda";
import Finance from "@/pages/Finance";
import Settings from "@/pages/Settings";
import Team from "@/pages/Team";
import "@/App.css";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground font-mono text-sm">carregando...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Public({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="min-h-screen flex items-center justify-center" />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Public><Login /></Public>} />
          <Route path="/signup" element={<Public><Signup /></Public>} />
          <Route path="/" element={<Protected><AppLayout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="crm" element={<CRM />} />
            <Route path="projects" element={<Projects />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="finance" element={<Finance />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
