import { useMemo, useState } from "react";
import { useLibrary } from "../context/LibraryContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import { inputClass } from "../components/ui/Field.jsx";
import { Download } from "lucide-react";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Cover from "../components/ui/Cover.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { downloadFile, formatDate, formatPhone, toCsv } from "../lib/format.js";
import { CLASSES_CDD, MESES, devolveuAtrasado, filterByPeriod, porClasseCdd, porMes, relatorioAtrasos, topAtrasos, topLeitores, topObras } from "../lib/reports.js";

function exportarAtrasos(linhas, telefones) {
  const rows = [["Obra", "Inventário", "Leitor", "E-mail", "Telefone", "Retirada", "Prevista", "Devolvida", "Dias de atraso", "Situação"]];
  linhas.forEach((l) =>
    rows.push([l.obra.titulo, l.exemplar.numeroInventario, l.leitor.nome, l.leitor.email, telefones.get(l.leitor.id) ?? "", formatDate(l.dataInicio), formatDate(l.dataPrevista), l.devolvido ? formatDate(l.dataDevolucao) : "", l.diasAtraso, l.emAberto ? "Em aberto" : "Devolvido com atraso"]),
  );
  downloadFile(toCsv(rows), `atrasos-camugere-${new Date().toISOString().slice(0, 10)}.csv`);
}

