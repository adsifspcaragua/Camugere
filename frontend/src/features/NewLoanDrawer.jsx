import { useCallback, useMemo, useState } from "react";
import Drawer from "../components/ui/Drawer.jsx";
import Button from "../components/ui/Button.jsx";
import Cover from "../components/ui/Cover.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Autocomplete from "../components/Autocomplete.jsx";
import { Field, inputClass } from "../components/ui/Field.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { addDays, daysBetween } from "../lib/loans.js";
import { formatDate, matches } from "../lib/format.js";
import { loadSettings } from "../services/settings.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";

const toInputDate = (date) => date.toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso local

function LeitorOption({ leitor }) {
  return (
    <div className={`flex items-center gap-3 ${leitor.suspensao ? "opacity-70" : ""}`}>
      <Avatar name={leitor.nome} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm font-semibold text-ink">{leitor.nome}</p>
        <p className="wrap-anywhere text-xs text-ink-muted">{leitor.email}</p>
      </div>
      {leitor.suspensao && <Badge tone="danger">Suspenso</Badge>}
    </div>
  );
}

function ExemplarOption({ item }) {
  return (
    <div className="flex items-center gap-3">
      <Cover src={item.obra.capaUrl} title={item.obra.titulo} />
      <div className="min-w-0">
        <p className="break-words text-sm font-semibold text-ink">{item.obra.titulo}</p>
        <p className="break-words text-xs text-ink-muted">
          <span className="font-mono">{item.numeroInventario}</span> · {item.obra.autor || "Autor não informado"}
        </p>
      </div>
    </div>
  );
}

function LoanForm({ onClose, initialObra }) {
  const { obras, leitores, createLoan } = useLibrary();
  const settings = useMemo(() => loadSettings(), []);
  const today = useMemo(() => new Date(), []);

  const disponiveis = useMemo(
    () => obras.flatMap((obra) => obra.exemplares.filter((e) => e.disponivel).map((e) => ({ ...e, obra }))),
    [obras],
  );

  const [leitor, setLeitor] = useState(null);
  const [exemplar, setExemplar] = useState(() => (initialObra ? disponiveis.find((e) => e.obra.id === initialObra.id) ?? null : null));
  const [devolucao, setDevolucao] = useState(() => toInputDate(addDays(today, settings.prazoPadrao)));
  const [enviarEmail, setEnviarEmail] = useState(settings.enviarEmailPadrao);
  const [saving, setSaving] = useState(false);

  const dias = daysBetween(today, new Date(`${devolucao}T12:00:00`));
  const requestClose = useGuardedClose(onClose, Boolean(leitor || (exemplar && !initialObra)));
  const suspenso = leitor?.suspensao;
  const valid = leitor && !suspenso && exemplar && dias >= 1;

  const filterLeitor = useCallback((l, q) => matches(q, l.nome, l.email, l.cpf), []);
  const filterExemplar = useCallback((e, q) => matches(q, e.obra.titulo, e.obra.autor, e.numeroInventario), []);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await createLoan({ id_leitor: leitor.id, id_exemplar: exemplar.id, diasLocacao: dias, enviarNotificacao: enviarEmail });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      title="Novo empréstimo"
      description="Registre a saída de um exemplar do acervo."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid} loading={saving}>
            Registrar empréstimo
          </Button>
        </>
      }
    >
      <Field label="Leitor">
        {(id) => (
          <Autocomplete
            id={id}
            items={leitores}
            filter={filterLeitor}
            getKey={(l) => l.id}
            getLabel={(l) => l.nome}
            renderItem={(l) => <LeitorOption leitor={l} />}
            value={leitor}
            onChange={setLeitor}
            placeholder="Nome, e-mail ou CPF"
            emptyMessage="Nenhum leitor encontrado. Cadastre-o na página Leitores."
          />
        )}
      </Field>

      {suspenso && (
        <p role="alert" className="-mt-2 rounded-md border-[1.5px] border-danger/40 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {leitor.nome} está suspenso(a) {suspenso.dataFim ? `até ${formatDate(suspenso.dataFim)}` : "por tempo indeterminado"}: {suspenso.motivo}
        </p>
      )}

      <Field label="Exemplar" hint={`${disponiveis.length} exemplares disponíveis para empréstimo.`}>
        {(id) => (
          <Autocomplete
            id={id}
            items={disponiveis}
            filter={filterExemplar}
            getKey={(e) => e.id}
            getLabel={(e) => e.obra.titulo}
            renderItem={(e) => <ExemplarOption item={e} />}
            value={exemplar}
            onChange={setExemplar}
            placeholder="Título, autor ou nº de inventário"
            emptyMessage="Nenhum exemplar disponível com esse termo."
          />
        )}
      </Field>

      <Field label="Devolver até" hint={dias >= 1 ? `${dias} dias de empréstimo` : "Escolha uma data futura."}>
        {(id) => (
          <input id={id} autoComplete="off" type="date" value={devolucao} min={toInputDate(addDays(today, 1))} onChange={(e) => setDevolucao(e.target.value)} className={inputClass} required />
        )}
      </Field>

      <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-md border-2 border-ink p-4">
        <input type="checkbox" checked={enviarEmail} onChange={(e) => setEnviarEmail(e.target.checked)} className="mt-0.5 size-6 shrink-0 accent-[var(--forest)]" />
        <span className="text-sm">
          <span className="font-medium text-ink">Enviar comprovante por e-mail</span>
          <span className="block text-ink-muted">{leitor?.email ? `Para ${leitor.email}` : "O leitor recebe título, exemplar e data de devolução."}</span>
        </span>
      </label>

      {valid && (
        <div className="rounded-md border-[1.5px] border-line bg-sunken px-4 py-3 text-base text-ink-soft">
          <strong className="font-semibold text-ink">{exemplar.obra.titulo}</strong> para <strong className="font-semibold text-ink">{leitor.nome}</strong>, com devolução em{" "}
          <strong className="font-semibold text-ink">{formatDate(`${devolucao}T12:00:00`)}</strong>.
        </div>
      )}
    </Drawer>
  );
}

export default function NewLoanDrawer({ open, onClose, initialObra }) {
  return open ? <LoanForm onClose={onClose} initialObra={initialObra} /> : null;
}
