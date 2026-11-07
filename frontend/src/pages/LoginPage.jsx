import { useState } from "react";
import { ArrowRight, BookOpen, Sparkles, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Footer from "../components/layout/Footer.jsx";

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
    <div className="flex min-h-screen flex-col justify-between bg-paper text-ink transition-colors selection:bg-clay-soft">
      {/* Barra superior de acolhimento e acessibilidade */}
      <header className="border-b border-line bg-panel/80 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-6 py-4 sm:px-8">
          <div className="flex items-center gap-3.5">
            <img
              src="/favicon.svg"
              alt="Logotipo da Biblioteca Camugerê"
              className="size-11 rounded-lg ring-1 ring-line shadow-xs"
            />
            <div className="leading-tight">
              <span className="font-display font-extrabold text-xl tracking-tight text-ink">
                Camugerê
              </span>
              <p className="text-xs font-semibold text-ink-muted">
                Biblioteca Comunitária • Espaço Cultural Casa da Democracia
              </p>
            </div>
          </div>

          <ThemeToggle
            showLabel
            variant="secondary"
            className="border-[1.5px] border-line font-medium hover:bg-sunken shadow-xs"
          />
        </div>
      </header>

      {/* Conteúdo central: Apresentação da biblioteca + Card de login acessível */}
      <main className="mx-auto my-auto flex w-full max-w-[1240px] flex-1 items-center px-6 py-10 sm:px-8 sm:py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 xl:gap-20">
          {/* Lado Esquerdo: Mensagem e contexto da biblioteca */}
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-forest-soft px-4 py-1.5 text-xs font-bold tracking-wider text-forest uppercase shadow-xs">
                <Sparkles size={14} className="text-forest" />
                Portal da Equipe e Voluntários
              </span>

              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl leading-[1.16] text-ink">
                Um acervo que circula é um acervo vivo.
              </h1>

              <p className="text-base sm:text-lg leading-relaxed text-ink-soft">
                Sistema de gestão da biblioteca comunitária. Aqui você controla o catálogo de obras,
                cadastra leitores e acompanha os empréstimos em um ambiente simples, acolhedor e acessível para todas as idades.
              </p>
            </div>

            {/* Cartões informativos de fácil visualização */}
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-start gap-4 rounded-xl border border-line bg-panel p-4.5 shadow-xs transition-colors">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                  <BookOpen size={22} />
                </div>
                <div className="leading-snug">
                  <h2 className="text-base font-bold text-ink">Consulta e Acervo Simples</h2>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                    Catálogo organizado por temas, autores e exemplares com numeração visível.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-line bg-panel p-4.5 shadow-xs transition-colors">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-forest-soft text-forest">
                  <Users size={22} />
                </div>
                <div className="leading-snug">
                  <h2 className="text-base font-bold text-ink">Empréstimos sem Complicação</h2>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                    Registro rápido de retiradas e devoluções para incentivar a leitura na comunidade.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs font-medium text-ink-muted">
              Projeto de extensão universitária em apoio à democratização do livro e da leitura.
            </p>
          </div>

          {/* Lado Direito: Card de Login calibrado para conforto e acessibilidade */}
          <div className="w-full max-w-[480px] mx-auto lg:ml-auto">
            <div className="rounded-2xl border-2 border-line bg-panel p-8 sm:p-10 shadow-card">
              <div className="mb-7">
                <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-ink">
                  Entrar no Sistema
                </h2>
                <p className="mt-2 text-base text-ink-muted leading-relaxed">
                  Digite seu e-mail e sua senha cadastrados para acessar o painel.
                </p>
              </div>

              {exitReason === "expired" && !error && (
                <div
                  role="status"
                  className="mb-6 rounded-xl border border-warn/30 bg-warn-soft p-4 text-sm font-semibold text-warn leading-relaxed"
                >
                  Sua sessão expirou por segurança. Por favor, entre novamente.
                </div>
              )}

              <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="block text-base font-bold text-ink"
                  >
                    E-mail de acesso
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="exemplo: admin@camugere.org"
                    required
                    autoFocus
                    className="h-14 w-full rounded-xl border-2 border-line bg-sunken px-4 text-base sm:text-lg text-ink placeholder:text-ink-muted/60 transition-all hover:border-field focus:border-forest focus:bg-panel focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="login-senha"
                    className="block text-base font-bold text-ink"
                  >
                    Senha
                  </label>
                  <input
                    id="login-senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    required
                    className="h-14 w-full rounded-xl border-2 border-line bg-sunken px-4 text-base sm:text-lg text-ink placeholder:text-ink-muted/60 transition-all hover:border-field focus:border-forest focus:bg-panel focus:outline-none"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm font-semibold text-danger leading-relaxed"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl bg-forest px-6 text-lg font-extrabold text-on-forest shadow-sm transition-all hover:bg-forest-strong hover:shadow-md active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Entrando no sistema..." : "Entrar no sistema"}
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé institucional com créditos */}
      <Footer className="border-t border-line bg-panel/80" />
    </div>
  );
}
