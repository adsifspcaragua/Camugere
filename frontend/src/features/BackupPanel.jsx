// Configurações › Backup: agenda semanal automática, cópia extra (pen drive ou nuvem) e "fazer backup agora".
// O atalho backup-camugere.bat continua funcionando e usa esta mesma configuração.
import { useCallback, useEffect, useState } from "react";
import { CircleAlert, DatabaseBackup, Pencil } from "lucide-react";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import Switch from "../components/ui/Switch.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { fieldErrorsFromApi, validateConfigBackup } from "../lib/validators.js";
import { fazerBackupAgora, lerConfigBackup, salvarConfigBackup } from "../services/configuracaoService.js";

export const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_EXTENSO = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

const dataHora = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const quando = (d) => dataHora.format(new Date(d)).replace(".", "");

/** "segunda e sexta às 17:00", "toda a semana às 17:00" */
export function descreverAgenda(dias, horario) {
  if (dias.length === 7) return `todos os dias às ${horario}`;
  const nomes = dias.map((d) => DIAS_EXTENSO[d]);
  const lista = nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}` : nomes[0];
  return `${lista} às ${horario}`;
}

const tamanho = (bytes) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.ceil(bytes / 1024))} KB`);
// camugere-2026-11-14_17h00 -> 14/11/2026 17:00
const dataDoNome = (nome) => nome.replace(/^camugere-(\d{4})-(\d{2})-(\d{2})_(\d{2})h(\d{2})(-\d+)?$/, "$3/$2/$1 $4:$5");

function ConfigurarBackup({ atual, onClose, onSaved }) {
  const toast = useToast();
  const form = useForm(
    {
      automatico: atual.automatico,
      dias: atual.dias,
      horario: atual.horario,
      pastaCopia: atual.origemPasta === "tela" ? (atual.pastaCopia ?? "") : "",
      manter: String(atual.manter),
    },
    validateConfigBackup,
  );
  const { values, field, set, errors } = form;
  const requestClose = useGuardedClose(onClose, form.dirty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const alternarDia = (d) => set({ dias: values.dias.includes(d) ? values.dias.filter((x) => x !== d) : [...values.dias, d].sort() });

  const submit = async () => {
    setFormError("");
    if (!form.validate()) return setFormError("Confira os campos destacados em vermelho.");
    setSaving(true);
    try {
      await salvarConfigBackup({ ...values, pastaCopia: values.pastaCopia.trim(), manter: Number(values.manter) });
      toast.success(values.automatico ? `Backup automático: ${descreverAgenda(values.dias, values.horario)}.` : "Configuração de backup salva.");
      onSaved();
      onClose();
    } catch (error) {
      if (!form.applyServerErrors(fieldErrorsFromApi(error))) setFormError(error.message);
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      error={formError}
      title="Configurar backup"
      description="Cópia de segurança do banco de dados e das capas das obras."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Backup automático</p>
          <p className="mt-1 text-xs text-ink-muted">Feito pelo próprio sistema nos dias e no horário abaixo.</p>
        </div>
        <Switch checked={values.automatico} onChange={(automatico) => set({ automatico })} label="Backup automático" />
      </div>

      <fieldset disabled={!values.automatico} className="space-y-5 disabled:opacity-60">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Dias da semana</p>
          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Dias da semana">
            {DIAS.map((nome, d) => {
              const ativo = values.dias.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={ativo}
                  aria-label={DIAS_EXTENSO[d]}
                  onClick={() => alternarDia(d)}
                  className={`h-11 rounded-md border-2 text-sm transition-colors ${ativo ? "border-forest bg-forest-soft font-bold text-ink" : "border-field font-medium text-ink-soft hover:bg-sunken"}`}
                >
                  {nome}
                </button>
              );
            })}
          </div>
          {errors.dias && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-danger">
              <CircleAlert size={14} className="mt-px shrink-0" aria-hidden />
              {errors.dias}
            </p>
          )}
        </div>
        <TextField label="Horário" type="time" {...field("horario")} className="max-w-40" required />
        <p className="rounded-md border border-line bg-sunken p-4 text-xs leading-relaxed text-ink-soft">
          O sistema precisa estar aberto para fazer o backup. Se estiver fechado no horário, o backup é feito assim que ele for aberto.
        </p>
      </fieldset>

      <TextField
        label="Copiar também para"
        {...field("pastaCopia")}
        placeholder={atual.origemPasta === "env" ? atual.pastaCopia : "E:\\Backup Camugere"}
        hint="Pasta de um pen drive ou do Google Drive para computador. Guarda uma cópia fora deste computador. Se o pen drive não estiver conectado, o backup é feito mesmo assim."
        optional
      />
      <TextField
        label="Quantos backups guardar"
        inputMode="numeric"
        {...field("manter", (v) => v.replace(/\D/g, "").slice(0, 3))}
        hint="Os mais antigos são apagados, aqui e na pasta da cópia."
        className="max-w-56"
        required
      />
    </Drawer>
  );
}

