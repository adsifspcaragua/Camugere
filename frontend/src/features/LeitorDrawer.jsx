import { useState } from "react";
import { MapPin } from "lucide-react";
import Drawer from "../components/ui/Drawer.jsx";
import Button from "../components/ui/Button.jsx";
import { Field, TextField, inputClass } from "../components/ui/Field.jsx";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { formatCep, formatCpf, formatPhone, onlyDigits } from "../lib/format.js";
import { buscarCep } from "../services/cepService.js";

const ENDERECO = ["logradouro", "numero", "complemento", "bairro", "cidade", "uf"];
const blankToNull = (v) => (String(v ?? "").trim() === "" ? null : String(v).trim());

function initialValues(leitor) {
  return {
    nome: leitor?.nome ?? "",
    email: leitor?.email ?? "",
    cpf: formatCpf(leitor?.cpf ?? ""),
    telefone: formatPhone(leitor?.telefone ?? ""),
    cep: formatCep(leitor?.cep ?? ""),
    ...Object.fromEntries(ENDERECO.map((c) => [c, leitor?.[c] ?? ""])),
  };
}

function LeitorForm({ leitor, onClose }) {
  const { saveLeitor } = useLibrary();
  const toast = useToast();
  const editing = Boolean(leitor);
  const { values, set, field, dirty } = useForm(initialValues(leitor));
  const requestClose = useGuardedClose(onClose, dirty);
  const [saving, setSaving] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const valid = values.nome.trim().length >= 2 && values.email.includes("@") && onlyDigits(values.cpf).length === 11;

  const preencherPorCep = async () => {
    const cep = onlyDigits(values.cep);
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      set(await buscarCep(cep));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBuscandoCep(false);
    }
  };

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await saveLeitor(
        {
          nome: values.nome.trim(),
          email: values.email.trim(),
          cpf: onlyDigits(values.cpf),
          telefone: onlyDigits(values.telefone) || null,
          cep: onlyDigits(values.cep) || null,
          ...Object.fromEntries(ENDERECO.map((c) => [c, blankToNull(values[c])])),
        },
        leitor?.id,
      );
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      title={editing ? "Editar leitor" : "Novo leitor"}
      description="O e-mail é usado para enviar comprovantes e lembretes de devolução."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid} loading={saving}>
            {editing ? "Salvar alterações" : "Cadastrar leitor"}
          </Button>
        </>
      }
    >
      <TextField label="Nome completo" {...field("nome")} autoComplete="off" required />
      <TextField label="E-mail" type="email" {...field("email")} autoComplete="off" required />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="CPF" {...field("cpf", formatCpf)} inputMode="numeric" placeholder="000.000.000-00" required />
        <TextField label="Telefone" {...field("telefone", formatPhone)} inputMode="tel" placeholder="(21) 99999-0000" optional />
      </div>

      <fieldset className="space-y-4 border-t border-line pt-5">
        <legend className="flex items-center gap-2 pr-2 text-xs font-semibold tracking-wider text-ink-muted uppercase">
          <MapPin size={13} /> Endereço
        </legend>
        <Field label="CEP" hint={buscandoCep ? "Buscando endereço…" : "Preenche rua, bairro e cidade automaticamente."} optional>
          {(id) => (
            <input id={id} {...field("cep", formatCep)} onBlur={preencherPorCep} inputMode="numeric" placeholder="00000-000" className={`${inputClass} w-40 font-mono`} />
          )}
        </Field>
        <div className="grid grid-cols-[1fr_96px] gap-4">
          <TextField label="Logradouro" {...field("logradouro")} optional />
          <TextField label="Número" {...field("numero")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Complemento" {...field("complemento")} optional />
          <TextField label="Bairro" {...field("bairro")} />
        </div>
        <div className="grid grid-cols-[1fr_72px] gap-4">
          <TextField label="Cidade" {...field("cidade")} />
          <TextField label="UF" {...field("uf", (v) => v.toUpperCase().slice(0, 2))} />
        </div>
      </fieldset>
    </Drawer>
  );
}

export default function LeitorDrawer({ open, leitor, onClose }) {
  return open ? <LeitorForm leitor={leitor} onClose={onClose} /> : null;
}
