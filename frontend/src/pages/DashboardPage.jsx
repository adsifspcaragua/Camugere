import { useMemo } from "react";
import { AlertTriangle, ArrowRight, BookPlus, CornerDownLeft, Plus, UserPlus } from "lucide-react";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Cover from "../components/ui/Cover.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { formatShortDate } from "../lib/format.js";
import { loanStatus } from "../lib/loans.js";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Metric({ label, value, detail, tone, onClick }) {
  const alerta = tone === "danger" && value > 0;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start rounded-2xl px-5 py-4 text-left transition-colors ${alerta ? "bg-danger-soft hover:bg-danger-soft/70" : "bg-panel hover:bg-sunken"}`}
    >
      <span className={`text-xs font-medium ${alerta ? "text-danger" : "text-ink-muted"}`}>{label}</span>
      <span className={`tabular mt-1 font-display text-[34px] leading-none ${alerta ? "text-danger" : "text-ink"}`}>{value}</span>
      <span className="mt-2 text-xs text-ink-muted">{detail}</span>
    </button>
  );
}

// Atalhos do balcão: as quatro coisas que a bibliotecária mais faz.
function QuickAction({ icon: Icon, title, hint, kbd, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-2xl p-4 text-left transition-colors ${primary ? "bg-forest text-on-forest hover:bg-forest-strong" : "bg-panel text-ink hover:bg-sunken"}`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${primary ? "bg-on-forest/15" : "bg-sunken group-hover:bg-panel"}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className={`block text-xs ${primary ? "opacity-75" : "text-ink-muted"}`}>{hint}</span>
      </span>
      {kbd && <span className={`hidden rounded-md px-1.5 font-mono text-[11px] sm:block ${primary ? "bg-on-forest/15" : "bg-sunken text-ink-muted"}`}>{kbd}</span>}
    </button>
  );
}

function LoanRow({ loan }) {
  const status = loanStatus(loan);
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <Cover src={loan.obra.capaUrl} title={loan.obra.titulo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{loan.obra.titulo}</p>
        <p className="truncate text-xs text-ink-muted">
          {loan.leitor.nome} · <span className="font-mono">{loan.exemplar.numeroInventario}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge tone={status.tone}>{status.label}</Badge>
        <span className="tabular text-xs text-ink-muted">até {formatShortDate(loan.dataPrevista)}</span>
      </div>
    </li>
  );
}

export default function DashboardPage({ onNavigate, onNewLoan, onReturn, onNewLeitor, onNewObra }) {
  const { stats, loans, leitores } = useLibrary();
  const { user } = useAuth();

  const { atencao, recentes } = useMemo(() => {
    const ativos = loans.filter((l) => !l.devolvido);
    return {
      atencao: ativos.filter((l) => l.diasRestantes <= 2).sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, 6),
      recentes: [...loans].sort((a, b) => b.dataInicio - a.dataInicio).slice(0, 6),
    };
  }, [loans]);

  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const ocupacao = stats.exemplares ? Math.round(((stats.exemplares - stats.disponiveis) / stats.exemplares) * 100) : 0;

  return (
    <>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium tracking-[0.14em] text-clay uppercase">{hoje}</p>
          <h1 className="font-display text-[30px] leading-tight font-medium text-ink">
            {greeting()}, {user?.nome?.split(" ")[0]}.
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {stats.atrasados > 0
              ? `Há ${stats.atrasados} empréstimo(s) em atraso precisando de contato.`
              : "Nenhum empréstimo em atraso. Tudo em dia por aqui."}
          </p>
        </div>
      </header>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickAction primary icon={Plus} title="Emprestar livro" hint="Leitor + exemplar, pronto" kbd="N" onClick={onNewLoan} />
        <QuickAction icon={CornerDownLeft} title="Receber devolução" hint="Busque pelo nº ou leitor" kbd="D" onClick={onReturn} />
        <QuickAction icon={UserPlus} title="Cadastrar leitor" hint="CEP preenche o endereço" onClick={onNewLeitor} />
        <QuickAction icon={BookPlus} title="Adicionar livro" hint="ISBN preenche tudo" onClick={onNewObra} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Obras no acervo" value={stats.obras} detail={`${stats.exemplares} exemplares`} onClick={() => onNavigate("acervo")} />
        <Metric label="Emprestados agora" value={stats.ativos} detail={`${ocupacao}% do acervo em circulação`} onClick={() => onNavigate("emprestimos")} />
        <Metric label="Em atraso" value={stats.atrasados} tone="danger" detail={`${stats.venceEmBreve} vencem em até 2 dias`} onClick={() => onNavigate("emprestimos")} />
        <Metric label="Leitores" value={leitores.length} detail="cadastrados" onClick={() => onNavigate("leitores")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Pedem atenção"
            description="Atrasados e com vencimento próximo"
            actions={
              <Button variant="ghost" size="sm" onClick={() => onNavigate("emprestimos")}>
                Ver todos <ArrowRight size={14} />
              </Button>
            }
          />
          {atencao.length ? (
            <ul className="divide-y divide-line">{atencao.map((l) => <LoanRow key={l.id} loan={l} />)}</ul>
          ) : (
            <EmptyState icon={AlertTriangle} title="Nada pendente" description="Nenhum empréstimo vencido ou vencendo nos próximos dias." />
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Movimentação recente" description="Últimos empréstimos registrados" />
          {recentes.length ? (
            <ul className="divide-y divide-line">{recentes.map((l) => <LoanRow key={l.id} loan={l} />)}</ul>
          ) : (
            <EmptyState title="Nenhum empréstimo ainda" description="Os empréstimos registrados aparecem aqui." action={<Button size="sm" icon={Plus} onClick={onNewLoan}>Novo empréstimo</Button>} />
          )}
        </Panel>
      </div>


    </>
  );
}
