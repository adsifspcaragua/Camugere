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
    <div className="flex items-center gap-4 px-6 py-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-1 text-xs leading-snug text-ink-muted">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Stepper({ value, onChange, label }) {
  const clamp = (n) => Math.min(90, Math.max(1, n));
  return (
    <div className="flex items-center rounded-md border-[1.5px] border-field bg-panel" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(clamp(value - 1))} className="flex size-11 items-center justify-center rounded-md text-2xl font-semibold text-ink hover:bg-sunken" aria-label={`Diminuir ${label}`}>
        −
      </button>
      <span className="tabular w-20 text-center text-sm font-semibold text-ink">{value} dias</span>
      <button type="button" onClick={() => onChange(clamp(value + 1))} className="flex size-11 items-center justify-center rounded-md text-2xl font-semibold text-ink hover:bg-sunken" aria-label={`Aumentar ${label}`}>
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
      className={`relative h-8 w-14 rounded-full border-2 transition-colors ${checked ? "border-forest bg-forest" : "border-field bg-sunken"}`}
    >
      <span className={`absolute top-0.5 size-6 rounded-full shadow transition-all ${checked ? "left-[26px] bg-on-forest" : "left-0.5 bg-ink-muted"}`} />
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
      <div className="grid grid-cols-3 gap-3 p-5" role="radiogroup" aria-label="Tema">
        {TEMAS.map(({ value, label, icon: Icon, hint }) => {
          const active = preference === value;
          return (
            <button
              key={value}
              role="radio"
              aria-checked={active}
              onClick={() => setPreference(value)}
              className={`flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-4 text-sm transition-colors ${
                active ? "border-forest bg-forest-soft font-bold text-ink" : "border-field font-medium text-ink-soft hover:bg-sunken"
              }`}
            >
              <Icon size={22} className={active ? "text-forest" : "text-ink-muted"} />
              {label}
              {hint && <span className="text-xs font-medium text-ink-muted">{hint}</span>}
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
