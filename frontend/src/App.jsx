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
import { apiFetch } from "./utils/api.js";

function AppContent() {
  const [activePage, setActivePage] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();
  const { isAuthenticated, isLoading, token } = useAuth();

  // === DATA STATE ===
  const [obras, setObras] = useState([]);
  const [leitores, setLeitores] = useState([]);
  const [exemplares, setExemplares] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);

  const [isLoadingData, setIsLoadingData] = useState(true)
  const [obrasApi, setObrasApi] = useState(null);

  const loadData = async () => {
    setIsLoadingData(true)

    switch (activePage) {
      case 'dashboard':
        try {
          const responseObras = await apiFetch("/obra/list", {}, token)
          setObrasApi(responseObras.data)

          const responseExemplares = await apiFetch("/exemplar/list", {}, token)
          setExemplares(responseExemplares.data)
          
          const responseEmprestimo = await apiFetch("/emprestimo/list", {}, token)
          setEmprestimos(responseEmprestimo.data)

          const resposeLeitores = await apiFetch("/leitor/list", {}, token)
          setLeitores(resposeLeitores.data)

        } finally {
          setIsLoadingData(false)
        }
    }

    try {
      const [responseObras, responseExemplares, responseEmprestimo, responseLeitores] =
        await Promise.all([
          apiFetch("/obra/list", {}, token),
          apiFetch("/exemplar/list", {}, token),
          apiFetch("/emprestimo/list", {}, token),
          apiFetch("/leitor/list", {}, token),
        ]);

      const listaObras = responseObras.data || [];
      setObras(listaObras);
      setObrasApi(listaObras);

      // Normaliza idExemplar e idObra vindos do Prisma (id e id_obra) para a BookTable funcionar
      const listaExemplares = (responseExemplares.data || []).map((ex) => ({
        ...ex,
        idExemplar: ex.idExemplar ?? ex.id,
        idObra: ex.idObra ?? ex.id_obra,
      }));
      setExemplares(listaExemplares);

      setEmprestimos(responseEmprestimo.data || []);
      setLeitores(responseLeitores.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      addToast(error.message || "Erro ao carregar dados do servidor", "error");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Toda vez que o site carrega uma pagina nova, ou o usuário faz autenticação, faz a requisição na api 
  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated, activePage])

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

  const handleNewLoan = useCallback(() => {
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

  // Método para criar ou editar uma obra no banco de dados
  const handleObraSubmit = useCallback(async (data) => {
    const idEdicao = data.id || data.idObra;

    try {
      if (idEdicao) {
        // EDIÇÃO: PUT /obra/update/:id
        const response = await apiFetch(
          `/obra/update/${idEdicao}`,
          {
            method: "PUT",
            body: JSON.stringify(data),
          },
          token
        );
        const obraAtualizada = response.data;

        setObras((prev) =>
          prev.map((o) => (o.idObra === idEdicao || o.id === idEdicao ? obraAtualizada : o))
        );
        setObrasApi((prev) =>
          prev ? prev.map((o) => (o.idObra === idEdicao || o.id === idEdicao ? obraAtualizada : o)) : prev
        );
        addToast(`Obra "${obraAtualizada.titulo}" atualizada com sucesso!`);
      } else {
        // CRIAÇÃO: POST /obra/create (já cria Obra, CDD, Autores e Exemplares no Prisma)
        const response = await apiFetch(
          "/obra/create",
          {
            method: "POST",
            body: JSON.stringify(data),
          },
          token
        );
        const novaObra = response.data;

        setObras((prev) => [novaObra, ...prev]);
        setObrasApi((prev) => (prev ? [novaObra, ...prev] : [novaObra]));

        // Adiciona os exemplares recém-criados pelo Prisma diretamente na tabela
        if (novaObra.exemplaresFormatados?.length > 0) {
          setExemplares((prev) => [...novaObra.exemplaresFormatados, ...prev]);
        }

        addToast(`Obra "${novaObra.titulo}" cadastrada com ${data.numExemplares} exemplar(es)`);
      }
      setEditingObra(null);
    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      addToast(error.message || "Erro ao salvar obra no banco", "error");
    }
  }, [token, addToast]);

  // Método para deletar a obra no banco de dados
  const handleDeleteObra = useCallback((idObra) => {
    const obra = obras.find((o) => o.idObra === idObra || o.id === idObra);
    const obraExemplares = exemplares.filter((e) => e.idObra === idObra);
    const hasActive = obraExemplares.some((ex) =>
      emprestimos.some((e) => e.idExemplar === ex.idExemplar && e.status === "ativo")
    );

    if (hasActive) {
      addToast("Não é possível excluir obra com empréstimos ativos", "error");
      return;
    }

    setConfirmDialog({
      title: "Excluir Obra",
      message: `Tem certeza que deseja excluir "${obra?.titulo}"? Todos os ${obraExemplares.length} exemplar(es) serão removidos.`,
      onConfirm: async () => {
        try {
          await apiFetch(`/obra/delete/${idObra}`, { method: "DELETE" }, token);

          setObras((prev) => prev.filter((o) => o.idObra !== idObra && o.id !== idObra));
          setObrasApi((prev) => (prev ? prev.filter((o) => o.idObra !== idObra && o.id !== idObra) : prev));
          setExemplares((prev) => prev.filter((e) => e.idObra !== idObra));

          addToast(`Obra "${obra?.titulo}" removida do acervo`);
        } catch (error) {
          console.error("Erro ao excluir obra:", error);
          addToast(error.message || "Erro ao excluir obra no banco", "error");
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  }, [obras, exemplares, emprestimos, token, addToast]);

  // Método para adicionar um exemplar avulso no banco
  const handleAddExemplar = useCallback(async (idObra) => {
    try {
      const numeroInventario = `${Date.now().toString().slice(-6)}`;
      const response = await apiFetch(
        "/exemplar/create",
        {
          method: "POST",
          body: JSON.stringify({
            id_obra: Number(idObra),
            numeroInventario,
            disponivel: true,
          }),
        },
        token
      );

      const criado = response.data;
      const newExemplar = {
        ...criado,
        idExemplar: criado?.id ?? Date.now(),
        idObra: criado?.id_obra ?? idObra,
        numeroInventario: criado?.numeroInventario ?? numeroInventario,
        disponivel: criado?.disponivel ?? true,
      };

      setExemplares((prev) => [...prev, newExemplar]);
      const obra = obras.find((o) => o.idObra === idObra || o.id === idObra);
      addToast(`Novo exemplar adicionado a "${obra?.titulo}"`);
    } catch (error) {
      console.error("Erro ao criar exemplar:", error);
      addToast(error.message || "Erro ao adicionar exemplar", "error");
    }
  }, [obras, token, addToast]);

  // Método para deletar um exemplar avulso no banco
  const handleDeleteExemplar = useCallback(async (idExemplar) => {
    const ex = exemplares.find((e) => e.idExemplar === idExemplar || e.id === idExemplar);
    if (!ex?.disponivel) {
      addToast("Não é possível excluir exemplar emprestado", "error");
      return;
    }

    try {
      await apiFetch(`/exemplar/delete/${idExemplar}`, { method: "DELETE" }, token);
      setExemplares((prev) => prev.filter((e) => e.idExemplar !== idExemplar && e.id !== idExemplar));
      addToast("Exemplar removido");
    } catch (error) {
      console.error("Erro ao excluir exemplar:", error);
      addToast(error.message || "Erro ao remover exemplar", "error");
    }
  }, [exemplares, token, addToast]);

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
            onNavigate={setActivePage} obrasApi={obrasApi} isLoading={isLoadingData} isAuthenticated={isAuthenticated}
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
      <ReturnDrawer isOpen={returnDrawerOpen} onClose={() => setReturnDrawerOpen(false)} obras={obras} leitores={leitores} />
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
