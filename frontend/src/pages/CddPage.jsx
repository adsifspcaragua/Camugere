import { Fragment, useMemo, useState } from "react";
import { BookOpen, ChevronRight, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Badge from "../components/ui/Badge.jsx";
import Cover from "../components/ui/Cover.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { acharPorCodigo, filtrarCdds, normalizarCodigo } from "../lib/cdd.js";
import { plural } from "../lib/format.js";
import { fieldErrorsFromApi, validateCdd } from "../lib/validators.js";

function CddForm({ cdd, cdds, onClose }) {
  const { saveCdd } = useLibrary();
  const editing = Boolean(cdd);
  const { values, field, dirty, errors, validate, applyServerErrors } = useForm({ id: cdd?.id ?? "", descricao: cdd?.descricao ?? "" });
  const requestClose = useGuardedClose(onClose, dirty);
  const [saving, setSaving] = useState(false);

  const codigo = normalizarCodigo(values.id);
  const duplicado = !editing && codigo && acharPorCodigo(cdds, codigo);
  const [formError, setFormError] = useState("");
  const rules = (v) => validateCdd(v, { editing, existente: duplicado });

  const submit = async () => {
    setFormError("");
    if (!validate(rules)) return setFormError("Confira os campos destacados em vermelho.");
    setSaving(true);
    try {
      await saveCdd({ id: codigo, descricao: values.descricao.trim() }, cdd?.id);
      onClose();
    } catch (error) {
      if (!applyServerErrors(fieldErrorsFromApi(error))) {
        if (error.status === 409 && !editing) applyServerErrors({ id: error.message });
        else setFormError(error.message);
      }
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      error={formError}
      title={editing ? `Editar CDD ${cdd.id}` : "Novo CDD"}
      description={editing ? "O código não muda; o novo assunto vale para todas as obras com este CDD." : "Código e assunto, como na tabela da biblioteca."}
      footer={
        <Button type="submit" loading={saving}>
          {editing ? "Salvar" : "Cadastrar CDD"}
        </Button>
      }
    >
      <TextField
        label="Código"
        {...field("id")}
        placeholder="869.3"
        readOnly={editing}
        className={editing ? "[&_input]:bg-sunken" : ""}
        error={errors.id ?? (duplicado ? `O CDD ${duplicado.id} já está cadastrado como “${duplicado.descricao}”.` : undefined)}
        hint={editing ? undefined : "Use ponto como separador (869.3). Vírgulas e espaços são ajustados."}
        required
      />
      <TextField label="Assunto" {...field("descricao")} placeholder="Literatura brasileira — ficção" maxLength={150} required />
    </Drawer>
  );
}

const SEM_CDD = "__sem_cdd__";

/** Obras de um CDD (ou as sem CDD), com atalho para editar a classificação de cada uma. */
function ListaObras({ obras, vazio, onEditObra }) {
  return (
    <tr>
      <td colSpan={4} className="bg-sunken px-6 py-5">
        <div className="md:ml-8">
          {obras.length === 0 ? (
            <p className="py-2 text-sm text-ink-muted">{vazio}</p>
          ) : (
            <ul className="divide-y divide-line rounded-md border-[1.5px] border-line bg-panel">
              {obras.map((obra) => (
                <li key={obra.id} className="flex min-h-16 items-center gap-3 px-4 py-2 text-sm">
                  <Cover src={obra.capaUrl} title={obra.titulo} />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words font-semibold text-ink">{obra.titulo}</span>
                    <span className="block break-words text-xs text-ink-muted">{obra.autor || "Sem autoria"}</span>
                  </span>
                  <Button variant="ghost" size="icon" icon={Pencil} onClick={() => onEditObra(obra)} aria-label={`Editar ${obra.titulo}`} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function CddPage({ onEditObra }) {
  const { cdds, obras, deleteCdd } = useLibrary();
  const confirm = useConfirm();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null = fechado, {} = novo, cdd = edição
  const [aberto, setAberto] = useState(null); // id do CDD (ou SEM_CDD) com as obras à mostra

  const visible = useMemo(() => filtrarCdds(cdds, search), [cdds, search]);
  const obrasPorCdd = useMemo(() => {
    const mapa = new Map();
    obras.forEach((obra) => mapa.set(obra.cdd ?? SEM_CDD, [...(mapa.get(obra.cdd ?? SEM_CDD) ?? []), obra]));
    return mapa;
  }, [obras]);
  const semCdd = obrasPorCdd.get(SEM_CDD) ?? [];
  const alternar = (id) => setAberto((atual) => (atual === id ? null : id));

  const remove = async (cdd) => {
    if (await confirm({ title: "Excluir CDD?", message: `O CDD ${cdd.id} — ${cdd.descricao} será removido do cadastro. Nenhuma obra usa este código.` })) {
      deleteCdd(cdd).catch(() => {});
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Classificação (CDD)"
        description="Cadastre os códigos e assuntos e veja as obras de cada um. Ao catalogar uma obra, digitar o código preenche o assunto — e o contrário."
        actions={
          <Button icon={Plus} onClick={() => setForm({})}>
            Novo CDD
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por código ou assunto" className="w-full sm:max-w-md" />
        <p className="text-sm text-ink-muted">{plural(cdds.length, "CDD cadastrado", "CDDs cadastrados")}</p>
      </div>

      {semCdd.length > 0 && (
        <Panel className="mb-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <tbody>
              <tr>
                <td className="py-3 pl-5">
                  <button onClick={() => alternar(SEM_CDD)} aria-expanded={aberto === SEM_CDD} className="flex items-center gap-2 text-left font-semibold text-ink">
                    <ChevronRight size={20} className={`shrink-0 text-ink-muted transition-transform ${aberto === SEM_CDD ? "rotate-90" : ""}`} />
                    <BookOpen size={18} className="text-ink-muted" />
                    Obras sem CDD
                  </button>
                </td>
                <td className="py-3 pr-5 text-right text-ink-soft">{plural(semCdd.length, "obra")}</td>
              </tr>
              {aberto === SEM_CDD && <ListaObras obras={semCdd} onEditObra={onEditObra} />}
            </tbody>
          </table>
        </Panel>
      )}

      <Panel className="overflow-x-auto">
        {visible.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={cdds.length ? "Nenhum CDD encontrado" : "Nenhum CDD cadastrado"}
            description={cdds.length ? "Tente outro código ou outra palavra do assunto." : "Cadastre o primeiro código para poder escolhê-lo ao registrar as obras."}
            action={!cdds.length && <Button icon={Plus} onClick={() => setForm({})}>Novo CDD</Button>}
          />
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-muted">
                <th className="w-32 py-2.5 pl-5 font-semibold">Código</th>
                <th className="py-2.5 font-semibold">Assunto</th>
                <th className="py-2.5 text-right font-semibold">Obras</th>
                <th className="w-28 py-2.5 pr-5" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((cdd) => {
                const expandido = aberto === cdd.id;
                return (
                  <Fragment key={cdd.id}>
                    <tr className={expandido ? "bg-sunken/50" : "hover:bg-sunken/40"}>
                      <td className="py-2.5 pl-5">
                        <button onClick={() => alternar(cdd.id)} aria-expanded={expandido} aria-label={`Ver obras do CDD ${cdd.id}`} className="flex items-center gap-2 text-left">
                          <ChevronRight size={20} className={`shrink-0 text-ink-muted transition-transform ${expandido ? "rotate-90" : ""}`} />
                          <span className="font-mono text-sm font-semibold text-ink">{cdd.id}</span>
                        </button>
                      </td>
                      <td className="break-words py-2.5 pr-4 text-ink-soft">{cdd.descricao || <Badge tone="warn">Sem assunto</Badge>}</td>
                      <td className="tabular py-2.5 text-right text-ink-soft">{cdd.obras}</td>
                      <td className="py-2.5 pr-5">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" icon={Pencil} onClick={() => setForm(cdd)} aria-label={`Editar CDD ${cdd.id}`} />
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={Trash2}
                            onClick={() => remove(cdd)}
                            disabled={cdd.obras > 0}
                            tooltip={cdd.obras > 0 ? `Em uso por ${plural(cdd.obras, "obra")}` : undefined}
                            aria-label={`Excluir CDD ${cdd.id}`}
                          />
                        </div>
                      </td>
                    </tr>
                    {expandido && <ListaObras obras={obrasPorCdd.get(cdd.id) ?? []} vazio="Nenhuma obra usa este CDD ainda." onEditObra={onEditObra} />}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      {form && <CddForm key={form.id ?? "novo"} cdd={form.id ? form : null} cdds={cdds} onClose={() => setForm(null)} />}
    </>
  );
}
