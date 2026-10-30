import { Fragment, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Cover from "../components/ui/Cover.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { downloadFile, matches, plural, toCsv } from "../lib/format.js";

const FILTERS = {
  todas: () => true,
  disponiveis: (o) => o.disponiveis > 0,
  esgotadas: (o) => o.total > 0 && o.disponiveis === 0,
};

function exportCsv(obras) {
  const rows = [["Título", "Autoria", "CDD", "ISBN", "Exemplares", "Disponíveis"]];
  obras.forEach((o) => rows.push([o.titulo, o.autor, o.cdd, o.isbn, o.total, o.disponiveis]));
  downloadFile(toCsv(rows), `acervo-camugere-${new Date().toISOString().slice(0, 10)}.csv`);
}

function Exemplares({ obra, loansByExemplar, onAdd, onDelete }) {
  return (
    <tr>
      <td colSpan={6} className="bg-sunken px-6 py-5">
        <div className="md:ml-11">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider text-ink-muted uppercase">Exemplares</p>
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => onAdd(obra)}>
              Adicionar exemplar
            </Button>
          </div>
          {obra.exemplares.length === 0 && <p className="py-2 text-sm text-ink-muted">Esta obra ainda não tem exemplares físicos.</p>}
          <ul className="divide-y divide-line rounded-md border-[1.5px] border-line bg-panel">
            {obra.exemplares.map((ex) => {
              const loan = loansByExemplar.get(ex.id);
              return (
                <li key={ex.id} className="flex min-h-16 items-center gap-4 px-4 py-2 text-sm">
                  <span className="w-24 font-mono text-xs text-ink-soft">{ex.numeroInventario}</span>
                  {ex.disponivel ? <Badge tone="ok">Na estante</Badge> : <Badge tone={loan?.atrasado ? "danger" : "warn"}>{loan ? `Com ${loan.leitor.nome}` : "Emprestado"}</Badge>}
                  {ex.disponivel && (
                    <Button variant="ghost" size="icon" icon={Trash2} className="ml-auto" onClick={() => onDelete(ex)} aria-label={`Remover exemplar ${ex.numeroInventario}`} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </td>
    </tr>
  );
}

export default function AcervoPage({ search, onAddObra, onEditObra }) {
  const { obras, loans, deleteObra, addExemplar, deleteExemplar } = useLibrary();
  const confirm = useConfirm();
  const [filter, setFilter] = useState("todas");
  const [expanded, setExpanded] = useState(null);

  const enriched = useMemo(
    () => obras.map((o) => ({ ...o, total: o.exemplares.length, disponiveis: o.exemplares.filter((e) => e.disponivel).length })),
    [obras],
  );

  const loansByExemplar = useMemo(() => new Map(loans.filter((l) => !l.devolvido).map((l) => [l.exemplar.id, l])), [loans]);

  const visible = enriched.filter((o) => FILTERS[filter](o) && matches(search, o.titulo, o.autor, o.cdd, o.isbn));
  const count = (key) => enriched.filter(FILTERS[key]).length;

  const removeObra = async (obra) => {
    const ok = await confirm({
      title: "Excluir obra?",
      message: `“${obra.titulo}” e ${plural(obra.total, "exemplar", "exemplares")} serão removidos, junto com o histórico de empréstimos. Isso não pode ser desfeito.`,
    });
    if (ok) deleteObra(obra).catch(() => {});
  };

  const removeExemplar = async (ex) => {
    if (await confirm({ title: "Remover exemplar?", message: `O exemplar ${ex.numeroInventario} sairá do acervo.`, confirmLabel: "Remover" })) {
      deleteExemplar(ex).catch(() => {});
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Acervo"
        description={`${plural(obras.length, "obra")} · ${plural(enriched.reduce((n, o) => n + o.total, 0), "exemplar", "exemplares")}`}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={() => exportCsv(visible)}>
              Exportar CSV
            </Button>
            <Button icon={Plus} onClick={onAddObra}>
              Nova obra
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Filtrar obras"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "todas", label: "Todas", count: count("todas") },
            { value: "disponiveis", label: "Com exemplar livre", count: count("disponiveis") },
            { value: "esgotadas", label: "Todos emprestados", count: count("esgotadas") },
          ]}
        />
        {search && <p className="text-sm text-ink-muted">Resultados para “{search}”</p>}
      </div>

      <Panel className="overflow-x-auto">
        {visible.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={obras.length ? "Nenhuma obra encontrada" : "O acervo está vazio"}
            description={obras.length ? "Tente outro termo de busca ou filtro." : "Cadastre a primeira obra — a busca por ISBN preenche os dados para você."}
            action={!obras.length && <Button icon={Plus} onClick={onAddObra}>Nova obra</Button>}
          />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="py-2.5 pl-5 font-semibold">Obra</th>
                <th className="py-2.5 font-semibold">Autoria</th>
                <th className="py-2.5 font-semibold">CDD</th>
                <th className="py-2.5 text-right font-semibold">Exemplares</th>
                <th className="py-2.5 pl-6 font-semibold">Situação</th>
                <th className="w-24 py-2.5 pr-5" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((obra) => {
                const open = expanded === obra.id;
                return (
                  <Fragment key={obra.id}>
                    <tr className={`group ${open ? "bg-sunken/50" : "hover:bg-sunken/40"}`}>
                      <td className="py-2.5 pl-5">
                        <button onClick={() => setExpanded(open ? null : obra.id)} aria-expanded={open} className="flex items-center gap-3 text-left">
                          <ChevronRight size={20} className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-90" : ""}`} />
                          <Cover src={obra.capaUrl} title={obra.titulo} />
                          <span className="min-w-48">
                            <span className="block break-words font-semibold text-ink">{obra.titulo}</span>
                            {obra.anoPublicacao && <span className="text-xs text-ink-muted">{obra.anoPublicacao}{obra.editora && ` · ${obra.editora}`}</span>}
                          </span>
                        </button>
                      </td>
                      <td data-label="Autoria" className="max-w-56 min-w-40 break-words py-2.5 pr-4 text-ink-soft">{obra.autor || "—"}</td>
                      <td data-label="CDD" className="py-2.5 font-mono text-xs text-ink-soft">{obra.cdd || "—"}</td>
                      <td data-label="Exemplares" className="tabular py-2.5 text-right text-ink-soft">
                        <span className="font-medium text-ink">{obra.disponiveis}</span> / {obra.total}
                      </td>
                      <td data-label="Situação" className="py-2.5 pl-6">
                        {obra.total === 0 ? <Badge>Sem exemplares</Badge> : obra.disponiveis ? <Badge tone="ok">Disponível</Badge> : <Badge tone="warn">Todos emprestados</Badge>}
                      </td>
                      <td className="py-2.5 pr-5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" icon={Pencil} onClick={() => onEditObra(obra)} aria-label={`Editar ${obra.titulo}`} />
                          <Button variant="ghost" size="icon" icon={Trash2} onClick={() => removeObra(obra)} aria-label={`Excluir ${obra.titulo}`} />
                        </div>
                      </td>
                    </tr>
                    {open && <Exemplares obra={obra} loansByExemplar={loansByExemplar} onAdd={(o) => addExemplar(o).catch(() => {})} onDelete={removeExemplar} />}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </>
  );
}
