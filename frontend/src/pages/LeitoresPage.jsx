import { useMemo, useState } from "react"
import {
  Mail,
  Phone,
  Hash,
  BookOpen,
  AlertTriangle,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Ban,
  CheckCircle,
  X,
} from "lucide-react"

export default function LeitoresPage({
  emprestimos,
  leitores,
  onAddLeitor,
  onEditLeitor,
  onDeleteLeitor,
  onSuspendLeitor,
  onReactivateLeitor,
  onLoadHistory,
  readerDetails = {},
}) {
  const [search, setSearch] = useState("")
  const [selectedLeitorId, setSelectedLeitorId] = useState(null)

  const leitoresEnriched = useMemo(() => {
    return leitores.map((leitor) => {
      const ativos = emprestimos.filter(
        (e) => e.idLeitor === leitor.idLeitor && e.status === "ativo",
      )
      const devolvidos = emprestimos.filter(
        (e) => e.idLeitor === leitor.idLeitor && e.status === "devolvido",
      )
      const today = new Date().toISOString().split("T")[0]
      const atrasos = ativos.filter((e) => e.dataDevolucaoPrevista < today)
      const bloqueado =
        leitor.podeEmprestar === false &&
        (!leitor.suspensoAte || new Date(leitor.suspensoAte) > new Date())
      return {
        ...leitor,
        ativos,
        devolvidos,
        atrasos,
        bloqueado,
        totalEmprestimos: ativos.length + devolvidos.length,
      }
    })
  }, [emprestimos, leitores])

  const filtered = useMemo(() => {
    if (!search.trim()) return leitoresEnriched
    const q = search.toLowerCase()
    return leitoresEnriched.filter((l) =>
      [l.nome, l.contato, l.telefone].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(q),
      ),
    )
  }, [leitoresEnriched, search])

  const selectedLeitor = selectedLeitorId
    ? leitoresEnriched.find((l) => l.idLeitor === selectedLeitorId)
    : null
  const detail = selectedLeitor ? readerDetails[selectedLeitor.idLeitor] : null
  const activeSuspensao = detail?.suspensoes?.find(
    (s) =>
      !s.dataReativacao && (!s.dataFim || new Date(s.dataFim) > new Date()),
  )

  const openHistory = (leitor) => {
    setSelectedLeitorId(leitor.idLeitor)
    onLoadHistory?.(leitor.idLeitor)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-surface-900 dark:text-white">
            Leitores
          </h2>
          <p className="mt-1 text-base text-surface-400 dark:text-surface-500">
            {leitores.length} leitores cadastrados na comunidade
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar leitor..."
              className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-2.5 pl-11 pr-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100 dark:placeholder-surface-500 dark:focus:border-brand-500"
            />
          </div>
          <button
            onClick={onAddLeitor}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <Plus size={18} />
            Novo Leitor
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((leitor) => (
          <div
            key={leitor.idLeitor}
            className="rounded-2xl border border-surface-200 bg-white p-5 transition-all duration-200 hover:shadow-md dark:border-surface-800 dark:bg-surface-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-base font-bold text-white">
                {leitor.nome
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-surface-800 dark:text-surface-200">
                  {leitor.nome}
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-base text-surface-400 dark:text-surface-500">
                    <Mail size={16} />
                    <span className="truncate">{leitor.contato}</span>
                  </div>
                  {leitor.telefone && (
                    <div className="flex items-center gap-2 text-base text-surface-400 dark:text-surface-500">
                      <Phone size={16} />
                      <span className="truncate">{leitor.telefone}</span>
                    </div>
                  )}
                </div>
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${leitor.bloqueado ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"}`}
                >
                  {leitor.bloqueado ? "Bloqueado" : "Ativo"}
                </span>
              </div>
              {/* Action buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openHistory(leitor)}
                  className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800 dark:hover:text-brand-400"
                  title="Ver histórico do leitor"
                >
                  <Eye size={15} />
                </button>
                {leitor.bloqueado ? (
                  <button
                    onClick={() =>
                      onReactivateLeitor?.(leitor, activeSuspensao?.id)
                    }
                    className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                    title="Reativar leitor"
                  >
                    <CheckCircle size={15} />
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspendLeitor?.(leitor)}
                    className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                    title="Suspender leitor"
                  >
                    <Ban size={15} />
                  </button>
                )}
                <button
                  onClick={() => onEditLeitor && onEditLeitor(leitor)}
                  className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800 dark:hover:text-brand-400"
                  title="Editar leitor"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() =>
                    onDeleteLeitor && onDeleteLeitor(leitor.idLeitor)
                  }
                  className="rounded-lg p-2 text-surface-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  title={
                    leitor.ativos.length > 0
                      ? "Leitor com empréstimos ativos"
                      : "Excluir leitor"
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {/* Loan stats */}
            <div className="mt-4 flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-surface-800">
                <BookOpen size={14} className="text-brand-500" />
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  {leitor.ativos.length} ativo
                  {leitor.ativos.length !== 1 && "s"}
                </span>
              </div>
              <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-surface-800">
                <Hash size={14} className="text-surface-400" />
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  {leitor.totalEmprestimos} total
                </span>
              </div>
              {leitor.atrasos.length > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-500/10">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">
                    {leitor.atrasos.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-base text-surface-400 dark:text-surface-500">
              Nenhum leitor encontrado.
            </p>
          </div>
        )}
      </div>
      {selectedLeitor && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLeitorId(null)}
        >
          <section
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`Histórico de ${selectedLeitor.nome}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-surface-900 dark:text-white">
                  Histórico de {selectedLeitor.nome}
                </h3>
                <p className="mt-1 text-sm text-surface-500">
                  Empréstimos e suspensões registradas
                </p>
              </div>
              <button
                onClick={() => setSelectedLeitorId(null)}
                className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"
                aria-label="Fechar histórico"
              >
                <X size={18} />
              </button>
            </div>
            {!detail ? (
              <p className="py-8 text-sm text-surface-500">
                Carregando histórico...
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-500">
                    Empréstimos ativos ({detail.ativos?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(detail.ativos || []).map((loan) => (
                      <div
                        key={loan.id}
                        className="rounded-xl bg-surface-50 p-3 text-sm dark:bg-surface-800"
                      >
                        <strong>{loan.exemplar?.obra?.titulo || "Obra"}</strong>{" "}
                        · desde{" "}
                        {new Date(loan.dataInicio).toLocaleDateString("pt-BR")}
                      </div>
                    ))}
                    {!detail.ativos?.length && (
                      <p className="text-sm text-surface-500">
                        Nenhum empréstimo ativo.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-500">
                    Histórico de empréstimos ({detail.emprestimos?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(detail.emprestimos || []).map((loan) => (
                      <div
                        key={loan.id}
                        className="flex justify-between rounded-xl border border-surface-100 p-3 text-sm dark:border-surface-800"
                      >
                        <span>{loan.exemplar?.obra?.titulo || "Obra"}</span>
                        <span className="text-surface-500">
                          {loan.statusDevolucao ? "Devolvido" : "Ativo"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-surface-500">
                    Histórico de suspensões ({detail.suspensoes?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(detail.suspensoes || []).map((suspensao) => (
                      <div
                        key={suspensao.id}
                        className="rounded-xl border border-surface-100 p-3 text-sm dark:border-surface-800"
                      >
                        <p className="font-medium">{suspensao.motivo}</p>
                        <p className="mt-1 text-surface-500">
                          {new Date(suspensao.dataInicio).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          {suspensao.dataReativacao
                            ? `· reativado em ${new Date(suspensao.dataReativacao).toLocaleDateString("pt-BR")}`
                            : "· ativo"}
                        </p>
                      </div>
                    ))}
                    {!detail.suspensoes?.length && (
                      <p className="text-sm text-surface-500">
                        Nenhuma suspensão registrada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
