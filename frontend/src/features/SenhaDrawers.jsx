// Gavetas de senha da área logada: trocar a própria senha e definir uma nova senha para um colega.
import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import { TextField } from "../components/ui/Field.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { fieldErrorsFromApi, validateAlterarSenha, validateNovaSenha } from "../lib/validators.js";
import { redefinirSenhaColega } from "../services/bibliotecarioService.js";

function SenhaDrawer({ title, description, inicial, validar, enviar, sucesso, onClose, children }) {
  const toast = useToast();
  const form = useForm(inicial, validar);
  const requestClose = useGuardedClose(onClose, form.dirty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const submit = async () => {
    setFormError("");
    if (!form.validate()) return setFormError("Confira os campos destacados em vermelho.");
    setSaving(true);
    try {
      await enviar(form.values);
      toast.success(sucesso);
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
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={requestClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            Salvar nova senha
          </Button>
        </>
      }
    >
      {children(form.field)}
    </Drawer>
  );
}

export function AlterarSenhaDrawer({ onClose }) {
  const { alterarSenha } = useAuth();
  return (
    <SenhaDrawer
      title="Alterar minha senha"
      description="Depois de salvar, quem estiver conectado com a sua conta em outro computador precisa entrar de novo."
      inicial={{ senhaAtual: "", novaSenha: "", confirmacao: "" }}
      validar={validateAlterarSenha}
      enviar={(v) => alterarSenha(v.senhaAtual, v.novaSenha)}
      sucesso="Senha alterada."
      onClose={onClose}
    >
      {(field) => (
        <>
          <TextField label="Senha atual" type="password" {...field("senhaAtual")} autoComplete="current-password" required />
          <TextField label="Nova senha" type="password" {...field("novaSenha")} autoComplete="new-password" hint="Mínimo de 6 caracteres." required />
          <TextField label="Repita a nova senha" type="password" {...field("confirmacao")} autoComplete="new-password" required />
        </>
      )}
    </SenhaDrawer>
  );
}

export function SenhaColegaDrawer({ bibliotecario, onClose }) {
  const nome = bibliotecario.usuario.nome;
  return (
    <SenhaDrawer
      title={`Nova senha para ${nome}`}
      description="Use quando a pessoa esqueceu a senha. Passe a nova senha para ela pessoalmente; ela pode trocá-la depois em Configurações."
      inicial={{ novaSenha: "", confirmacao: "" }}
      validar={validateNovaSenha}
      enviar={(v) => redefinirSenhaColega(bibliotecario.id, v.novaSenha)}
      sucesso={`Senha de ${nome} redefinida.`}
      onClose={onClose}
    >
      {(field) => (
        <>
          <TextField label="Nova senha" type="password" {...field("novaSenha")} autoComplete="new-password" hint="Mínimo de 6 caracteres." required />
          <TextField label="Repita a nova senha" type="password" {...field("confirmacao")} autoComplete="new-password" required />
        </>
      )}
    </SenhaDrawer>
  );
}
