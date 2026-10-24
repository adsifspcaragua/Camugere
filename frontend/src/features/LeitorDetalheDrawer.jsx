import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Mail, MapPin, Pencil, Phone, ShieldCheck } from "lucide-react";
import Drawer from "../components/ui/Drawer.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Cover from "../components/ui/Cover.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import { Field, TextArea, inputClass } from "../components/ui/Field.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { formatCpf, formatDate, formatEndereco, formatPhone } from "../lib/format.js";
import { loanStatus, normalizeLoan } from "../lib/loans.js";
import { listEmprestimosDoLeitor, listSuspensoes } from "../services/leitorService.js";

const DURACOES = [
  { value: "7", label: "7 dias" },
  { value: "15", label: "15 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "", label: "Até liberar manualmente" },
];

const SITUACAO = {
  ativa: { tone: "danger", label: "Ativa" },
  cumprida: { tone: "neutral", label: "Cumprida" },
  encerrada: { tone: "forest", label: "Encerrada antes do prazo" },
};

function SuspensaoForm({ leitor, onDone }) {
  const { suspendLeitor } = useLibrary();
  const [motivo, setMotivo] = useState("");
  const [dias, setDias] = useState("15");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (motivo.trim().length < 3) return;
    setSaving(true);
    try {
      await suspendLeitor(leitor, { motivo: motivo.trim(), dias: dias ? Number(dias) : null });
      onDone();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-md border border-danger/30 bg-danger-soft/40 p-4">
      <TextArea label="Motivo da suspensão" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="Atraso de mais de 30 dias na devolução de…" />
      <Field label="Duração">
        {(id) => (
          <select id={id} value={dias} onChange={(e) => setDias(e.target.value)} className={inputClass}>
            {DURACOES.map((d) => (
              <option key={d.label} value={d.value}>{d.label}</option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button variant="danger" size="sm" icon={Ban} onClick={submit} loading={saving} disabled={motivo.trim().length < 3}>
          Suspender leitor
        </Button>
      </div>
    </div>
  );
}

function LoanList({ loans, empty }) {
  if (!loans.length) return <p className="py-6 text-center text-sm text-ink-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line rounded-md border border-line">
      {loans.map((loan) => {
        const status = loanStatus(loan);
        return (
          <li key={loan.id} className="flex items-center gap-3 px-3 py-2.5">
            <Cover src={loan.obra.capaUrl} title={loan.obra.titulo} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{loan.obra.titulo}</p>
              <p className="tabular text-xs text-ink-muted">
                {formatDate(loan.dataInicio)} → {formatDate(loan.devolvido ? loan.dataDevolucao : loan.dataPrevista)}
              </p>
            </div>
            <Badge tone={status.tone}>{status.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

function SuspensaoList({ suspensoes }) {
  if (!suspensoes.length) return <p className="py-6 text-center text-sm text-ink-muted">Este leitor nunca foi suspenso.</p>;
  return (
    <ul className="space-y-2">
      {suspensoes.map((s) => (
        <li key={s.id} className="rounded-md border border-line px-3 py-2.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="tabular text-xs text-ink-muted">
              {formatDate(s.dataInicio)} → {s.dataEncerramento ? formatDate(s.dataEncerramento) : s.dataFim ? formatDate(s.dataFim) : "indeterminado"}
            </span>
            <Badge tone={SITUACAO[s.situacao].tone}>{SITUACAO[s.situacao].label}</Badge>
          </div>
          <p className="mt-1 text-ink">{s.motivo}</p>
          {s.bibliotecario && <p className="mt-0.5 text-xs text-ink-muted">Aplicada por {s.bibliotecario.usuario.nome}</p>}
        </li>
      ))}
    </ul>
  );
}

function Detalhe({ leitorId, onClose, onEdit }) {
  const { leitores, loans: allLoans, endSuspension } = useLibrary();
  const toast = useToast();
  const leitor = leitores.find((l) => l.id === leitorId);
  const [aba, setAba] = useState("ativos");
  const [historico, setHistorico] = useState(null);
  const [suspensoes, setSuspensoes] = useState(null);
  const [suspendendo, setSuspendendo] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [emprestimos, susp] = await Promise.all([listEmprestimosDoLeitor(leitorId), listSuspensoes(leitorId)]);
      const hoje = new Date();
      setHistorico(emprestimos.map((e) => normalizeLoan(e, hoje)));
      setSuspensoes(susp);
    } catch (error) {
      toast.error(error.message);
    }
  }, [leitorId, toast]);

  // Recarrega quando os dados globais mudam (devolução, suspensão etc.).
  useEffect(() => {
    carregar();
  }, [carregar, allLoans, leitor?.suspensao?.id]);

  const ativos = useMemo(() => (historico ?? []).filter((l) => !l.devolvido), [historico]);
  if (!leitor) return null;

  const endereco = formatEndereco(leitor);
  const s = leitor.suspensao;

  return (
    <Drawer
      open
      onClose={onClose}
      title={leitor.nome}
      description={`CPF ${formatCpf(leitor.cpf)}`}
      footer={
        <Button variant="secondary" icon={Pencil} onClick={() => onEdit(leitor)}>
          Editar cadastro
        </Button>
      }
    >
      <div className="flex items-start gap-4">
        <Avatar name={leitor.nome} size="lg" />
        <ul className="min-w-0 space-y-1.5 text-sm text-ink-soft">
          <li className="flex items-center gap-2"><Mail size={14} className="shrink-0 text-ink-muted" />{leitor.email}</li>
          {leitor.telefone && <li className="flex items-center gap-2"><Phone size={14} className="shrink-0 text-ink-muted" />{formatPhone(leitor.telefone)}</li>}
          <li className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-ink-muted" />{endereco || <span className="text-ink-muted">Endereço não informado</span>}</li>
        </ul>
      </div>

      {s ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft p-4 text-sm">
          <p className="font-medium text-danger">Suspenso {s.dataFim ? `até ${formatDate(s.dataFim)}` : "por tempo indeterminado"}</p>
          <p className="mt-1 text-ink-soft">{s.motivo}</p>
          <Button variant="secondary" size="sm" icon={ShieldCheck} className="mt-3" onClick={() => endSuspension(leitor).catch(() => {})}>
            Liberar agora
          </Button>
        </div>
      ) : suspendendo ? (
        <SuspensaoForm leitor={leitor} onDone={() => setSuspendendo(false)} />
      ) : (
        <Button variant="ghost-danger" size="sm" icon={Ban} onClick={() => setSuspendendo(true)}>
          Suspender empréstimos deste leitor
        </Button>
      )}

      <div className="space-y-3 border-t border-line pt-5">
        <Segmented
          label="Histórico do leitor"
          value={aba}
          onChange={setAba}
          options={[
            { value: "ativos", label: "Em andamento", count: ativos.length },
            { value: "historico", label: "Todos", count: historico?.length ?? 0 },
            { value: "suspensoes", label: "Suspensões", count: suspensoes?.length ?? 0 },
          ]}
        />
        {historico === null ? (
          <p className="py-6 text-center text-sm text-ink-muted">Carregando…</p>
        ) : aba === "ativos" ? (
          <LoanList loans={ativos} empty="Nenhum livro com este leitor agora." />
        ) : aba === "historico" ? (
          <LoanList loans={historico} empty="Nenhum empréstimo registrado." />
        ) : (
          <SuspensaoList suspensoes={suspensoes ?? []} />
        )}
      </div>
    </Drawer>
  );
}

export default function LeitorDetalheDrawer({ open, leitorId, onClose, onEdit }) {
  return open ? <Detalhe leitorId={leitorId} onClose={onClose} onEdit={onEdit} /> : null;
}
