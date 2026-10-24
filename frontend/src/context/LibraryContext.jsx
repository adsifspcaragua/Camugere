import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { normalizeLoan, summarize } from "../lib/loans.js";
import { useToast } from "./ToastContext.jsx";
import * as obraService from "../services/obraService.js";
import * as exemplarService from "../services/exemplarService.js";
import * as leitorService from "../services/leitorService.js";
import * as emprestimoService from "../services/emprestimoService.js";

const LibraryContext = createContext(null);

const ENDERECO = ["cep", "logradouro", "numero", "complemento", "bairro", "cidade", "uf"];

const normalizeLeitor = (l) => ({
  id: l.id,
  nome: l.usuario?.nome ?? "",
  email: l.usuario?.email ?? "",
  cpf: l.cpf ?? "",
  telefone: l.telefone ?? "",
  ...Object.fromEntries(ENDERECO.map((campo) => [campo, l[campo] ?? ""])),
  suspensao: l.suspensaoAtiva ?? null,
});

/**
 * Fonte única dos dados do acervo. Toda ação chama a API, recarrega o estado
 * e mostra um aviso — as telas só chamam a ação e não lidam com fetch.
 */
export function LibraryProvider({ children }) {
  const toast = useToast();
  const [obras, setObras] = useState([]);
  const [leitores, setLeitores] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [o, l, e] = await Promise.all([
        obraService.listObras(),
        leitorService.listLeitores(),
        emprestimoService.listEmprestimos(),
      ]);
      const today = new Date();
      setObras(o);
      setLeitores(l.map(normalizeLeitor));
      setLoans(e.map((raw) => normalizeLoan(raw, today)));
    } catch (error) {
      // Sem conexão a faixa fixa já avisa; não empilha avisos a cada nova tentativa.
      if (error.status !== 0) toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Executa a ação, recarrega e avisa. Relança o erro para o formulário poder reagir.
  // `undo` (opcional) vira um botão "Desfazer" no aviso.
  const run = useCallback(
    async (action, successMessage, undo) => {
      try {
        const result = await action();
        await reload();
        const message = typeof successMessage === "function" ? successMessage(result) : successMessage;
        const opts = undo && {
          action: {
            label: "Desfazer",
            onClick: () =>
              undo(result)
                .then(reload)
                .then(() => toast.info("Ação desfeita."))
                .catch((error) => toast.error(error.message)),
          },
        };
        if (message) toast.success(message, opts);
        if (result?.aviso) toast.info(result.aviso);
        return result;
      } catch (error) {
        toast.error(error.message);
        throw error;
      }
    },
    [reload, toast],
  );

  const actions = useMemo(
    () => ({
      reload,
      saveObra: (dados, id) =>
        run(
          () => (id ? obraService.updateObra(id, dados) : obraService.createObra(dados)),
          id ? `“${dados.titulo}” atualizada.` : `“${dados.titulo}” adicionada ao acervo.`,
        ),
      deleteObra: (obra) => run(() => obraService.deleteObra(obra.id), `“${obra.titulo}” removida do acervo.`),
      addExemplar: (obra) =>
        run(() => exemplarService.createExemplar(obra.id), (ex) => `Exemplar ${ex.numeroInventario} adicionado.`),
      deleteExemplar: (exemplar) =>
        run(() => exemplarService.deleteExemplar(exemplar.id), `Exemplar ${exemplar.numeroInventario} removido.`),

      saveLeitor: (dados, id) =>
        run(
          () => (id ? leitorService.updateLeitor(id, dados) : leitorService.createLeitor(dados)),
          id ? `Cadastro de ${dados.nome} atualizado.` : `${dados.nome} cadastrado(a).`,
        ),
      deleteLeitor: (leitor) => run(() => leitorService.deleteLeitor(leitor.id), `${leitor.nome} removido(a).`),
      suspendLeitor: (leitor, dados) => run(() => leitorService.suspenderLeitor(leitor.id, dados), `${leitor.nome} está suspenso(a) de novos empréstimos.`),
      endSuspension: (leitor) => run(() => leitorService.encerrarSuspensao(leitor.suspensao.id), `${leitor.nome} pode voltar a pegar livros.`),

      createLoan: (dados) =>
        run(
          () => emprestimoService.createEmprestimo(dados),
          (emp) =>
            emp.emailNotification?.enviado
              ? `Empréstimo registrado. Comprovante enviado para ${emp.emailNotification.emailDestino}.`
              : "Empréstimo registrado.",
        ),
      returnLoan: (loan) =>
        run(
          () => emprestimoService.devolverEmprestimo(loan.id),
          `Devolução de “${loan.obra.titulo}” registrada.`,
          () => emprestimoService.desfazerDevolucao(loan.id),
        ),
      renewLoan: (loan, dias) =>
        run(
          () => emprestimoService.renovarEmprestimo(loan.id, dias),
          `Prazo de “${loan.obra.titulo}” estendido em ${dias} dias.`,
          () => emprestimoService.definirPrazo(loan.id, loan.diasLocacao),
        ),
      deleteLoan: (loan) => run(() => emprestimoService.deleteEmprestimo(loan.id), "Registro removido do histórico."),
    }),
    [reload, run],
  );

  const stats = useMemo(() => summarize(obras, loans), [obras, loans]);

  const value = useMemo(
    () => ({ obras, leitores, loans, stats, loading, ...actions }),
    [obras, leitores, loans, stats, loading, actions],
  );
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary precisa estar dentro de <LibraryProvider>");
  return ctx;
}
