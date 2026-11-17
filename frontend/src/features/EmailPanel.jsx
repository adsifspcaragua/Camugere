// Configurações › E-mail da biblioteca: a própria equipe configura a conta que envia
// comprovantes, lembretes e links de "esqueci minha senha".
import { useCallback, useEffect, useState } from "react";
import { Mail, Pencil, Send, Trash2 } from "lucide-react";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Badge from "../components/ui/Badge.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import { Field, TextField, inputClass } from "../components/ui/Field.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { fieldErrorsFromApi, validateConfigEmail } from "../lib/validators.js";
import { enviarEmailTeste, lerConfigEmail, removerConfigEmail, salvarConfigEmail } from "../services/configuracaoService.js";

export const PROVEDORES = {
  gmail: { label: "Gmail", host: "smtp.gmail.com", porta: 587, seguro: false },
  outro: { label: "Outro provedor", host: "", porta: 587, seguro: false },
};
const provedorDe = (host) => (!host || host === PROVEDORES.gmail.host ? "gmail" : "outro");

function ConfigurarEmail({ atual, onClose, onSaved }) {
  const toast = useToast();
  const editando = Boolean(atual?.configurado);
  const form = useForm(
    {
      provedor: provedorDe(atual?.host),
      host: atual?.host ?? "",
      porta: String(atual?.porta ?? 587),
      seguro: atual?.seguro ?? false,
      usuario: atual?.usuario ?? "",
      senha: "",
      nomeRemetente: atual?.nomeRemetente ?? "Biblioteca Comunitária",
    },
    (v) => validateConfigEmail(v, { senhaDefinida: atual?.senhaDefinida && atual?.origem === "tela" }),
  );
  const { values, field, set } = form;
  const requestClose = useGuardedClose(onClose, form.dirty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const outro = values.provedor === "outro";

  const trocarProvedor = (provedor) => {
    const p = PROVEDORES[provedor];
    set({ provedor, ...(provedor === "gmail" ? { host: p.host, porta: String(p.porta), seguro: p.seguro } : { host: "" }) });
  };

  const submit = async () => {
    setFormError("");
    if (!form.validate()) return setFormError("Confira os campos destacados em vermelho.");
    setSaving(true);
    const preset = PROVEDORES[values.provedor];
    try {
      await salvarConfigEmail({
        host: outro ? values.host.trim() : preset.host,
        porta: Number(outro ? values.porta : preset.porta),
        seguro: outro ? values.seguro : preset.seguro,
        usuario: values.usuario.trim(),
        senha: values.senha,
        nomeRemetente: values.nomeRemetente.trim(),
      });
      toast.success("E-mail configurado. Use “Enviar e-mail de teste” para conferir.");
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
      title="Configurar e-mail"
      description="Conta que envia comprovantes de empréstimo, lembretes de devolução e links de “esqueci minha senha”."
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
      <Field label="Provedor">
        {(id) => (
          <select id={id} value={values.provedor} onChange={(e) => trocarProvedor(e.target.value)} className={inputClass}>
            {Object.entries(PROVEDORES).map(([valor, p]) => (
              <option key={valor} value={valor}>
                {p.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      {outro && (
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <TextField label="Servidor SMTP" {...field("host")} placeholder="smtp.seuprovedor.com.br" required />
          <TextField label="Porta" inputMode="numeric" {...field("porta", (v) => v.replace(/\D/g, "").slice(0, 5))} required />
        </div>
      )}
      {outro && (
        <label className="flex items-start gap-3 text-sm text-ink">
          <input type="checkbox" checked={values.seguro} onChange={(e) => set({ seguro: e.target.checked })} className="mt-0.5 size-5 accent-[var(--forest)]" />
          <span>
            Conexão segura direta (SSL)
            <span className="block text-xs text-ink-muted">Normalmente marcada para a porta 465 e desmarcada para a 587.</span>
          </span>
        </label>
      )}

      <TextField label="E-mail da conta" type="email" {...field("usuario")} placeholder="biblioteca@gmail.com" autoComplete="off" required />
      <TextField
        label={values.provedor === "gmail" ? "Senha de app" : "Senha"}
        type="password"
        {...field("senha")}
        autoComplete="new-password"
        placeholder={editando && atual?.origem === "tela" ? "Deixe em branco para manter a atual" : ""}
        hint={values.provedor === "gmail" ? "Não é a senha normal do Gmail. Veja abaixo como gerar." : "A senha fica guardada de forma cifrada neste computador."}
      />
      <TextField label="Nome do remetente" {...field("nomeRemetente")} hint="Como o leitor vê quem enviou." optional />

      {values.provedor === "gmail" && (
        <div className="rounded-md border border-line bg-sunken p-4 text-sm leading-relaxed text-ink-soft">
          <p className="font-semibold text-ink">Como gerar a senha de app do Gmail</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Entre na conta Google da biblioteca e ative a verificação em duas etapas.</li>
            <li>
              Abra{" "}
              <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="font-semibold text-forest underline">
                myaccount.google.com/apppasswords
              </a>
              , dê o nome “Biblioteca” e clique em Criar.
            </li>
            <li>Copie as 16 letras exibidas e cole no campo “Senha de app”.</li>
          </ol>
        </div>
      )}
    </Drawer>
  );
}

export default function EmailPanel({ onChange }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [config, setConfig] = useState(null);
  const [editando, setEditando] = useState(false);
  const [testando, setTestando] = useState(false);

  const carregar = useCallback(
    () =>
      lerConfigEmail()
        .then(setConfig)
        .catch(() => setConfig(null)),
    [],
  );
  useEffect(() => {
    carregar();
  }, [carregar]);

  const aposMudar = () => {
    carregar();
    onChange?.();
  };

  const testar = async () => {
    setTestando(true);
    try {
      toast.success(await enviarEmailTeste());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setTestando(false);
    }
  };

  const remover = async () => {
    if (!(await confirm({ title: "Remover configuração de e-mail?", message: "O sistema deixará de enviar comprovantes, lembretes e links de senha.", confirmLabel: "Remover" }))) return;
    try {
      await removerConfigEmail();
      toast.success("Configuração de e-mail removida.");
      aposMudar();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="E-mail da biblioteca"
        description="Conta que envia comprovantes, lembretes e links de senha."
        actions={
          config && (
            <Button variant="secondary" size="sm" icon={config.configurado ? Pencil : Mail} onClick={() => setEditando(true)}>
              {config.configurado ? "Alterar" : "Configurar"}
            </Button>
          )
        }
      />
      <div className="space-y-4 px-6 py-5 text-sm">
        {!config ? (
          <p className="text-ink-muted">Não foi possível consultar a configuração de e-mail.</p>
        ) : config.configurado ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="forest">Configurado</Badge>
              <span className="wrap-anywhere font-semibold text-ink">{config.usuario}</span>
              <span className="text-ink-muted">via {config.host}</span>
            </div>
            {config.origem === "env" && (
              <p className="text-xs text-ink-muted">
                Definido no arquivo <code className="font-mono">.env</code> do servidor. Se salvar aqui, passa a valer a configuração desta tela.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Send} onClick={testar} loading={testando}>
                Enviar e-mail de teste
              </Button>
              {config.origem === "tela" && (
                <Button variant="ghost" size="sm" icon={Trash2} onClick={remover}>
                  Remover
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="warn">Não configurado</Badge>
            <p className="text-ink-soft">Sem esta configuração, o sistema não envia comprovantes, lembretes nem links de “esqueci minha senha”.</p>
          </div>
        )}
      </div>
      {editando && <ConfigurarEmail atual={config} onClose={() => setEditando(false)} onSaved={aposMudar} />}
    </Panel>
  );
}
