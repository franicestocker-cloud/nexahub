import { useState, useEffect } from "react";
import api from "@/lib/apiClient";
import { MagnifyingGlass, X } from "@phosphor-icons/react";

export default function GlobalSearch({ open, onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(q)}`).then(({ data }) => setResults(data)).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" data-testid="search-modal" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-background border border-border rounded-md shadow-2xl fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center px-4 h-12 border-b border-border gap-2">
          <MagnifyingGlass size={16} className="text-muted-foreground" />
          <input
            data-testid="search-input"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar clientes, projetos, agenda, financeiro..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button onClick={onClose}><X size={14} /></button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && q && (
            <div className="p-6 text-center text-sm text-muted-foreground">Nada encontrado.</div>
          )}
          {results.map((r) => (
            <div key={r.id} className="px-4 py-2.5 border-b border-border hover:bg-accent cursor-pointer flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{r.entity}</span>
              <span className="text-sm">{r.title || "(sem título)"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
