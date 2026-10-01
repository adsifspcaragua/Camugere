import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { getExemplarById } from "../../services/exemplarService.js";
import { getObraById } from "../../services/obraService.js";
import { getLeitorById } from "../../services/leitorService.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RecentMovements({ emprestimos, onNavigate }) {
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

        // A variável 'resultados' restaurada corretamente
        const resultados = await Promise.all(
          emprestimosRecentes.map(async (emp) => {
            const exe = await getExemplarById(emp.idExemplar);
            const lei = await getLeitorById(emp.idLeitor);
            
            const idDaObra = exe?.data?.idObra || exe?.data?.id_obra || exe?.data?.id;
            let obr = null;
            
            if (idDaObra) {
              obr = await getObraById(idDaObra);
            }

            return {
              emprestimo: emp,
              exemplar: exe?.data,
              leitor: lei?.usuario,
              obra: obr?.data,
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
  }, [isLoading, token, emprestimos]);

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
                {item.leitor?.nome || "Leitor"} · Inventário - {item.exemplar?.numeroInventario || "N/A"}
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