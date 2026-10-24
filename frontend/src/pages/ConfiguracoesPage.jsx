import { useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import { loadSettings, saveSettings } from "../services/settings.js";
import EquipePanel from "../features/EquipePanel.jsx";
import LembretesPanel from "../features/LembretesPanel.jsx";

function Row({ title, description, children }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, label }) {
  const clamp = (n) => Math.min(90, Math.max(1, n));
  return (
    <div className="flex items-center rounded-full border border-line-strong bg-panel" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} className="size-8 rounded-full text-ink-soft hover:bg-sunken" aria-label={`Diminuir ${label}`}>
        −
      </button>
      <span className="tabular w-14 text-center text-sm font-medium text-ink">{value} dias</span>
      <button type="button" onClick={() => onChange(clamp(value + 1))} className="size-8 rounded-full text-ink-soft hover:bg-sunken" aria-label={`Aumentar ${label}`}>
        +
      </button>
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-forest" : "bg-line-strong"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-panel shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

const TEMAS = [
  { value: "system", label: "Automático", icon: Monitor, hint: "Segue o sistema" },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
];

function AparenciaPanel() {
  const { preference, setPreference } = useTheme();
  return (
    <Panel>
      <PanelHeader title="Aparência" description="Vale para este navegador." />
      <div className="grid grid-cols-3 gap-2 p-4" role="radiogroup" aria-label="Tema">
        {TEMAS.map(({ value, label, icon: Icon, hint }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-sm transition-colors ${
                active ? "border-forest bg-forest-soft font-medium text-ink" : "border-line text-ink-soft hover:bg-sunken"
              }`}
            >
              <Icon size={18} className={active ? "text-forest" : "text-ink-muted"} />
              {label}
              {hint && <span className="text-[11px] font-normal text-ink-muted">{hint}</span>}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState(loadSettings);

  // Salva a cada mudança: sem botão "Salvar" para esquecer de apertar.
  const update = (patch) =>
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });

  return (
    <>
      <PageHeader title="Configurações" description="As mudanças são salvas automaticamente." />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <Panel>
            <PanelHeader title="Atendimento no balcão" description="Valores sugeridos nos formulários." />
            <div className="divide-y divide-line">
              <Row title="Prazo de empréstimo" description="Data de devolução sugerida.">
                <Stepper value={settings.prazoPadrao} onChange={(prazoPadrao) => update({ prazoPadrao })} label="prazo de empréstimo" />
              </Row>
              <Row title="Renovação" description="Dias somados ao clicar em Renovar.">
                <Stepper value={settings.renovacaoDias} onChange={(renovacaoDias) => update({ renovacaoDias })} label="dias de renovação" />
              </Row>
              <Row title="Comprovante por e-mail" description="Deixar marcado por padrão ao emprestar.">
                <Switch checked={settings.enviarEmailPadrao} onChange={(enviarEmailPadrao) => update({ enviarEmailPadrao })} label="Comprovante por e-mail" />
              </Row>
            </div>
          </Panel>
          <AparenciaPanel />
        </div>

        <div className="space-y-5">
          <EquipePanel />
          <LembretesPanel />
        </div>
      </div>
    </>
  );
}
