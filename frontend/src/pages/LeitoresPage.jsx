import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatCpf, formatDate, formatPhone, matches, plural } from "../lib/format.js";

export default function LeitoresPage({ onAddLeitor, onEditLeitor, onOpenLeitor }) {
  const { leitores, loans, deleteLeitor } = useLibrary();
  const confirm = useConfirm();
  const [query, setQuery] = useState("");

  const historico = useMemo(() => {
    const map = new Map();
    for (const loan of loans) {
      const h = map.get(loan.leitor.id) ?? { total: 0, ativos: 0, atrasados: 0 };
      h.total += 1;
      if (!loan.devolvido) h.ativos += 1;
      if (loan.atrasado) h.atrasados += 1;
      map.set(loan.leitor.id, h);
    }
    return map;
  }, [loans]);

  const rows = leitores.filter((l) => matches(query, l.nome, l.email, l.cpf, l.telefone));

  const remove = async (leitor) => {
    if (historico.get(leitor.id)?.ativos) return; // botão já fica desabilitado
    if (await confirm({ title: "Excluir leitor?", message: `${leitor.nome} e todo o seu histórico de empréstimos serão removidos.` })) {
      deleteLeitor(leitor).catch(() => {});
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Comunidade"
        title="Leitores"
        description={`${plural(leitores.length, "leitor cadastrado", "leitores cadastrados")}${leitores.some((l) => l.suspensao) ? ` · ${leitores.filter((l) => l.suspensao).length} suspenso(s)` : ""}. Clique no nome para ver o histórico.`}
        actions={
          <Button icon={Plus} onClick={onAddLeitor}>
            Novo leitor
          </Button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nome, e-mail, CPF ou telefone" className="mb-6 w-full sm:w-[28rem]" />

      <Panel className="overflow-x-auto">
        {rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={leitores.length ? "Nenhum leitor encontrado" : "Nenhum leitor cadastrado"}
            action={!leitores.length && <Button icon={Plus} onClick={onAddLeitor}>Novo leitor</Button>}
          />
        ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2.5 pl-5 font-semibold">Nome</th>
                <th className="py-2.5 font-semibold">CPF</th>
                <th className="py-2.5 font-semibold">Telefone</th>
                <th className="py-2.5 font-semibold">Empréstimos</th>
                <th className="py-2.5 font-semibold">Situação</th>
                <th className="py-2.5 pr-5" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((leitor) => {
                const h = historico.get(leitor.id) ?? { total: 0, ativos: 0, atrasados: 0 };
                return (
                  <tr key={leitor.id} className="group hover:bg-sunken/40">
                    <td className="py-2.5 pl-5">
                      <button onClick={() => onOpenLeitor(leitor)} className="flex items-center gap-3 text-left">
                        <Avatar name={leitor.nome} />
                        <span className="min-w-52">
                          <span className="block font-semibold text-ink underline-offset-4 hover:underline">{leitor.nome}</span>
                          <span className="block text-xs wrap-anywhere text-ink-muted">{leitor.email}</span>
                        </span>
                      </button>
                    </td>
                    <td data-label="CPF" className="py-2.5 font-mono text-xs text-ink-soft">{formatCpf(leitor.cpf)}</td>
                    <td data-label="Telefone" className="tabular py-2.5 text-ink-soft">{leitor.telefone ? formatPhone(leitor.telefone) : "—"}</td>
                    <td data-label="Empréstimos" className="py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {h.atrasados > 0 && <Badge tone="danger">{h.atrasados} em atraso</Badge>}
                        {h.ativos - h.atrasados > 0 && <Badge tone="warn">{h.ativos - h.atrasados} em andamento</Badge>}
                        <span className="tabular text-xs text-ink-muted">{h.total} no total</span>
                      </div>
                    </td>
                    <td data-label="Situação" className="py-2.5">
                      {leitor.suspensao ? (
                        <Badge tone="danger">{leitor.suspensao.dataFim ? `Suspenso até ${formatDate(leitor.suspensao.dataFim)}` : "Suspenso"}</Badge>
                      ) : (
                        <Badge tone="ok">Liberado</Badge>
                      )}
                    </td>
                    <td className="py-2.5 pr-5">
                      <div className="flex justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <Button variant="ghost" size="icon" icon={Pencil} onClick={() => onEditLeitor(leitor)} aria-label={`Editar ${leitor.nome}`} />
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={Trash2}
                          onClick={() => remove(leitor)}
                          disabled={h.ativos > 0}
                          tooltip={h.ativos > 0 ? "Não dá para excluir: há livros com este leitor" : `Excluir ${leitor.nome}`}
                          aria-label={`Excluir ${leitor.nome}`}
                        />
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
