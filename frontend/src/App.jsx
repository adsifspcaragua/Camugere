import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { emprestimoService } from "../services/emprestimoService.js";
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
    setIsLoadingData(true);
    try {
     // 1. Puxa Obras
      const responseObras = await apiFetch("/obra/list", {}, token);
      setObrasApi(responseObras.data);
      setObras(responseObras.data.map(o => ({ ...o, idObra: o.id }))); // Adicionando idObra

      // 2. Puxa Exemplares
      const responseExemplares = await apiFetch("/exemplar/list", {}, token);
      setExemplares(responseExemplares.data.map(e => ({ ...e, idExemplar: e.id, idObra: e.id_obra }))); 

      // 3. Puxa Leitores
      const resposeLeitores = await apiFetch("/leitor/list", {}, token);
      setLeitores(resposeLeitores.data.map(l => ({ 
          ...l, 
          idLeitor: l.id, 
          nome: l.usuario?.nome || l.nome || `Leitor ${l.id}` // Puxa o nome do relacionamento
      })));

      // 4. Puxa Empréstimos e já traduz os dados para a tabela visual
      const responseEmprestimo = await apiFetch("/emprestimo/list", {}, token);
      
      const emprestimosFormatados = responseEmprestimo.data.map(emp => {
        const dataIn = new Date(emp.dataInicio);
        const dataPrev = new Date(dataIn);
        dataPrev.setDate(dataPrev.getDate() + emp.diasLocacao); 

        return {
          idEmprestimo: emp.id,
          idExemplar: emp.id_exemplar,
          idLeitor: emp.id_leitor,
          dataInicio: dataIn.toISOString().split("T")[0],
          dataDevolucaoPrevista: dataPrev.toISOString().split("T")[0],
          status: emp.statusDevolucao ? "devolvido" : "ativo",
          dataDevolvido: emp.dataDevolucao ? new Date(emp.dataDevolucao).toISOString().split("T")[0] : null
        };
      });
      
      setEmprestimos(emprestimosFormatados);

    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
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

 const handleNewLoan = useCallback(async (idExemplar, idLeitor) => {
    try {
      // 1. Envia os dados para o back-end salvar no banco (POST)
      const dadosEmprestimo = {
        id_exemplar: parseInt(idExemplar),
        id_leitor: parseInt(idLeitor),
        diasLocacao: 14 
      };
      
      await emprestimoService.criar(dadosEmprestimo, token);
      
      // 2. Fecha a gaveta para impedir múltiplos cliques acidentais
      setLoanDrawerOpen(false);
      
      // 3. Puxa as informações concretas e atualizadas direto do banco
      await loadData();
      
      // 4. Mostra o alerta verde de sucesso
      addToast("Empréstimo salvo no banco com sucesso!");

    } catch (error) {
      console.error("Erro ao salvar no banco:", error);
      addToast("Erro ao registrar empréstimo no servidor", "error");
    }
  }, [addToast, token]);
      
      

  // metodo para registrar a devolução de um exemplar
const handleReturn = useCallback(async (idExemplar) => {
    try {
      const emprestimoAtivo = emprestimos.find((e) => e.idExemplar === idExemplar && e.status === "ativo");
      
      if (!emprestimoAtivo) {
        addToast("Nenhum empréstimo ativo encontrado para este exemplar.", "error");
        return;
      }

      // Pacote Cirúrgico: Apenas números e booleanos para o Zod não reclamar
      await apiFetch(`/emprestimo/update/${emprestimoAtivo.idEmprestimo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diasLocacao: Number(emprestimoAtivo.diasLocacao || 14), // Zod exige Número
          statusDevolucao: true, // Prisma precisa disto
          dataDevolucao: new Date().toISOString() // Prisma precisa disto
        })
      }, token);

      setReturnDrawerOpen(false);
      await loadData();
      addToast("Devolução registrada no banco com sucesso!");

    } catch (error) {
      console.error("Erro ao registrar devolução:", error);
      addToast("Erro ao comunicar devolução ao servidor", "error");
    }
  }, [emprestimos, addToast, token]);

  //método para renovar um empréstimo
 const handleRenewLoan = useCallback(async (idEmprestimo) => {
    try {
      const emp = emprestimos.find(e => e.idEmprestimo === idEmprestimo);
      if (!emp) return;

      // Pacote Cirúrgico para a renovação
      await apiFetch(`/emprestimo/update/${idEmprestimo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diasLocacao: Number(emp.diasLocacao || 14) + 14 // Soma os dias e garante que é Número
        })
      }, token);

      await loadData();
      addToast("Empréstimo renovado no banco por mais 14 dias!");

    } catch (error) {
      console.error("Erro ao renovar:", error);
      addToast("Erro ao renovar empréstimo no servidor", "error");
    }
  }, [emprestimos, addToast, token]);
  // ============ OBRA CRUD ============

  // metodo para criar ou editar uma obra
const handleObraSubmit = useCallback(async (data) => {
    try {
      if (data.idObra) {
        // Edição (PUT)
        await apiFetch(`/obra/update/${data.idObra}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }, token);
        addToast(`Obra "${data.titulo}" atualizada`);
      } else {
        // Criação (POST)
        await apiFetch("/obra/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }, token);
        addToast(`Obra "${data.titulo}" cadastrada`);
      }

      // Fecha a gaveta e limpa o formulário
      setObraDrawerOpen(false);
      setEditingObra(null);
      
      // Puxa a obra e os exemplares reais gerados no banco
      await loadData();

    } catch (error) {
      console.error("Erro ao salvar obra:", error);
      addToast("Erro ao salvar obra no banco", "error");
    }
  }, [addToast, token]);

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

 const handleLeitorSubmit = useCallback(async (data) => {
    try {
      if (data.idLeitor) {
        // Edição (PUT)
        await apiFetch(`/leitor/update/${data.idLeitor}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }, token);
        addToast(`Leitor "${data.nome}" atualizado`);
      } else {
        // Criação (POST)
        await apiFetch("/leitor/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        }, token);
        addToast(`Leitor "${data.nome}" cadastrado`);
      }

      // Fecha a gaveta e limpa o formulário
      setLeitorDrawerOpen(false);
      setEditingLeitor(null);
      
      // Puxa o leitor com o ID real e definitivo do banco
      await loadData();

    } catch (error) {
      console.error("Erro ao salvar leitor:", error);
      addToast("Erro ao salvar leitor no banco", "error");
    }
  }, [addToast, token]);

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
