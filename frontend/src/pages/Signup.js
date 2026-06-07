import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fmtError } from "@/lib/apiClient";
import { Lightning, ArrowRight } from "@phosphor-icons/react";

const SEGMENTS = ["Agência", "Clínica", "Terapia", "Jurídico", "Arquitetura", "Consultoria", "Imobiliária", "Educação", "Personalizado"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company_name: "",
    segment: "Agência",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(form);
      navigate("/");
    } catch (e) {
      setError(fmtError(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-stone-900 dark:bg-stone-950 text-stone-100 p-12 auth-grid relative">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-md bg-[#D94A38] flex items-center justify-center">
            <Lightning weight="fill" size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-bold">NexaHub</span>
        </div>
        <div className="relative z-10 max-w-md">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">Comece agora</div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] mb-6">
            Crie sua<br />
            <span className="text-[#D94A38]">plataforma própria.</span>
          </h1>
          <p className="text-stone-300 leading-relaxed">
            Em segundos sua empresa está pronta. Escolha um template,
            adapte os módulos e comece a operar.
          </p>
        </div>
        <div className="relative z-10 text-xs text-stone-500 font-mono">
          v1.0 · Multi-empresa · White Label · IA Nativa
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={handle} className="w-full max-w-sm space-y-5 fade-up" data-testid="signup-form">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-md bg-[#D94A38] flex items-center justify-center">
              <Lightning weight="fill" size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold">NexaHub</span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Criar empresa</h2>
            <p className="text-sm text-muted-foreground mt-1">Você será o CEO da sua plataforma</p>
          </div>

          <div className="space-y-3">
            {[
              { k: "name", label: "Seu nome", type: "text" },
              { k: "email", label: "E-mail", type: "email" },
              { k: "password", label: "Senha", type: "password" },
              { k: "company_name", label: "Nome da empresa", type: "text" },
            ].map((f) => (
              <div key={f.k}>
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{f.label}</label>
                <input
                  data-testid={`signup-${f.k}`}
                  type={f.type}
                  value={form[f.k]}
                  onChange={set(f.k)}
                  required
                  className="w-full mt-1 px-3 py-2.5 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Segmento</label>
              <select
                data-testid="signup-segment"
                value={form.segment}
                onChange={set("segment")}
                className="w-full mt-1 px-3 py-2.5 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] transition-colors"
              >
                {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div data-testid="signup-error" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            data-testid="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[#D94A38] hover:bg-[#B93A2A] text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar plataforma"}
            <ArrowRight weight="bold" size={16} />
          </button>

          <div className="text-sm text-center text-muted-foreground">
            Já tem conta?{" "}
            <Link data-testid="goto-login" to="/login" className="text-[#D94A38] hover:underline font-medium">
              Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
