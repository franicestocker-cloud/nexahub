import { useState, useEffect } from "react";
import api from "@/lib/apiClient";
import { useAuth } from "@/context/AuthContext";
import { Plus, X, Cube, Check } from "@phosphor-icons/react";
import { FormModal, Field } from "@/pages/CRM";

const ICONS = ["Cube", "Gauge", "Funnel", "Kanban", "CalendarBlank", "CurrencyCircleDollar", "Users", "UsersThree", "Gear"];
const COLORS = ["#D94A38", "#2563EB", "#16A34A", "#7C3AED", "#D97706", "#0EA5E9", "#EC4899"];

export default function Settings() {
  const { company, updateCompany } = useAuth();
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ name: "", segment: "", primary_color: "#D94A38", platform_name: "" });
  const [saved, setSaved] = useState(false);
  const [showModForm, setShowModForm] = useState(false);
  const [modForm, setModForm] = useState({ name: "", icon: "Cube", color: "#D94A38", order: 99, active: true, fields: [] });

  useEffect(() => {
    if (company) setForm({
      name: company.name || "",
      segment: company.segment || "",
      primary_color: company.primary_color || "#D94A38",
      platform_name: company.platform_name || "NexaHub",
    });
  }, [company]);

  const loadModules = () => api.get("/modules").then(({ data }) => setModules(data));
  useEffect(() => { loadModules(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await updateCompany(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const createModule = async (e) => {
    e.preventDefault();
    await api.post("/modules", modForm);
    setModForm({ name: "", icon: "Cube", color: "#D94A38", order: 99, active: true, fields: [] });
    setShowModForm(false);
    loadModules();
  };

  const toggleMod = async (m) => {
    await api.put(`/modules/${m.id}`, { ...m, active: !m.active });
    loadModules();
  };

  const removeMod = async (m) => {
    if (m.is_native) return alert("Módulo nativo não pode ser excluído");
    if (!window.confirm("Excluir módulo?")) return;
    await api.delete(`/modules/${m.id}`);
    loadModules();
  };

  return (
    <div className="p-6 space-y-6 fade-up max-w-5xl">
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Personalização</div>
        <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">White-label completo · sem programação</p>
      </div>

      {/* White-label */}
      <form onSubmit={save} className="border border-border rounded-md bg-card p-6 space-y-4" data-testid="company-form">
        <h2 className="font-display font-bold text-lg">Identidade da empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome da empresa" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Nome da plataforma" value={form.platform_name} onChange={(v) => setForm({ ...form, platform_name: v })} />
          <Field label="Segmento" value={form.segment} onChange={(v) => setForm({ ...form, segment: v })} />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cor principal</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-10 rounded border border-border bg-transparent cursor-pointer" />
              <input type="text" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1 px-3 py-2 bg-transparent border border-border rounded-md font-mono text-sm focus:outline-none focus:border-[#D94A38]" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button data-testid="save-company" type="submit" className="bg-[#D94A38] hover:bg-[#B93A2A] text-white px-4 py-2 rounded-md text-sm font-medium">Salvar identidade</button>
          {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check size={14} weight="bold" /> Salvo</span>}
        </div>
      </form>

      {/* Modules */}
      <div className="border border-border rounded-md bg-card p-6 space-y-4" data-testid="modules-section">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg">Módulos da plataforma</h2>
            <p className="text-sm text-muted-foreground">Crie, ative ou edite módulos. {modules.length} módulos.</p>
          </div>
          <button data-testid="module-add" onClick={() => setShowModForm(true)} className="flex items-center gap-2 bg-[#D94A38] hover:bg-[#B93A2A] text-white px-3 py-2 rounded-md text-sm">
            <Plus size={14} weight="bold" /> Novo módulo
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {modules.map((m) => (
            <div key={m.id} className={`border rounded-md p-3 group flex items-center gap-3 transition-colors ${m.active ? "border-border bg-background" : "border-dashed border-border bg-secondary/40 opacity-60"}`}>
              <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: `${m.color}20`, color: m.color }}>
                <Cube size={18} weight="duotone" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{m.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {m.is_native ? "Nativo" : "Custom"} · {m.active ? "Ativo" : "Inativo"}
                </div>
              </div>
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => toggleMod(m)} title="Toggle" className="text-xs text-muted-foreground hover:text-foreground">{m.active ? "off" : "on"}</button>
                {!m.is_native && <button onClick={() => removeMod(m)} className="text-muted-foreground hover:text-destructive"><X size={12} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModForm && (
        <FormModal title="Criar módulo" onClose={() => setShowModForm(false)} onSubmit={createModule}>
          <Field label="Nome" value={modForm.name} onChange={(v) => setModForm({ ...modForm, name: v })} required />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Ícone</label>
            <select value={modForm.icon} onChange={(e) => setModForm({ ...modForm, icon: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              {ICONS.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cor</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setModForm({ ...modForm, color: c })} className={`w-7 h-7 rounded-md border-2 ${modForm.color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
