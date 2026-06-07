import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fmtError } from "@/lib/apiClient";
import { Lightning, ArrowRight } from "@phosphor-icons/react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@nexahub.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (e) {
      setError(fmtError(e.response?.data?.detail) || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-stone-900 dark:bg-stone-950 text-stone-100 p-12 auth-grid relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-md bg-[#D94A38] flex items-center justify-center">
            <Lightning weight="fill" size={22} className="text-white" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight">NexaHub</span>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">
            Plataforma Inteligente
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] mb-6">
            Sua empresa,<br />
            <span className="text-[#D94A38]">em um único lugar.</span>
          </h1>
          <p className="text-stone-300 leading-relaxed">
            Gestão completa, multiempresa, white label e com IA nativa.
            Adapte a plataforma à sua operação — sem programar uma linha de código.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-display text-2xl font-bold text-[#D94A38]">12</div>
            <div className="text-stone-400 text-xs uppercase tracking-wider">Módulos nativos</div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-[#D94A38]">∞</div>
            <div className="text-stone-400 text-xs uppercase tracking-wider">Customização</div>
          </div>
          <div>
            <div className="font-display text-2xl font-bold text-[#D94A38]">IA</div>
            <div className="text-stone-400 text-xs uppercase tracking-wider">Gemini integrado</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <form onSubmit={handle} className="w-full max-w-sm space-y-6 fade-up" data-testid="login-form">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-md bg-[#D94A38] flex items-center justify-center">
              <Lightning weight="fill" size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold">NexaHub</span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">Acesse seu painel executivo</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">E-mail</label>
              <input
                data-testid="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Senha</label>
              <input
                data-testid="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2.5 bg-transparent border border-border rounded-md focus:outline-none focus:border-[#D94A38] transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div data-testid="login-error" className="text-sm text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-[#D94A38] hover:bg-[#B93A2A] text-white font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
            <ArrowRight weight="bold" size={16} />
          </button>

          <div className="text-sm text-center text-muted-foreground">
            Não tem conta?{" "}
            <Link data-testid="goto-signup" to="/signup" className="text-[#D94A38] hover:underline font-medium">
              Criar empresa
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
