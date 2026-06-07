import { useEffect, useState } from "react";
import api from "@/lib/apiClient";
import { Plus, X, ArrowUp, ArrowDown } from "@phosphor-icons/react";
import { FormModal, Field } from "@/pages/CRM";

const STATUS = ["pendente", "pago", "vencido"];
const fmtBRL = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export default function Finance() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: "", amount: 0, type: "receita", category: "geral", status: "pendente", due_date: "" });

  const load = () => api.get("/finance").then(({ data }) => setItems(data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post("/finance", { ...form, amount: Number(form.amount) || 0 });
    setForm({ description: "", amount: 0, type: "receita", category: "geral", status: "pendente", due_date: "" });
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir?")) return;
    await api.delete(`/finance/${id}`);
    load();
  };

  const toggleStatus = async (it) => {
    const newStatus = it.status === "pago" ? "pendente" : "pago";
    await api.put(`/finance/${it.id}`, { ...it, status: newStatus });
    load();
  };

  const receita = items.filter((i) => i.type === "receita" && i.status === "pago").reduce((s, i) => s + i.amount, 0);
  const despesa = items.filter((i) => i.type === "despesa" && i.status === "pago").reduce((s, i) => s + i.amount, 0);
  const previsto = items.filter((i) => i.type === "receita" && i.status === "pendente").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-6 space-y-4 fade-up">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Controle</div>
          <h1 className="font-display text-3xl font-bold tracking-tight mt-1">Financeiro</h1>
        </div>
        <button data-testid="finance-add" onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#D94A38] hover:bg-[#B93A2A] text-white px-3 py-2 rounded-md text-sm font-medium">
          <Plus size={14} weight="bold" /> Nova entrada
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Stat label="Receita realizada" value={fmtBRL(receita)} accent="success" icon={ArrowUp} />
        <Stat label="Despesa realizada" value={fmtBRL(despesa)} accent="destructive" icon={ArrowDown} />
        <Stat label="Saldo" value={fmtBRL(receita - despesa)} accent="primary" />
        <Stat label="Receita prevista" value={fmtBRL(previsto)} />
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden" data-testid="finance-table">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2">Descrição</th>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-left px-4 py-2">Categoria</th>
              <th className="text-right px-4 py-2">Valor</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Vencimento</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-border hover:bg-accent/30">
                <td className="px-4 py-2.5 font-medium">{it.description}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${it.type === "receita" ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"}`}>{it.type}</span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{it.category}</td>
                <td className={`px-4 py-2.5 text-right font-mono ${it.type === "receita" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{fmtBRL(it.amount)}</td>
                <td className="px-4 py-2.5"><button data-testid={`status-${it.id}`} onClick={() => toggleStatus(it)} className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${it.status === "pago" ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"}`}>{it.status}</button></td>
                <td className="px-4 py-2.5 font-mono text-xs">{it.due_date || "—"}</td>
                <td className="px-4 py-2.5 text-right"><button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive"><X size={14} /></button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma entrada financeira.</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <FormModal title="Nova entrada" onClose={() => setShowForm(false)} onSubmit={create}>
          <Field label="Descrição" value={form.description} onChange={(v) => setForm({ ...form, description: v })} required />
          <Field label="Valor (R$)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} type="number" required />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <Field label="Categoria" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full mt-1 px-3 py-2 bg-transparent border border-border rounded-md text-sm focus:border-[#D94A38] focus:outline-none">
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Vencimento" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} type="date" />
        </FormModal>
      )}
    </div>
  );
}

function Stat({ label, value, accent, icon: Icon }) {
  const colorMap = {
    success: "border-green-500/30 text-green-700 dark:text-green-400",
    destructive: "border-red-500/30 text-red-700 dark:text-red-400",
    primary: "border-[#D94A38]/40 text-[#D94A38]",
  };
  return (
    <div className={`border rounded-md p-4 bg-card ${colorMap[accent] || "border-border"}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <div className="font-display text-2xl font-bold tracking-tight mt-1">{value}</div>
    </div>
  );
}
