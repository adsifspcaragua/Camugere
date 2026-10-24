import { useCallback, useMemo, useState } from "react";
import Drawer from "../components/ui/Drawer.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Cover from "../components/ui/Cover.jsx";
import Autocomplete from "../components/Autocomplete.jsx";
import { Field } from "../components/ui/Field.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { formatDate, matches } from "../lib/format.js";
import { loanStatus } from "../lib/loans.js";

function LoanOption({ loan }) {
  const status = loanStatus(loan);
  return (
    <div className="flex items-center gap-3">
      <Cover src={loan.obra.capaUrl} title={loan.obra.titulo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{loan.obra.titulo}</p>
        <p className="truncate text-xs text-ink-muted">
          <span className="font-mono">{loan.exemplar.numeroInventario}</span> · {loan.leitor.nome}
        </p>
      </div>
      <Badge tone={status.tone}>{status.label}</Badge>
    </div>
  );
}

function ReturnForm({ onClose, initialLoan }) {
  const { loans, returnLoan } = useLibrary();
  const ativos = useMemo(() => loans.filter((l) => !l.devolvido).sort((a, b) => a.dataPrevista - b.dataPrevista), [loans]);
  const [loan, setLoan] = useState(initialLoan ?? null);
  const [saving, setSaving] = useState(false);

  const filter = useCallback((l, q) => matches(q, l.obra.titulo, l.leitor.nome, l.exemplar.numeroInventario), []);

  const submit = async () => {
    if (!loan) return;
    setSaving(true);
    try {
      await returnLoan(loan);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      onSubmit={submit}
      title="Registrar devolução"
      description="Dê baixa em um exemplar emprestado."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!loan} loading={saving}>
            Confirmar devolução
          </Button>
        </>
      }
    >
      <Field label="Empréstimo" hint={`${ativos.length} exemplares fora da biblioteca.`}>
        {(id) => (
          <Autocomplete
            id={id}
            items={ativos}
            filter={filter}
            getKey={(l) => l.id}
            getLabel={(l) => l.obra.titulo}
            renderItem={(l) => <LoanOption loan={l} />}
            value={loan}
            onChange={setLoan}
            placeholder="Nº de inventário, título ou leitor"
            emptyMessage="Nenhum empréstimo ativo encontrado."
          />
        )}
      </Field>

      {loan && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-line p-4 text-sm">
          <dt className="text-ink-muted">Leitor</dt>
          <dd className="text-right font-medium text-ink">{loan.leitor.nome}</dd>
          <dt className="text-ink-muted">Retirado em</dt>
          <dd className="tabular text-right text-ink">{formatDate(loan.dataInicio)}</dd>
          <dt className="text-ink-muted">Previsto para</dt>
          <dd className={`tabular text-right ${loan.atrasado ? "font-medium text-danger" : "text-ink"}`}>{formatDate(loan.dataPrevista)}</dd>
          {loan.atrasado && (
            <p className="col-span-2 rounded-sm bg-danger-soft px-3 py-2 text-danger">Devolução com {Math.abs(loan.diasRestantes)} dia(s) de atraso.</p>
          )}
        </dl>
      )}
    </Drawer>
  );
}

export default function ReturnDrawer({ open, onClose, initialLoan }) {
  return open ? <ReturnForm onClose={onClose} initialLoan={initialLoan} /> : null;
}
