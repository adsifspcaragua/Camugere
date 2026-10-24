import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import { TextField } from "../components/ui/Field.jsx";

export default function LoginPage() {
  const { login, exitReason } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), senha);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest p-12 text-on-forest lg:flex">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="size-9 rounded-md ring-1 ring-white/20" />
          <span className="font-display text-lg">Camugerê</span>
        </div>
        <div className="max-w-md">
          <p className="mb-4 text-xs tracking-[0.18em] uppercase opacity-70">Biblioteca comunitária</p>
          <p className="font-display text-[40px] leading-[1.1]">Um acervo que circula é um acervo vivo.</p>
          <p className="mt-5 text-sm leading-relaxed opacity-75">
            Sistema de gestão da biblioteca do Espaço Cultural Casa da Democracia — acervo, leitores e empréstimos em um só lugar.
          </p>
        </div>
        <p className="text-xs opacity-60">Projeto de extensão universitária</p>
        {/* lombadas decorativas */}
        <div aria-hidden className="pointer-events-none absolute right-10 bottom-0 flex items-end gap-1.5 opacity-[0.14]">
          {[180, 240, 150, 300, 210, 260, 170].map((h, i) => (
            <span key={i} style={{ height: h }} className="w-7 rounded-t-sm border border-current" />
          ))}
        </div>
      </aside>

      <main className="flex items-center justify-center bg-paper px-6 py-16">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-medium text-ink">Entrar</h1>
          <p className="mt-2 mb-8 text-sm text-ink-muted">Acesso restrito à equipe da biblioteca.</p>
          {exitReason === "expired" && !error && (
            <p role="status" className="mb-5 rounded-xl bg-warn-soft px-3.5 py-2.5 text-sm text-warn">
              Sua sessão expirou. Entre de novo para continuar de onde parou.
            </p>
          )}
          <div className="space-y-4">
            <TextField label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
            <TextField label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" loading={loading} className="mt-6 w-full justify-center">
            Entrar <ArrowRight size={16} />
          </Button>
        </form>
      </main>
    </div>
  );
}