function RelatorioAtrasos({ linhas, telefones }) {
  const abertos = linhas.filter((l) => l.emAberto).length;
  return (
    <Panel className="overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Empréstimos atrasados</h2>
          <p className="mt-0.5 text-xs text-ink-muted">{abertos} em aberto agora · {linhas.length - abertos} devolvidos fora do prazo no período</p>
        </div>
        <Button variant="secondary" size="sm" icon={Download} onClick={() => exportarAtrasos(linhas, telefones)} disabled={!linhas.length}>
          Exportar CSV
        </Button>
      </div>
      {linhas.length === 0 ? (
        <EmptyState title="Nenhum atraso" description="Nenhum empréstimo em atraso nem devolvido fora do prazo no período." />
      ) : (
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-muted">
              <th className="py-2.5 pl-5 font-semibold">Obra</th>
              <th className="py-2.5 font-semibold">Leitor</th>
              <th className="py-2.5 font-semibold">Prevista</th>
              <th className="py-2.5 font-semibold">Devolvida</th>
              <th className="py-2.5 text-right font-semibold">Atraso</th>
              <th className="py-2.5 pr-5 pl-6 font-semibold">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {linhas.map((l) => (
              <tr key={l.id}>
                <td className="py-2.5 pl-5">
                  <div className="flex items-center gap-3">
                    <Cover src={l.obra.capaUrl} title={l.obra.titulo} />
                    <div className="min-w-48">
                      <p className="break-words font-semibold text-ink">{l.obra.titulo}</p>
                      <p className="font-mono text-xs text-ink-muted">{l.exemplar.numeroInventario}</p>
                    </div>
                  </div>
                </td>
                <td data-label="Leitor" className="min-w-44 py-2.5 pr-4">
                  <p className="text-ink">{l.leitor.nome}</p>
                  <p className="text-xs wrap-anywhere text-ink-muted">{[l.leitor.email, telefones.get(l.leitor.id) && formatPhone(telefones.get(l.leitor.id))].filter(Boolean).join(" · ")}</p>
                </td>
                <td data-label="Prevista" className="tabular py-2.5 text-ink-soft">{formatDate(l.dataPrevista)}</td>
                <td data-label="Devolvida" className="tabular py-2.5 text-ink-soft">{l.devolvido ? formatDate(l.dataDevolucao) : "—"}</td>
                <td data-label="Atraso" className={`tabular py-2.5 text-right font-medium ${l.emAberto ? "text-danger" : "text-ink-soft"}`}>{l.diasAtraso}d</td>
                <td data-label="Situação" className="py-2.5 pr-5 pl-6">{l.emAberto ? <Badge tone="danger">Em aberto</Badge> : <Badge>Devolvido com atraso</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

function Ranking({ title, description, rows, unit, tone = "forest" }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel>
      <PanelHeader title={title} description={description} />
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-ink-muted">Sem dados no período.</p>
      ) : (
        <ol className="space-y-3 px-5 py-4">
          {rows.map((row, i) => (
            <li key={row.key} className="grid grid-cols-[20px_1fr_auto] items-center gap-x-3 gap-y-1 text-sm">
              <span className="tabular text-xs text-ink-muted">{i + 1}</span>
              <span className="break-words text-ink">{row.label}</span>
              <span className="tabular text-xs text-ink-soft">
                {row.count} {unit}
              </span>
              <span className="col-start-2 col-end-4 h-2 overflow-hidden rounded-full bg-sunken">
                <span className={`block h-full rounded-full ${tone === "danger" ? "bg-danger" : "bg-forest"}`} style={{ width: `${(row.count / max) * 100}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function MonthlyChart({ data, ano }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Panel className="overflow-x-auto lg:col-span-2">
      <PanelHeader title={`Empréstimos por mês · ${ano}`} description={`${data.reduce((n, d) => n + d.count, 0)} no ano`} />
      <div className="flex h-44 min-w-[30rem] items-end gap-2 px-5 pt-6 pb-4 sm:min-w-0" role="img" aria-label={`Empréstimos por mês em ${ano}`}>
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="tabular text-xs text-ink-muted">{d.count || ""}</span>
            <span className="w-full max-w-9 rounded-t-sm bg-forest/85" style={{ height: `${(d.count / max) * 100}px`, minHeight: d.count ? 3 : 1, opacity: d.count ? 1 : 0.25 }} />
            <span className="text-xs text-ink-muted">{d.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function RelatoriosPage() {
  const { loans, obras, leitores } = useLibrary();
  const [visao, setVisao] = useState("geral");
  const anoAtual = new Date().getFullYear();
  const anos = useMemo(() => [...new Set([anoAtual, ...loans.map((l) => l.dataInicio.getFullYear())])].sort((a, b) => b - a), [loans, anoAtual]);

  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState("");

  const periodo = useMemo(() => filterByPeriod(loans, { ano: ano === "todos" ? null : Number(ano), mes: mes === "" ? null : Number(mes) }), [loans, ano, mes]);
  const atrasos = periodo.filter(devolveuAtrasado).length;
  const linhasAtraso = useMemo(() => relatorioAtrasos(loans, periodo), [loans, periodo]);
  const telefones = useMemo(() => new Map(leitores.map((l) => [l.id, l.telefone])), [leitores]);
  const cdd = porClasseCdd(obras);
  const maxCdd = Math.max(1, ...cdd.map((c) => c.count));

  return (
    <>
      <PageHeader
        eyebrow="Indicadores"
        title="Relatórios"
        description="Como o acervo está circulando na comunidade."
        actions={
          <div className="flex gap-2">
            <select value={ano} onChange={(e) => setAno(e.target.value === "todos" ? "todos" : Number(e.target.value))} className={`${inputClass} w-auto`} aria-label="Ano">
              <option value="todos">Todos os anos</option>
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <select value={mes} onChange={(e) => setMes(e.target.value)} className={`${inputClass} w-auto`} aria-label="Mês" disabled={ano === "todos"}>
              <option value="">Ano inteiro</option>
              {MESES.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
        }
      />

      <Panel className="mb-6 grid divide-line max-sm:divide-y sm:grid-cols-3 sm:divide-x">
        {[
          ["Empréstimos no período", periodo.length],
          ["Leitores atendidos", new Set(periodo.map((l) => l.leitor.id)).size],
          ["Com atraso", atrasos],
        ].map(([label, value]) => (
          <div key={label} className="px-6 py-5">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="tabular mt-1 font-display font-bold text-3xl text-ink">{value}</p>
          </div>
        ))}
      </Panel>

      <div className="mb-4">
        <Segmented
          label="Tipo de relatório"
          value={visao}
          onChange={setVisao}
          options={[
            { value: "geral", label: "Visão geral" },
            { value: "atrasos", label: "Atrasos", count: linhasAtraso.filter((l) => l.emAberto).length, alert: true },
          ]}
        />
      </div>

      {visao === "atrasos" ? (
        <RelatorioAtrasos linhas={linhasAtraso} telefones={telefones} />
      ) : (
      <div className="grid gap-6 lg:grid-cols-2">
        {ano !== "todos" && <MonthlyChart data={porMes(loans, Number(ano))} ano={ano} />}
        <Ranking title="Obras mais emprestadas" rows={topObras(periodo)} unit="emp." />
        <Ranking title="Leitores mais ativos" rows={topLeitores(periodo)} unit="emp." />
        <Ranking title="Atrasos por leitor" description="Inclui devoluções feitas fora do prazo" rows={topAtrasos(periodo)} unit="atrasos" tone="danger" />

        <Panel>
          <PanelHeader title="Acervo por classe CDD" description="Todas as obras ativas" />
          <ul className="space-y-2.5 px-5 py-4 text-sm">
            {cdd.map((c) => (
              <li key={c.label} className="grid grid-cols-[44px_1fr_auto] items-center gap-3">
                <span className="font-mono text-xs text-ink-soft">{c.label === "Sem CDD" ? "—" : c.label}</span>
                <span>
                  <span className="block break-words text-xs text-ink-muted">{CLASSES_CDD[c.label] ?? "Sem classificação"}</span>
                  <span className="mt-1.5 block h-2 rounded-full bg-sunken">
                    <span className="block h-full rounded-full bg-clay" style={{ width: `${(c.count / maxCdd) * 100}%` }} />
                  </span>
                </span>
                <span className="tabular text-xs text-ink-soft">{c.count}</span>
              </li>
            ))}
            {cdd.length === 0 && <p className="py-4 text-center text-ink-muted">Nenhuma obra cadastrada.</p>}
          </ul>
        </Panel>
      </div>
      )}
    </>
  );
}
