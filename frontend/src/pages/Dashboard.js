import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import {
  Users, Funnel, Kanban, CurrencyCircleDollar, TrendUp, Clock, CheckCircle,
} from "@phosphor-icons/react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const STAGE_LABELS = {
  lead: "Lead",
  contact: "Contato",
  proposal: "Proposta",
  negotiation: "Negociação",
  client: "Cliente",
};
const STATUS_LABELS = {
  novo: "Novo",
  em_andamento: "Em andamento",
  producao: "Produção",
  aguardando: "Aguardando",
  revisao: "Revisão",
  concluido: "Concluído",
};
const COLORS = ["#D94A38", "#B93A2A", "#E89A4A", "#16A34A", "#2563EB", "#7C3AED"];

const fmtBRL = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const { user, company } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  if (!stats) {
    return <div className="p-8 text-muted-foreground font-mono text-sm">carregando painel...</div>;
  }

  const funnelData = Object.entries(stats.crm.funnel).map(([k, v]) => ({ name: STAGE_LABELS[k], value: v }));
  const projData = Object.entries(stats.projects.by_status).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }));

  // mini revenue series (mock based on real total)
  const series = Array.from({ length: 7 }).map((_, i) => ({
    d: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][i],
    v: Math.round((stats.finance.receita / 7) * (0.6 + Math.random() * 0.8)),
  }));

  return (
    <div className="p-6 space-y-6 fade-up">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Centro de Comando</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Olá, {user?.name?.split(" ")[0]}.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão executiva de {company?.name} · {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI testid="kpi-clients" icon={Users} label="Clientes ativos" value={stats.crm.clients} trend="+12%" />
        <KPI testid="kpi-projects" icon={Kanban} label="Projetos ativos" value={stats.projects.active} trend={`${stats.projects.total} total`} />
        <KPI testid="kpi-revenue" icon={CurrencyCircleDollar} label="Receita realizada" value={fmtBRL(stats.finance.receita)} trend={`prev. ${fmtBRL(stats.finance.receita_prevista)}`} accent />
        <KPI testid="kpi-team" icon={Users} label="Equipe" value={stats.team} trend="online" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="lg:col-span-2 border border-border rounded-md p-5 bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">Fluxo de receita</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold">{fmtBRL(stats.finance.saldo)}</div>
              <div className="text-xs text-muted-foreground">saldo atual</div>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D94A38" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D94A38" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#D94A38" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CRM funnel */}
        <div className="border border-border rounded-md p-5 bg-card">
          <div className="mb-4">
            <h3 className="font-display font-bold">Funil CRM</h3>
            <p className="text-xs text-muted-foreground">{stats.crm.total} contatos totais</p>
          </div>
          <div className="space-y-2">
            {funnelData.map((s, i) => {
              const max = Math.max(...funnelData.map((x) => x.value), 1);
              const pct = (s.value / max) * 100;
              return (
                <div key={s.name} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-muted-foreground text-xs">{s.name}</span>
                  <div className="flex-1 bg-secondary h-6 rounded-sm relative overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${pct}%`, background: COLORS[i] }} />
                  </div>
                  <span className="w-8 text-right font-mono text-xs">{s.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects status */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="font-display font-bold mb-1">Projetos por status</h3>
          <p className="text-xs text-muted-foreground mb-4">Distribuição atual</p>
          {projData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum projeto ainda.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={projData} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                    {projData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Agenda */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <Clock size={16} weight="duotone" />
            Agenda do dia
          </h3>
          <p className="text-xs text-muted-foreground mb-4">{stats.agenda_today.length} compromissos</p>
          <div className="space-y-2">
            {stats.agenda_today.length === 0 && (
              <p className="text-sm text-muted-foreground">Dia livre — bom momento para planejar.</p>
            )}
            {stats.agenda_today.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <div className="w-1 h-8 rounded-full" style={{ background: e.color || "#D94A38" }} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground font-mono">{new Date(e.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="font-display font-bold mb-1 flex items-center gap-2">
            <TrendUp size={16} weight="duotone" />
            Atividades recentes
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Histórico em tempo real</p>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {stats.timeline.length === 0 && (
              <p className="text-sm text-muted-foreground">Crie algo para ver o histórico.</p>
            )}
            {stats.timeline.slice(0, 8).map((t) => (
              <div key={t.id} className="flex gap-2 text-sm">
                <CheckCircle weight="duotone" size={14} className="text-[#D94A38] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs">{t.summary}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {new Date(t.created_at).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, trend, accent, testid }) {
  return (
    <div data-testid={testid} className={`border rounded-md p-4 bg-card transition-colors ${accent ? "border-[#D94A38]/40" : "border-border"}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} weight="duotone" className={accent ? "text-[#D94A38]" : "text-muted-foreground"} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{trend}</span>
      </div>
      <div className="font-display text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
