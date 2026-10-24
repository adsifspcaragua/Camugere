import { useMemo, useState } from "react";
import { ArrowLeftRight, CornerDownLeft, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Cover from "../components/ui/Cover.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatDate, matches } from "../lib/format.js";
import { loanStatus } from "../lib/loans.js";
import { loadSettings } from "../services/settings.js";

const TABS = {
  ativos: { label: "Em dia", filter: (l) => !l.devolvido && !l.atrasado, sort: (a, b) => a.dataPrevista - b.dataPrevista },
  atrasados: { label: "Em atraso", filter: (l) => l.atrasado, sort: (a, b) => a.dataPrevista - b.dataPrevista },
  devolvidos: { label: "Devolvidos", filter: (l) => l.devolvido, sort: (a, b) => b.dataDevolucao - a.dataDevolucao },
};

const EMPTY = {
  ativos: "Nenhum empréstimo em andamento.",
  atrasados: "Nenhum atraso. Todos os empréstimos estão em dia.",
  devolvidos: "Nenhuma devolução registrada ainda.",
};

export default function EmprestimosPage({ onNewLoan }) {
  const { loans, returnLoan, renewLoan, deleteLoan } = useLibrary();
  const confirm = useConfirm();
  const [tab, setTab] = useState(() => (loans.some((l) => l.atrasado) ? "atrasados" : "ativos"));
  const [query, setQuery] = useState("");
  const { renovacaoDias } = useMemo(() => loadSettings(), []);

  const counts = useMemo(() => Object.fromEntries(Object.entries(TABS).map(([k, t]) => [k, loans.filter(t.filter).length])), [loans]);

  const rows = useMemo(
    () =>
      loans
        .filter(TABS[tab].filter)
        .filter((l) => matches(query, l.obra.titulo, l.leitor.nome, l.exemplar.numeroInventario))
        .sort(TABS[tab].sort),
    [loans, tab, query],
  );

  const remove = async (loan) => {
    if (await confirm({ title: "Apagar do histórico?", message: `O registro de “${loan.obra.titulo}” emprestado a ${loan.leitor.nome} será apagado.`, confirmLabel: "Apagar" })) {
      deleteLoan(loan).catch(() => {});
    }
  };

  const ignore = () => {};

  return (
    <>
      <PageHeader
        eyebrow="Circulação"
        title="Empréstimos"
        description="Acompanhe prazos, renove e registre devoluções."
        actions={
          <Button icon={Plus} onClick={onNewLoan}>
            Novo empréstimo
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Situação"
          value={tab}
          onChange={setTab}
          options={Object.entries(TABS).map(([value, t]) => ({ value, label: t.label, count: counts[value], alert: value === "atrasados" }))}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="Filtrar por obra, leitor ou inventário" className="w-full sm:w-72" />
      </div>

      <Panel className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title={query ? "Nada encontrado" : EMPTY[tab]} />
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2.5 pl-5 font-medium">Obra</th>
                <th className="py-2.5 font-medium">Leitor</th>
                <th className="py-2.5 font-medium">Retirada</th>
                <th className="py-2.5 font-medium">{tab === "devolvidos" ? "Devolvido em" : "Prazo"}</th>
                <th className="py-2.5 font-medium">Situação</th>
                <th className="py-2.5 pr-5" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((loan) => {
                const status = loanStatus(loan);
                return (
                  <tr key={loan.id} className="hover:bg-sunken/40">
                    <td className="py-2.5 pl-5">
                      <div className="flex items-center gap-3">
                        <Cover src={loan.obra.capaUrl} title={loan.obra.titulo} />
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium text-ink">{loan.obra.titulo}</p>
                          <p className="font-mono text-xs text-ink-muted">{loan.exemplar.numeroInventario}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <p className="text-ink">{loan.leitor.nome}</p>
                      <p className="text-xs text-ink-muted">{loan.leitor.email}</p>
                    </td>
                    <td className="tabular py-2.5 text-ink-soft">{formatDate(loan.dataInicio)}</td>
                    <td className={`tabular py-2.5 ${loan.atrasado ? "font-medium text-danger" : "text-ink-soft"}`}>
                      {formatDate(loan.devolvido ? loan.dataDevolucao : loan.dataPrevista)}
                    </td>
                    <td className="py-2.5">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                    <td className="py-2.5 pr-5">
                      <div className="flex justify-end gap-1">
                        {loan.devolvido ? (
                          <Button variant="ghost" size="icon" icon={Trash2} onClick={() => remove(loan)} aria-label="Apagar do histórico" />
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" icon={RefreshCcw} onClick={() => renewLoan(loan, renovacaoDias).catch(ignore)} tooltip={`Soma ${renovacaoDias} dias ao prazo`}>
                              Renovar
                            </Button>
                            <Button variant="secondary" size="sm" icon={CornerDownLeft} onClick={() => returnLoan(loan).catch(ignore)}>
                              Devolver
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
