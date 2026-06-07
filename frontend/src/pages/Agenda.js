import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { Plus, X, CalendarBlank } from "@phosphor-icons/react";
import { FormModal, Field } from "@/pages/CRM";

const TYPES = ["evento", "reuniao", "tarefa", "prazo"];
const COLORS = ["#D94A38", "#2563EB", "#16A34A", "#7C3AED", "#D97706"];

export default function Agenda() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", start: "", end: "", type: "evento", color: "#D94A38" });

  const load = () => api.get("/agenda").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/agenda", form);
    setForm({ title: "", description: "", start: "", end: "", type: "evento", color: "#D94A38" });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir?")) return;
    await api.delete(`/agenda/${id}`);
    load();
  };

  // Group by date
  const grouped = items.reduce((acc, e) => {
    const d = e.start ? new Date(e.start).toLocaleDateString("pt-BR") : "sem data";
    acc[d] = acc[d] || [];
    acc[d].push(e);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Calendário</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Agenda</h1>
        </div>
        <button data-testid="agenda-add" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#D94A38] hover:bg-[#B93A2A] text-white px-3 py-2 rounded-md text-sm font-medium">
          <Plus size={14} weight="bold" /> Novo evento
        </button>
      </div>

      <div className="space-y-4" data-testid="agenda-list">
        {Object.keys(grouped).length === 0 && (
          <div className="border border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
            <CalendarBlank size={32} weight="duotone" className="mx-auto mb-2 text-[#D94A38]" />
            <p className="text-sm">Nenhum compromisso. Crie seu primeiro evento.</p>
          </div>
        )}
        {Object.entries(grouped).map(([date, list]) => (
          <div key={date} className="border border-border rounded-md bg-card">
            <div className="px-4 py-2 border-b border-border bg-secondary/40">
              <span className="text-xs uppercase tracking-wider font-medium">{date}</span>
              <span className="ml-2 text-xs text-muted-foreground">· {list.length} evento(s)</span>
            </div>
            <div>
              {list.map((e) => (
                <div key={e.id} className="px-4 py-3 border-t border-border first:border-t-0 flex items-center gap-3 group hover:bg-accent/30">
                  <div className="w-1 h-10 rounded-full" style={{ background: e.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{e.title}</div>
                    {e.description && <div className="text-xs text-muted-foreground truncate">{e.description}</div>}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {e.start && new Date(e.start).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary">{e.type}</span>
                  <button onClick={() => remove(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title="Novo evento" onClose={() => setShowForm(false)} onSubmit={create}>
          <Field label="Título" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
          <Field label="Início" value={form.start} onChange={(v) => setForm({ ...form, start: v })} type="datetime-local" required />
          <Field label="Fim" value={form.end} onChange={(v) => setForm({ ...form, end: v })} type="datetime-local" />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Cor</label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-md border-2 ${form.color === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />
              ))}
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}
