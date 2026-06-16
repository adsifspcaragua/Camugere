import { useState } from "react";
import { Monitor, Bell, Shield, Database, Sun, Moon, Check, Download, Upload } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ConfiguracoesPage() {
  const { dark, toggle } = useTheme();
  const [prazoEmprestimo, setPrazoEmprestimo] = useState(14);
  const [alertaAtraso, setAlertaAtraso] = useState(true);
  const [alertaVencimento, setAlertaVencimento] = useState(true);
  const [diasAviso, setDiasAviso] = useState(2);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Configurações</h2>
        <p className="mt-1 text-base text-surface-400 dark:text-surface-500">Preferências e ajustes do sistema</p>
      </div>

      <div className="space-y-4">
        {/* Aparência */}
        <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <div className="flex items-center gap-4 border-b border-surface-100 p-5 dark:border-surface-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Monitor size={20} />
            </div>
            <div>
              <p className="text-base font-semibold text-surface-900 dark:text-white">Aparência</p>
              <p className="text-sm text-surface-400 dark:text-surface-500">Personalize a interface</p>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-surface-800 dark:text-surface-200">Modo Escuro</p>
                <p className="text-sm text-surface-400 dark:text-surface-500">Alterna entre tema claro e escuro</p>
              </div>
              <button
                onClick={toggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${dark ? "bg-brand-600" : "bg-surface-200 dark:bg-surface-700"}`}
                aria-label="Toggle dark mode"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${dark ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Empréstimos */}
        <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <div className="flex items-center gap-4 border-b border-surface-100 p-5 dark:border-surface-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-base font-semibold text-surface-900 dark:text-white">Empréstimos e Alertas</p>
              <p className="text-sm text-surface-400 dark:text-surface-500">Configure prazos e notificações</p>
            </div>
          </div>
          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-surface-800 dark:text-surface-200">Prazo padrão de empréstimo</p>
                <p className="text-sm text-surface-400 dark:text-surface-500">Dias até a devolução prevista</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPrazoEmprestimo((v) => Math.max(1, v - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-base font-semibold text-surface-600 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800"
                >
                  −
                </button>
                <span className="w-12 text-center text-lg font-bold text-surface-900 dark:text-white">{prazoEmprestimo}</span>
                <button
                  onClick={() => setPrazoEmprestimo((v) => Math.min(60, v + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-base font-semibold text-surface-600 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:text-surface-400 dark:hover:bg-surface-800"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-surface-800 dark:text-surface-200">Alerta de atraso</p>
                <p className="text-sm text-surface-400 dark:text-surface-500">Destacar empréstimos vencidos</p>
              </div>
              <button
                onClick={() => setAlertaAtraso((v) => !v)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${alertaAtraso ? "bg-brand-600" : "bg-surface-200 dark:bg-surface-700"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${alertaAtraso ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-medium text-surface-800 dark:text-surface-200">Aviso de vencimento próximo</p>
                <p className="text-sm text-surface-400 dark:text-surface-500">Avisar {diasAviso} dia(s) antes do vencimento</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAlertaVencimento((v) => !v)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${alertaVencimento ? "bg-brand-600" : "bg-surface-200 dark:bg-surface-700"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${alertaVencimento ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>

            {alertaVencimento && (
              <div className="flex items-center justify-between pl-4 border-l-2 border-brand-200 dark:border-brand-700">
                <p className="text-base text-surface-600 dark:text-surface-400">Dias de antecedência</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setDiasAviso((v) => Math.max(1, v - 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-base font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:hover:bg-surface-800">−</button>
                  <span className="w-6 text-center text-base font-bold text-surface-900 dark:text-white">{diasAviso}</span>
                  <button onClick={() => setDiasAviso((v) => Math.min(7, v + 1))} className="flex h-9 w-9 items-center justify-center rounded-xl border border-surface-200 text-base font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:hover:bg-surface-800">+</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dados */}
        <div className="rounded-2xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
          <div className="flex items-center gap-4 border-b border-surface-100 p-5 dark:border-surface-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Database size={20} />
            </div>
            <div>
              <p className="text-base font-semibold text-surface-900 dark:text-white">Dados do Sistema</p>
              <p className="text-sm text-surface-400 dark:text-surface-500">Exportar e importar informações</p>
            </div>
          </div>
          <div className="flex gap-3 p-5">
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 py-3 text-base font-medium text-surface-700 transition-all hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
              <Download size={18} />
              Exportar CSV
            </button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 py-3 text-base font-medium text-surface-700 transition-all hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-300 dark:hover:bg-surface-700">
              <Upload size={18} />
              Importar
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 ${
            saved ? "bg-emerald-600 shadow-emerald-600/25" : "bg-brand-600 shadow-brand-600/25 hover:bg-brand-700"
          }`}
        >
          {saved ? <><Check size={20} /> Configurações Salvas!</> : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
