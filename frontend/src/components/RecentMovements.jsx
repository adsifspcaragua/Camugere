import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { getExemplarById } from "../../services/exemplarService.js";
import { getObraById } from "../../services/obraService.js";
import { getLeitorById } from "../../services/leitorService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RecentMovements({ emprestimos = [], exemplares = [], obras = [], leitores = [], onNavigate }) {
  const [data, setData] = useState([]);
  const { isLoading, token } = useAuth();

  const formatarData = (dataIso) => {
    if (!dataIso) return "—";
    return dataIso.split("T")[0].split("-").reverse().join("/");
  };

  useEffect(() => {
    let cancelado = false;

    async function carregarDados() {
      if (!emprestimos) return;
      
      try {
        const emprestimosRecentes = [...emprestimos]
          .filter((e) => e.status === "ativo" || e.statusDevolucao === false)
          .sort((a, b) => new Date(b.dataInicio) - new Date(a.dataInicio))
          .slice(0, 5);

        const resultados = await Promise.all(
          emprestimosRecentes.map(async (emp) => {
            const idEx = Number(emp.idExemplar ?? emp.id_exemplar);
            const idLei = Number(emp.idLeitor ?? emp.id_leitor);

            // 1. Tenta resolver exemplar pela memória ou pelo objeto já aninhado no empréstimo
            let exe =
              exemplares.find((e) => Number(e.idExemplar ?? e.id) === idEx) ||
              emp.exemplar ||
              null;

            if (!exe && idEx) {
              const resExe = await getExemplarById(idEx);
              exe = resExe?.data || resExe || null;
            }

            // 2. Tenta resolver obra pela memória, pelo exemplar aninhado ou buscando na API
            const idDaObra = Number(exe?.idObra ?? exe?.id_obra ?? emp.exemplar?.id_obra);
            let obr =
              obras.find((o) => Number(o.idObra ?? o.id) === idDaObra) ||
              exe?.obra ||
              emp.exemplar?.obra ||
              null;

            if (!obr?.titulo && idDaObra) {
              const resObra = await getObraById(idDaObra);
              obr = resObra?.data || resObra || obr;
            }

            // 3. Tenta resolver leitor pela memória, pelo empréstimo aninhado ou buscando na API
            const leiMem = leitores.find((l) => Number(l.idLeitor ?? l.id) === idLei);
            let nomeLeitor =
              emp.leitor?.usuario?.nome ||
              leiMem?.usuario?.nome ||
              (leiMem?.nome && !/^Leitor \d+$/.test(leiMem.nome) ? leiMem.nome : null);

            let leiObj = emp.leitor?.usuario || leiMem?.usuario || leiMem || null;

            if (!nomeLeitor && idLei) {
              const resLei = await getLeitorById(idLei);
              if (resLei?.usuario?.nome) {
                nomeLeitor = resLei.usuario.nome;
                leiObj = resLei.usuario;
              } else if (resLei?.leitor?.usuario?.nome) {
                nomeLeitor = resLei.leitor.usuario.nome;
                leiObj = resLei.leitor.usuario;
              }
            }

            return {
              emprestimo: emp,
              exemplar: exe,
              leitor: { ...(leiObj || {}), nome: nomeLeitor || leiMem?.nome || "Leitor" },
              obra: obr?.data || obr,
            };
          })
        );

        if (!cancelado) {
          setData(resultados);
        }
      } catch (error) {
        console.error("Erro ao carregar os movimentos recentes:", error);
      }
    }

    carregarDados();

    return () => {
      cancelado = true;
    };
  }, [isLoading, token, emprestimos, exemplares, obras, leitores]);

  return (
    <div className="rounded-2xl border border-surface-200 bg-white transition-colors duration-300 dark:border-surface-800 dark:bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-surface-800">
        <h3 className="text-base font-semibold text-surface-900 dark:text-white">
          Empréstimos Recentes
        </h3>
        <span className="rounded-lg bg-surface-100 px-3 py-1 text-base font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
          Ativos
        </span>
      </div>
      <div className="divide-y divide-surface-100 dark:divide-surface-800">
        {data.map((item, index) => (
          <button
            key={index}
            onClick={() => onNavigate && onNavigate("emprestimos")}
            className="w-full flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-50 focus:bg-surface-50 focus:outline-none dark:hover:bg-surface-800/50 dark:focus:bg-surface-800/50 text-left cursor-pointer"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <ArrowUpRight size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-surface-800 dark:text-surface-200">
                {item.obra?.titulo || "Obra Desconhecida"}
              </p>
              <p className="truncate text-base text-surface-400 dark:text-surface-500">
                {item.leitor?.nome || "Leitor"} · Exemplar - {item.exemplar?.numeroInventario || "N/A"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-medium text-surface-600 dark:text-surface-300">
                Feito em {formatarData(item.emprestimo.dataInicio)}
              </p>
              <p className="text-base text-surface-400 dark:text-surface-500">
                Até {formatarData(item.emprestimo.dataDevolucaoPrevista)}
              </p>
            </div>
          </button>
        ))}
        {data.length === 0 && (
          <div className="px-5 py-8 text-center text-surface-500 dark:text-surface-400">
            Nenhum empréstimo ativo no momento.
          </div>
        )}
      </div>
    </div>
  );
}