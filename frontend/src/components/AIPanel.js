import { useState } from "react";
import api from "@/lib/apiClient";
import { Sparkle, PaperPlaneTilt, X } from "@phosphor-icons/react";

export default function AIPanel({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Olá! Sou seu assistente NexaHub. Posso criar tarefas, resumir projetos, sugerir pautas e analisar sua operação. O que precisa?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat-sync", { message: userMsg });
      setMessages((m) => [...m, { role: "ai", text: data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "ai", text: "Erro ao consultar IA. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex" data-testid="ai-panel">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-l border-border flex flex-col fade-up">
        <div className="h-14 border-b border-border flex items-center px-4 gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#D94A38] to-[#B93A2A] flex items-center justify-center">
            <Sparkle weight="fill" size={14} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm">Assistente NexaHub</div>
            <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Gemini 3.1 Pro</div>
          </div>
          <button onClick={onClose} data-testid="ai-close" className="ml-auto p-1.5 hover:bg-accent rounded-md">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-md text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-[#D94A38] text-white"
                  : "bg-secondary text-foreground"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-secondary px-3 py-2 rounded-md text-sm text-muted-foreground">pensando...</div>
            </div>
          )}
        </div>

        <form onSubmit={send} className="p-3 border-t border-border flex gap-2">
          <input
            data-testid="ai-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte qualquer coisa..."
            className="flex-1 px-3 py-2 bg-secondary border border-transparent rounded-md text-sm focus:outline-none focus:border-[#D94A38]"
            disabled={loading}
          />
          <button data-testid="ai-send" type="submit" disabled={loading || !input.trim()} className="px-3 bg-[#D94A38] hover:bg-[#B93A2A] text-white rounded-md disabled:opacity-50">
            <PaperPlaneTilt size={16} weight="fill" />
          </button>
        </form>
      </div>
    </div>
  );
}