export default function BackupPanel() {
  const toast = useToast();
  const [config, setConfig] = useState(null);
  const [erro, setErro] = useState(false);
  const [editando, setEditando] = useState(false);
  const [fazendo, setFazendo] = useState(false);

  const carregar = useCallback(
    () =>
      lerConfigBackup()
        .then((c) => {
          setConfig(c);
          setErro(false);
        })
        .catch(() => setErro(true)),
    [],
  );
  useEffect(() => {
    carregar();
  }, [carregar]);

  const fazerAgora = async () => {
    setFazendo(true);
    try {
      const r = await fazerBackupAgora();
      setConfig(r.data);
      if (/sem a cópia extra/.test(r.message)) toast.error(r.message);
      else toast.success(r.message);
    } catch (error) {
      toast.error(error.message);
      carregar();
    } finally {
      setFazendo(false);
    }
  };

  const ultimo = config?.ultimo;
  const semCopia = Boolean(ultimo?.ok && ultimo.mensagem && /^Não deu/.test(ultimo.mensagem));
  return (
    <Panel>
      <PanelHeader
        title="Backup"
        description="Cópia de segurança do banco de dados e das capas."
        actions={
          config && (
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditando(true)}>
              Configurar
            </Button>
          )
        }
      />
      <div className="space-y-4 px-6 py-5 text-sm">
        {erro || !config ? (
          <p className="text-ink-muted">{erro ? "Não foi possível consultar a configuração de backup." : "Carregando…"}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {config.automatico ? <Badge tone="forest">Automático</Badge> : <Badge tone="neutral">Automático desligado</Badge>}
              <span className="text-ink-soft">
                {config.automatico
                  ? `${descreverAgenda(config.dias, config.horario)}${config.proximo ? `. Próximo: ${quando(config.proximo)}` : ""}.`
                  : "Ligue em Configurar, ou use “Fazer backup agora” ou o atalho backup-camugere.bat."}
              </span>
            </div>

            <div className="rounded-md border border-line px-4 py-3">
              {!ultimo ? (
                <p className="flex flex-wrap items-center gap-3">
                  <Badge tone="warn">Nenhum backup ainda</Badge>
                  <span className="text-ink-soft">Faça o primeiro agora.</span>
                </p>
              ) : (
                <>
                  <p className="flex flex-wrap items-center gap-3">
                    {!ultimo.ok ? (
                      <Badge tone="danger">Último backup falhou</Badge>
                    ) : semCopia ? (
                      <Badge tone="warn">Feito, sem a cópia extra</Badge>
                    ) : (
                      <Badge tone="ok">Último backup ok</Badge>
                    )}
                    <span className="text-ink-soft">{quando(ultimo.em)}</span>
                  </p>
                  {ultimo.mensagem && (
                    <p className={`mt-2 wrap-anywhere text-xs ${!ultimo.ok ? "font-semibold text-danger" : semCopia ? "font-semibold text-warn" : "text-ink-muted"}`}>{ultimo.mensagem}</p>
                  )}
                  {!ultimo.ok && ultimo.sucessoEm && <p className="mt-1 text-xs text-ink-muted">Último backup bem-sucedido: {quando(ultimo.sucessoEm)}.</p>}
                </>
              )}
            </div>

            {config.pastaCopia ? (
              <p className="wrap-anywhere text-ink-soft">
                Cópia extra em <span className="font-semibold text-ink">{config.pastaCopia}</span>
                {config.origemPasta === "env" && " (definida no .env)"}
                {config.pastaCopiaAcessivel === false && <span className="font-semibold text-warn"> · pasta não encontrada agora; o pen drive está conectado?</span>}
              </p>
            ) : (
              <p className="text-warn">Sem cópia extra: se este computador quebrar, os backups se perdem junto. Configure uma pasta do pen drive ou do Google Drive.</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="sm" icon={DatabaseBackup} onClick={fazerAgora} loading={fazendo || config.emAndamento}>
                Fazer backup agora
              </Button>
              <span className="text-xs text-ink-muted">
                {config.totalGuardados} guardado(s) neste computador, até {config.manter}.
              </span>
            </div>

            {config.guardados.length > 0 && (
              <details className="text-xs text-ink-muted">
                <summary className="cursor-pointer font-semibold text-ink-soft">Backups guardados</summary>
                <p className="mt-2 wrap-anywhere">
                  Pasta: <code className="font-mono">{config.pastaBackups}</code>
                </p>
                <ul className="mt-2 space-y-1">
                  {config.guardados.map((b) => (
                    <li key={b.nome} className="flex justify-between gap-4 tabular">
                      <span>{dataDoNome(b.nome)}</span>
                      <span>{tamanho(b.bytes)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        )}
      </div>
      {editando && <ConfigurarBackup atual={config} onClose={() => setEditando(false)} onSaved={carregar} />}
    </Panel>
  );
}
