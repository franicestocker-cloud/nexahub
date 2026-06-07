import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/apiClient";
import {
  Gauge, Funnel, Kanban, CalendarBlank, CurrencyCircleDollar, Users,
  UsersThree, Gear, MagnifyingGlass, Bell, SignOut, Sparkle, Lightning,
  Sun, Moon, Cube,
} from "@phosphor-icons/react";
import AIPanel from "@/components/AIPanel";
import GlobalSearch from "@/components/GlobalSearch";

const ICON_MAP = {
  Gauge, Funnel, Kanban, CalendarBlank, CurrencyCircleDollar, Users,
  UsersThree, Gear, Cube,
};

const NATIVE_ROUTES = {
  Dashboard: "/",
  CRM: "/crm",
  Projetos: "/projects",
  Agenda: "/agenda",
  Financeiro: "/finance",
  Clientes: "/crm",
  Equipe: "/team",
  "Configurações": "/settings",
};

export default function AppLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("nexa_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nexa_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    api.get("/modules").then(({ data }) => setModules(data)).catch(() => {});
  }, []);

  // Apply company primary color
  useEffect(() => {
    if (company?.primary_color) {
      document.documentElement.style.setProperty("--brand-color", company.primary_color);
    }
  }, [company]);

  // Cmd+K for search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm">carregando NexaHub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[hsl(var(--sidebar))] border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#D94A38] flex items-center justify-center shrink-0">
            <Lightning weight="fill" size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold tracking-tight truncate">{company?.platform_name || "NexaHub"}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{company?.name}</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" data-testid="sidebar-nav">
          <div className="px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Plataforma</div>
          {modules.filter((m) => m.active).map((m) => {
            const Icon = ICON_MAP[m.icon] || Cube;
            const path = NATIVE_ROUTES[m.name] || `/m/${m.id}`;
            return (
              <NavLink
                key={m.id}
                to={path}
                end={path === "/"}
                data-testid={`nav-${m.name.toLowerCase().replace(/[^a-z]/g, "")}`}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-[#D94A38]/10 text-[#D94A38] font-medium"
                      : "text-foreground/80 hover:bg-accent hover:text-foreground"
                  }`
                }
              >
                <Icon size={16} weight="duotone" />
                <span className="truncate">{m.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-2 space-y-1">
          <button
            data-testid="ai-toggle"
            onClick={() => setAiOpen(true)}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md bg-gradient-to-r from-[#D94A38] to-[#B93A2A] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkle weight="fill" size={16} />
            Assistente IA
          </button>
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-stone-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">{user?.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{user?.role}</div>
              </div>
            </div>
            <button data-testid="logout-btn" onClick={async () => { await logout(); navigate("/login"); }} className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <SignOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-6 gap-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <button
            data-testid="search-btn"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 hover:bg-secondary px-3 py-1.5 rounded-md transition-colors min-w-[280px]"
          >
            <MagnifyingGlass size={14} />
            <span>Buscar tudo na plataforma...</span>
            <span className="ml-auto font-mono text-[10px] bg-background border border-border px-1.5 py-0.5 rounded">⌘K</span>
          </button>
          <div className="flex-1" />
          <button data-testid="theme-toggle" onClick={() => setDark(!dark)} className="p-2 hover:bg-accent rounded-md transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button data-testid="notifications-btn" className="p-2 hover:bg-accent rounded-md transition-colors relative">
            <Bell size={16} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
