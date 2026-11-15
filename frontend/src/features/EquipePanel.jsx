import { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { Panel, PanelHeader } from "../components/ui/Panel.jsx";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Badge from "../components/ui/Badge.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { fieldErrorsFromApi, validateBibliotecario } from "../lib/validators.js";
import { cadastrarBibliotecario, listBibliotecarios, removerBibliotecario } from "../services/bibliotecarioService.js";

function NovoBibliotecario({ onClose, onCreated }) {
  const toast = useToast();
  const { values, field, dirty, validate, applyServerErrors, setError } = useForm({ nome: "", email: "", senha: "", confirmacao: "" }, validateBibliotecario);
  const requestClose = useGuardedClose(onClose, dirty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async () => {
    setFormError("");
    if (!validate()) return setFormError("Confira os campos destacados em vermelho.");
    setSaving(true);
    try {
      await cadastrarBibliotecario({ nome: values.nome.trim(), email: values.email.trim(), senha: values.senha });
      toast.success(`${values.nome.trim()} agora tem acesso ao sistema.`);
      onCreated();
      onClose();
    } catch (error) {
      if (!applyServerErrors(fieldErrorsFromApi(error))) {
        if (error.status === 409) setError({ email: "Este e-mail já tem acesso ou cadastro no sistema." });
        setFormError(error.message);
      }
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      error={formError}
      title="Novo bibliotecário"
      description="A pessoa entra no sistema com este e-mail e senha."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Dar acesso
          </Button>
        </>
      }
    >
      <TextField label="Nome" {...field("nome")} autoComplete="off" required />
      <TextField label="E-mail" type="email" {...field("email")} autoComplete="off" required />
      <TextField label="Senha inicial" type="password" {...field("senha")} autoComplete="new-password" hint="Mínimo de 6 caracteres." required />
      <TextField label="Confirme a senha" type="password" {...field("confirmacao")} autoComplete="new-password" required />
    </Drawer>
  );
}

export default function EquipePanel() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [equipe, setEquipe] = useState([]);
  const [adding, setAdding] = useState(false);

  const carregar = useCallback(() => listBibliotecarios().then(setEquipe).catch((e) => toast.error(e.message)), [toast]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const remover = async (b) => {
    if (!(await confirm({ title: "Remover acesso?", message: `${b.usuario.nome} não conseguirá mais entrar no sistema.`, confirmLabel: "Remover acesso" }))) return;
    try {
      await removerBibliotecario(b.id);
      toast.success(`Acesso de ${b.usuario.nome} removido.`);
      carregar();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Panel>
      <PanelHeader
        title="Equipe da biblioteca"
        description="Pessoas com acesso ao sistema."
        actions={
          <Button variant="secondary" size="sm" icon={UserPlus} onClick={() => setAdding(true)}>
            Adicionar
          </Button>
        }
      />
      <ul className="divide-y divide-line">
        {equipe.map((b) => {
          const voce = b.usuario.id === user?.id;
          return (
            <li key={b.id} className="flex min-h-16 items-center gap-3 px-6 py-3">
              <Avatar name={b.usuario.nome} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold text-ink">{b.usuario.nome}</p>
                <p className="wrap-anywhere text-xs text-ink-muted">{b.usuario.email}</p>
              </div>
              {voce ? (
                <Badge tone="forest" dot={false}>Você</Badge>
              ) : (
                <Button variant="ghost" size="icon" icon={Trash2} onClick={() => remover(b)} aria-label={`Remover acesso de ${b.usuario.nome}`} />
              )}
            </li>
          );
        })}
      </ul>
      {adding && <NovoBibliotecario onClose={() => setAdding(false)} onCreated={carregar} />}
    </Panel>
  );
}
