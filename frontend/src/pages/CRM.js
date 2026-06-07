import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { Plus, X, DotsThree } from "@phosphor-icons/react";

const STAGES = [
  { id: "lead", label: "Lead", color: "#A8A29E" },
  { id: "contact", label: "Contato", color: "#2563EB" },
  { id: "proposal", label: "Proposta", color: "#D97706" },
  { id: "negotiation", label: "Negociação", color: "#7C3AED" },
  { id: "client", label: "Cliente", color: "#16A34A" },
];

const fmtBRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);

export default function CRM() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", value: 0, stage: "lead", notes: "" });

  const load = () => api.get("/crm").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/crm", { ...form, value: Number(form.value) || 0 });
    setForm({ name: "", email: "", phone: "", value: 0, stage: "lead", notes: "" });
    setShowForm(false);
    load();
  };

  const moveStage = async (item, newStage) => {
    await api.put(`/crm/${item.id}`, { ...item, stage: newStage });
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Mover para lixeira?")) return;
    await api.delete(`/crm/${id}`);
    load();
  };

  return (
    <div className="p-6 space-y-4 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pipeline</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1">CRM</h1>
        </div>
        <button data-testid="crm-add" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#D94A38] hover:bg-[#B93A2A] text-white px-3 py-2 rounded-md text-sm font-medium">
          <Plus size={14} weight="bold" /> Novo contato
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3" data-testid="crm-board">
        {STAGES.map((s) => {
          const stageItems = items.filter((i) => i.stage === s.id);
          return (
            <div key={s.id} className="border border-border rounded-md bg-card flex flex-col min-h-[400px]">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">{stageItems.length}</span>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[600px]">
                {stageItems.map((it) => (
                  <div key={it.id} className="border border-border rounded-md p-2.5 bg-background hover:border-[#D94A38]/40 group cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm truncate">{it.name}</div>
                      <button onClick={() => remove(it.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <X size={12} />
                      </button>
                    </div>
                    {it.email && <div className="text-xs text-muted-foreground truncate">{it.email}</div>}
                    {it.value > 0 && <div className="text-xs font-mono mt-1 text-[#D94A38]">{fmtBRL(it.value)}</div>}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {STAGES.filter((x) => x.id !== it.stage).map((x) => (
                        <button key={x.id} onClick={() => moveStage(it, x.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-secondary hover:bg-accent uppercase tracking-wider">
                          → {x.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <FormModal title="Novo contato" onClose={() => setShowForm(false)} onSubmit={create}>
          <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field label="Valor (R$)" value={form.value} onChange={(v) => setForm({ ...form, value: v })} type="number" />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Estágio</label>
            <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38]">
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </FormModal>
      )}
    </div>
  );
}

export function FormModal({ title, onClose, onSubmit, children, submitLabel = "Salvar" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} data-testid="form-modal">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <form onSubmit={onSubmit} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-card border border-border rounded-md shadow-xl fade-up">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">{title}</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">{children}</div>
        <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm hover:bg-accent rounded-md">Cancelar</button>
          <button data-testid="form-submit" type="submit" className="px-3 py-1.5 text-sm bg-[#D94A38] hover:bg-[#B93A2A] text-white rounded-md">{submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

export function Field({ label, value, onChange, type = "text", required, textarea }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} required={required} rows={3} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] text-sm" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] text-sm" />
      )}
    </div>
  );
}
