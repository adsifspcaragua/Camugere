import { useCallback, useMemo, useRef, useState } from "react";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { LibraryProvider, useLibrary } from "./context/LibraryContext.jsx";
import { ConfirmProvider } from "./context/ConfirmContext.jsx";
import { useHotkeys } from "./hooks/useHotkeys.js";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import Spinner from "./components/ui/Spinner.jsx";
import Button from "./components/ui/Button.jsx";
import ConnectionBanner from "./components/ConnectionBanner.jsx";
import NotificationBell from "./components/NotificationBell.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import NewLoanDrawer from "./features/NewLoanDrawer.jsx";
import ReturnDrawer from "./features/ReturnDrawer.jsx";
import ObraDrawer from "./features/ObraDrawer.jsx";
import LeitorDrawer from "./features/LeitorDrawer.jsx";
import LeitorDetalheDrawer from "./features/LeitorDetalheDrawer.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AcervoPage from "./pages/AcervoPage.jsx";
import EmprestimosPage from "./pages/EmprestimosPage.jsx";
import LeitoresPage from "./pages/LeitoresPage.jsx";
import RelatoriosPage from "./pages/RelatoriosPage.jsx";
import ConfiguracoesPage from "./pages/ConfiguracoesPage.jsx";

// Um único drawer aberto por vez: { type: "loan" | "return" | "obra" | "leitor" | "leitorDetalhe", payload }
function useDrawer() {
  const [drawer, setDrawer] = useState(null);
  const open = useCallback((type, payload = null) => setDrawer({ type, payload }), []);
  const close = useCallback(() => setDrawer(null), []);
  const is = (type) => drawer?.type === type;
  return { drawer, open, close, is };
}

function Workspace() {
  const { loading, stats, reload } = useLibrary();
  const [page, setPage] = useState("inicio");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const { drawer, open, close, is } = useDrawer();

  const navigate = useCallback((id) => {
    setPage(id);
    setMenuOpen(false);
    if (id !== "acervo") setSearch("");
    window.scrollTo({ top: 0 });
  }, []);

  const onSearch = (value) => {
    setSearch(value);
    if (value && page !== "acervo") setPage("acervo");
  };

  const hotkeys = useMemo(
    () => ({
      n: () => open("loan"),
      d: () => open("return"),
      "/": () => searchRef.current?.focus(),
    }),
    [open],
  );
  useHotkeys(hotkeys, !drawer);

  const pages = {
    inicio: <DashboardPage onNavigate={navigate} onNewLoan={() => open("loan")} onReturn={() => open("return")} onNewLeitor={() => open("leitor")} onNewObra={() => open("obra")} />,
    acervo: <AcervoPage search={search} onAddObra={() => open("obra")} onEditObra={(obra) => open("obra", obra)} />,
    emprestimos: <EmprestimosPage onNewLoan={() => open("loan")} />,
    leitores: <LeitoresPage onAddLeitor={() => open("leitor")} onEditLeitor={(l) => open("leitor", l)} onOpenLeitor={(l) => open("leitorDetalhe", l.id)} />,
    relatorios: <RelatoriosPage />,
    configuracoes: <ConfiguracoesPage />,
  };

  return (
    <div className="min-h-screen">
      <Sidebar page={page} onNavigate={navigate} overdue={stats.atrasados} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-72">
        <ConnectionBanner onRetry={reload} />
        <Topbar
          bell={<NotificationBell onNavigate={navigate} onOpenLeitor={(id) => open("leitorDetalhe", id)} />}
          ref={searchRef} search={search} onSearch={onSearch} onOpenMenu={() => setMenuOpen(true)} onNewLoan={() => open("loan")} onReturn={() => open("return")} />
        <main className="mx-auto max-w-[1360px] px-4 py-8 sm:px-8">{loading ? <Spinner label="Carregando acervo" /> : pages[page]}</main>
      </div>

      <NewLoanDrawer open={is("loan")} onClose={close} initialObra={drawer?.payload} />
      <ReturnDrawer open={is("return")} onClose={close} initialLoan={drawer?.payload} />
      <ObraDrawer open={is("obra")} obra={drawer?.payload} onClose={close} />
      <LeitorDrawer open={is("leitor")} leitor={drawer?.payload} onClose={close} />
      <LeitorDetalheDrawer open={is("leitorDetalhe")} leitorId={drawer?.payload} onClose={close} onEdit={(l) => open("leitor", l)} />
    </div>
  );
}

function OfflineGate({ onRetry }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle className="border-[1.5px] border-line bg-panel hover:bg-sunken" />
      </div>
      <p className="font-display font-bold text-2xl text-ink">Sem conexão com o servidor</p>
      <p className="max-w-md text-base text-ink-muted">Confira a internet ou se a API está no ar. Sua sessão continua salva.</p>
      <Button onClick={onRetry}>Tentar de novo</Button>
    </div>
  );
}

function Gate() {
  const { status, retry } = useAuth();
  if (status === "checking") return <Spinner label="Verificando sessão" />;
  if (status === "offline") return <OfflineGate onRetry={retry} />;
  if (status !== "authenticated") return <LoginPage />;
  return (
    <LibraryProvider>
      <ConfirmProvider>
        <Workspace />
      </ConfirmProvider>
    </LibraryProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
