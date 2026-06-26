import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import NewLoanDrawer from "./components/NewLoanDrawer";
import ReturnDrawer from "./components/ReturnDrawer";
import ObraDrawer from "./components/ObraDrawer";
import LeitorDrawer from "./components/LeitorDrawer";
import ConfirmDialog from "./components/ConfirmDialog";
import DashboardPage from "./pages/DashboardPage";
import AcervoPage from "./pages/AcervoPage";
import LeitoresPage from "./pages/LeitoresPage";
import EmprestimosPage from "./pages/EmprestimosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LoginPage from "./pages/LoginPage";
import { mockExemplares, mockEmprestimos, mockObras, mockLeitores } from "./data/mockData";
import { apiFetch } from "./utils/api.js";

function AppContent() {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();
  const { isAuthenticated, isLoading, token } = useAuth();

  // === DATA STATE ===
  const [obras, setObras] = useState(mockObras);
  const [leitores, setLeitores] = useState(mockLeitores);
  const [exemplares, setExemplares] = useState(mockExemplares);
  const [emprestimos, setEmprestimos] = useState(
    mockEmprestimos.map((e) => ({ ...e, status: "ativo", dataDevolvido: null }))
  );

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [obrasApi, setObrasApi] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)

      try{
        const responseObras = await apiFetch("/obra/list", {}, token)
        setObrasApi(responseObras.data)

        const responseExemplares = await apiFetch("/exemplar/list", {}, token)
        setExemplares(responseExemplares.data)

        const responseEmprestimo = await apiFetch("/emprestimo/list", {}, token)
        setEmprestimos(responseEmprestimo.data)

        console.log(emprestimos)
      }finally{
        setIsLoadingData(false)
      }
    }

    if(isAuthenticated){
      loadData()
    }
  }, [isAuthenticated])

  // === DRAWER STATE ===
  const [loanDrawerOpen, setLoanDrawerOpen] = useState(false);
  const [returnDrawerOpen, setReturnDrawerOpen] = useState(false);
  const [obraDrawerOpen, setObraDrawerOpen] = useState(false);
  const [editingObra, setEditingObra] = useState(null);
  const [leitorDrawerOpen, setLeitorDrawerOpen] = useState(false);
  const [editingLeitor, setEditingLeitor] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Body scroll lock when any drawer is open
  // Trava o scroll da página caso um drawer esteja aberto
  useEffect(() => {
    const anyOpen = loanDrawerOpen || returnDrawerOpen || obraDrawerOpen || leitorDrawerOpen || confirmDialog;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [loanDrawerOpen, returnDrawerOpen, obraDrawerOpen, leitorDrawerOpen, confirmDialog]);

  // Global keyboard shortcuts
  // Seta atalhos: e -> emprestimo; d -> devolução;
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setLoanDrawerOpen(true); }
      if (e.key === "d" || e.key === "D") { e.preventDefault(); setReturnDrawerOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Ctrl+K / slash to focus search]
  // Seta atalhos: Ctrl + k ou / -> foca no input de busca;
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ============ EMPRÉSTIMO CRUD ============

  const handleNewLoan = useCallback((idExemplar, idLeitor) => {
    //Procura o exemplar no banco, e troca o status de disponível pra false
    setExemplares((prev) => prev.map((e) => e.idExemplar === idExemplar ? { ...e, disponivel: false } : e));

    // pega a data de hora sem a hora
    const today = new Date().toISOString().split("T")[0];

    // seta a data de retorno para 14 dias
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 14);

    //cria um objeto emprestimo
    const newEmprestimo = {
      idEmprestimo: Date.now(), idExemplar, idLeitor,
      dataInicio: today, dataDevolucaoPrevista: returnDate.toISOString().split("T")[0],
      status: "ativo", dataDevolvido: null,
    };

    // adiciona o novo emprestimo no useState
    setEmprestimos((prev) => [...prev, newEmprestimo]);

    const ex = exemplares.find((e) => e.idExemplar === idExemplar);
    const obra = ex ? obras.find((o) => o.idObra === ex.idObra) : null;
    const leitor = leitores.find((l) => l.idLeitor === idLeitor);
    addToast(`Empréstimo registrado: ${obra?.titulo || "Livro"} → ${leitor?.nome || "Leitor"}`);

  }, [exemplares, obras, leitores, addToast]);

  // metodo para registrar a devolução de um exemplar
  const handleReturn = useCallback((idExemplar) => {
    // procura o exemplar e seta a variavel disponivel para true
    setExemplares((prev) => prev.map((e) => e.idExemplar === idExemplar ? { ...e, disponivel: true } : e));

    // pega a data de devolução
    const today = new Date().toISOString().split("T")[0];
    setEmprestimos((prev) => prev.map((e) =>
      e.idExemplar === idExemplar && e.status === "ativo"
        ? { ...e, status: "devolvido", dataDevolvido: today } : e
    ));

    const ex = exemplares.find((e) => e.idExemplar === idExemplar);
    const obra = ex ? obras.find((o) => o.idObra === ex.idObra) : null;
    addToast(`Devolução registrada: ${obra?.titulo || "Livro"} retornado ao acervo`);
  }, [exemplares, obras, addToast]);

  //método para renovar um empréstimo
  const handleRenewLoan = useCallback((idEmprestimo) => {
    setEmprestimos((prev) => prev.map((e) => {
      if (e.idEmprestimo === idEmprestimo && e.status === "ativo") {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 14);
        return { ...e, dataDevolucaoPrevista: newDate.toISOString().split("T")[0] };
      }
      return e;
    }));
    addToast("Empréstimo renovado por mais 14 dias");
  }, [addToast]);

  // ============ OBRA CRUD ============

  // metodo para criar ou editar uma obra
  const handleObraSubmit = useCallback((data) => {
    //verifica se o objeto veio com id, se sim edita a obra, se nao cria outra
    if (data.idObra) {
      // Edit
      setObras((prev) => prev.map((o) => o.idObra === data.idObra
        ? { ...o, titulo: data.titulo, autor: data.autor, cdd: data.cdd, capa: data.capa } : o
      ));
      addToast(`Obra "${data.titulo}" atualizada`);
    } else {
      // Create
      //cria um novo id
      const newId = Math.max(0, ...obras.map((o) => o.idObra)) + 1;
      //cria uma obra
      const newObra = { idObra: newId, titulo: data.titulo, autor: data.autor, cdd: data.cdd, capa: data.capa };
      setObras((prev) => [...prev, newObra]);
      // Generate exemplares
      const maxInv = Math.max(0, ...exemplares.map((e) => parseInt(e.numeroInventario.replace("INV-", ""))));
      const newExemplares = Array.from({ length: data.numExemplares }, (_, i) => ({
        idExemplar: Date.now() + i, idObra: newId,
        numeroInventario: `INV-${String(maxInv + 1 + i).padStart(4, "0")}`,
        disponivel: true,
      }));
      setExemplares((prev) => [...prev, ...newExemplares]);
      addToast(`Obra "${data.titulo}" cadastrada com ${data.numExemplares} exemplar(es)`);
    }
    setEditingObra(null);
  }, [obras, exemplares, addToast]);

  //metodo para deletar a obra
  const handleDeleteObra = useCallback((idObra) => {
    //acha a obra com id passado
    const obra = obras.find((o) => o.idObra === idObra);
    //acha os exemplares da obra
    const obraExemplares = exemplares.filter((e) => e.idObra === idObra);
    const hasActive = obraExemplares.some((ex) =>
      emprestimos.some((e) => e.idExemplar === ex.idExemplar && e.status === "ativo")
    );
    if (hasActive) { addToast("Não é possível excluir obra com empréstimos ativos", "error"); return; }
    setConfirmDialog({
      title: "Excluir Obra",
      message: `Tem certeza que deseja excluir "${obra?.titulo}"? Todos os ${obraExemplares.length} exemplar(es) serão removidos.`,
      onConfirm: () => {
        setObras((prev) => prev.filter((o) => o.idObra !== idObra));
        setExemplares((prev) => prev.filter((e) => e.idObra !== idObra));
        addToast(`Obra "${obra?.titulo}" removida do acervo`);
        setConfirmDialog(null);
      },
    });
  }, [obras, exemplares, emprestimos, addToast]);

  //metodo para adicionar um exemplar
  const handleAddExemplar = useCallback((idObra) => {

    const maxInv = Math.max(0, ...exemplares.map((e) => parseInt(e.numeroInventario.replace("INV-", ""))));
    const newExemplar = {
      idExemplar: Date.now(), idObra,
      numeroInventario: `INV-${String(maxInv + 1).padStart(4, "0")}`,
      disponivel: true,
    };
    setExemplares((prev) => [...prev, newExemplar]);
    const obra = obras.find((o) => o.idObra === idObra);
    addToast(`Novo exemplar adicionado a "${obra?.titulo}"`);
  }, [exemplares, obras, addToast]);

  //metodo para deletar um exemplar
  const handleDeleteExemplar = useCallback((idExemplar) => {
    const ex = exemplares.find((e) => e.idExemplar === idExemplar);
    if (!ex?.disponivel) { addToast("Não é possível excluir exemplar emprestado", "error"); return; }
    setExemplares((prev) => prev.filter((e) => e.idExemplar !== idExemplar));
    addToast("Exemplar removido");
  }, [exemplares, addToast]);

  // ============ LEITOR CRUD ============

  const handleLeitorSubmit = useCallback((data) => {
    if (data.idLeitor) {
      setLeitores((prev) => prev.map((l) => l.idLeitor === data.idLeitor
        ? { ...l, nome: data.nome, contato: data.contato, telefone: data.telefone } : l
      ));
      addToast(`Leitor "${data.nome}" atualizado`);
    } else {
      const newId = Math.max(0, ...leitores.map((l) => l.idLeitor)) + 1;
      setLeitores((prev) => [...prev, { idLeitor: newId, nome: data.nome, contato: data.contato, telefone: data.telefone }]);
      addToast(`Leitor "${data.nome}" cadastrado`);
    }
    setEditingLeitor(null);
  }, [leitores, addToast]);

  const handleDeleteLeitor = useCallback((idLeitor) => {
    const leitor = leitores.find((l) => l.idLeitor === idLeitor);
    const hasActive = emprestimos.some((e) => e.idLeitor === idLeitor && e.status === "ativo");
    if (hasActive) { addToast("Não é possível excluir leitor com empréstimos ativos", "error"); return; }
    setConfirmDialog({
      title: "Excluir Leitor",
      message: `Tem certeza que deseja excluir "${leitor?.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => {
        setLeitores((prev) => prev.filter((l) => l.idLeitor !== idLeitor));
        addToast(`Leitor "${leitor?.nome}" removido`);
        setConfirmDialog(null);
      },
    });
  }, [leitores, emprestimos, addToast]);

  // ============ EXPORT CSV ============

  const handleExportCSV = useCallback(() => {
    const obraRows = obras.map((o) => {
      const exs = exemplares.filter((e) => e.idObra === o.idObra);
      return `"${o.titulo}","${o.autor}","${o.cdd}",${exs.length},${exs.filter((e) => e.disponivel).length}`;
    });
    const csv = "Título,Autor,CDD,Total Exemplares,Disponíveis\n" + obraRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "acervo-camugere.csv"; a.click();
    URL.revokeObjectURL(url);
    addToast("Acervo exportado em CSV");
  }, [obras, exemplares, addToast]);

  // ============ COMPUTED ============

  const overdueCount = emprestimos.filter((e) => {
    if (e.status !== "ativo") return false;
    return e.dataDevolucaoPrevista < new Date().toISOString().split("T")[0];
  }).length;

  // ============ RENDER ============

  const openEditObra = (obra) => { setEditingObra(obra); setObraDrawerOpen(true); };
  const openAddObra = () => { setEditingObra(null); setObraDrawerOpen(true); };
  const openEditLeitor = (leitor) => { setEditingLeitor(leitor); setLeitorDrawerOpen(true); };
  const openAddLeitor = () => { setEditingLeitor(null); setLeitorDrawerOpen(true); };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardPage
            exemplares={exemplares} emprestimos={emprestimos} obras={obras} leitores={leitores}
            onOpenLoan={() => setLoanDrawerOpen(true)} onOpenReturn={() => setReturnDrawerOpen(true)}
            onNavigate={setActivePage} obrasApi={obrasApi} isLoading={isLoadingData}
          />
        );
      case "acervo":
        return (
          <AcervoPage
            exemplares={exemplares} searchQuery={searchQuery} emprestimos={emprestimos}
            obras={obras} leitores={leitores}
            onAddObra={openAddObra} onEditObra={openEditObra} onDeleteObra={handleDeleteObra}
            onAddExemplar={handleAddExemplar} onDeleteExemplar={handleDeleteExemplar}
          />
        );
      case "leitores":
        return (
          <LeitoresPage
            emprestimos={emprestimos} leitores={leitores}
            onAddLeitor={openAddLeitor} onEditLeitor={openEditLeitor} onDeleteLeitor={handleDeleteLeitor}
          />
        );
      case "emprestimos":
        return (
          <EmprestimosPage
            exemplares={exemplares} emprestimos={emprestimos} obras={obras} leitores={leitores}
            onOpenLoan={() => setLoanDrawerOpen(true)} onReturn={handleReturn} onRenew={handleRenewLoan}
          />
        );
      case "relatorios":
        return <RelatoriosPage emprestimos={emprestimos} exemplares={exemplares} obras={obras} leitores={leitores} />;
      case "configuracoes":
        return <ConfiguracoesPage onExportCSV={handleExportCSV} />;
      default:
        return (
          <DashboardPage
            exemplares={exemplares} emprestimos={emprestimos} obras={obras} leitores={leitores}
            onOpenLoan={() => setLoanDrawerOpen(true)} onOpenReturn={() => setReturnDrawerOpen(true)}
            onNavigate={setActivePage}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-50 text-surface-700 dark:bg-surface-950 dark:text-surface-200">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-surface-50 transition-colors duration-300 dark:bg-surface-950">
      <Sidebar activePage={activePage} onNavigate={setActivePage} overdueCount={overdueCount} />
      <div className="flex flex-1 flex-col pl-64">
        <Header onNavigate={setActivePage} searchQuery={searchQuery} onSearchChange={setSearchQuery} obras={obras} />
        <main className="flex-1 p-6">{renderPage()}</main>
      </div>

      <NewLoanDrawer isOpen={loanDrawerOpen} onClose={() => setLoanDrawerOpen(false)}
        exemplares={exemplares} emprestimos={emprestimos} obras={obras} leitores={leitores}
        onConfirm={handleNewLoan} />
      <ReturnDrawer isOpen={returnDrawerOpen} onClose={() => setReturnDrawerOpen(false)}
        exemplares={exemplares} emprestimos={emprestimos} obras={obras} leitores={leitores}
        onConfirm={handleReturn} />
      <ObraDrawer isOpen={obraDrawerOpen} onClose={() => { setObraDrawerOpen(false); setEditingObra(null); }}
        onConfirm={handleObraSubmit} editingObra={editingObra} />
      <LeitorDrawer isOpen={leitorDrawerOpen} onClose={() => { setLeitorDrawerOpen(false); setEditingLeitor(null); }}
        onConfirm={handleLeitorSubmit} editingLeitor={editingLeitor} />
      <ConfirmDialog
        isOpen={!!confirmDialog} title={confirmDialog?.title || ""} message={confirmDialog?.message || ""}
        onConfirm={confirmDialog?.onConfirm} onCancel={() => setConfirmDialog(null)} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
