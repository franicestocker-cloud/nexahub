import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { Plus, X } from "@phosphor-icons/react";
import { FormModal, Field } from "@/pages/CRM";

const STATUS = [
  { id: "novo", label: "Novo", color: "#A8A29E" },
  { id: "em_andamento", label: "Em andamento", color: "#2563EB" },
  { id: "producao", label: "Produção", color: "#D97706" },
  { id: "aguardando", label: "Aguardando", color: "#7C3AED" },
  { id: "revisao", label: "Revisão", color: "#E11D48" },
  { id: "concluido", label: "Concluído", color: "#16A34A" },
];
const PRIORITIES = ["baixa", "media", "alta", "urgente"];

export default function Projects() {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("kanban");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", status: "novo", priority: "media", due_date: "", progress: 0 });

  const load = () => api.get("/projects").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/projects", { ...form, progress: Number(form.progress) || 0 });
    setForm({ title: "", description: "", status: "novo", priority: "media", due_date: "", progress: 0 });
    setShowForm(false);
    load();
  };

  const move = async (it, st) => {
    await api.put(`/projects/${it.id}`, { ...it, status: st });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Mover para lixeira?")) return;
    await api.delete(`/projects/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-4 fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Operação</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Projetos</h1>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex border border-border rounded-md overflow-hidden">
            {["kanban", "list"].map((v) => (
              <button key={v} data-testid={`view-${v}`} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs uppercase tracking-wider ${view === v ? "bg-[#D94A38] text-white" : "hover:bg-accent"}`}>{v}</button>
            ))}
          </div>
          <button data-testid="project-add" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#D94A38] hover:bg-[#B93A2A] text-white px-3 py-2 rounded-md text-sm font-medium">
            <Plus size={14} weight="bold" /> Novo projeto
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3" data-testid="projects-board">
          {STATUS.map((s) => {
            const list = items.filter((i) => i.status === s.id);
            return (
              <div key={s.id} className="border border-border rounded-md bg-card flex flex-col min-h-[400px]">
                <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{list.length}</span>
                </div>
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
                  {list.map((it) => (
                    <div key={it.id} className="border border-border rounded-md p-2.5 bg-background hover:border-[#D94A38]/40 group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{it.title}</div>
                        <button onClick={() => remove(it.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><X size={12} /></button>
                      </div>
                      {it.description && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{it.description}</div>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          it.priority === "urgente" ? "bg-destructive/20 text-destructive" :
                          it.priority === "alta" ? "bg-[#D97706]/20 text-[#D97706]" :
                          "bg-secondary text-muted-foreground"
                        }`}>{it.priority}</span>
                        {it.due_date && <span className="text-[10px] text-muted-foreground font-mono">{it.due_date}</span>}
                      </div>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {STATUS.filter((x) => x.id !== it.status).slice(0, 3).map((x) => (
                          <button key={x.id} onClick={() => move(it, x.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary hover:bg-accent uppercase">→ {x.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2">Título</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Prioridade</th>
                <th className="text-left px-4 py-2">Prazo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-border hover:bg-accent/30">
                  <td className="px-4 py-2.5 font-medium">{it.title}</td>
                  <td className="px-4 py-2.5">{STATUS.find((s) => s.id === it.status)?.label || it.status}</td>
                  <td className="px-4 py-2.5">{it.priority}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{it.due_date || "—"}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum projeto. Crie o primeiro.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <FormModal title="Novo projeto" onClose={() => setShowForm(false)} onSubmit={create}>
          <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Prazo" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} type="date" />
        </FormModal>
      )}
    </div>
  );
}
