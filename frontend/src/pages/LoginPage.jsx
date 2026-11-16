import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Users } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle.jsx";
import Footer from "../components/layout/Footer.jsx";
import { EsqueciCard, LoginCard, PrimeiroAcessoCard, RedefinirCard } from "../features/AcessoCards.jsx";
import { statusPrimeiroAcesso } from "../services/authService.js";

const tokenDaUrl = () => new URLSearchParams(window.location.search).get("redefinir");
const limparUrl = () => window.history.replaceState(null, "", window.location.pathname);

export default function LoginPage() {
  // "login" | "esqueci" | "redefinir" (link do e-mail) | "primeiro" (sistema sem nenhuma conta)
  const [token] = useState(tokenDaUrl);
  const [modo, setModo] = useState(token ? "redefinir" : "login");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (token) return;
    statusPrimeiroAcesso()
      .then((r) => r?.necessario && setModo("primeiro"))
      .catch(() => {});
  }, [token]);

  const irParaLogin = (mensagem = "") => {
    limparUrl();
    setAviso(mensagem);
    setModo("login");
  };

  const cartao = {
    login: <LoginCard aviso={aviso} onEsqueci={() => setModo("esqueci")} />,
    esqueci: <EsqueciCard onVoltar={() => irParaLogin()} />,
    redefinir: <RedefinirCard token={token} onVoltar={() => irParaLogin()} onConcluido={() => irParaLogin("Senha redefinida. Entre com a nova senha.")} />,
    primeiro: <PrimeiroAcessoCard />,
  }[modo];

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
              {cartao}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé institucional com créditos */}
      <Footer className="border-t border-line bg-panel/80" />
    </div>
  );
}
