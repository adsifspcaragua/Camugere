import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ImagePlus, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import Drawer from "../components/ui/Drawer.jsx";
import Button from "../components/ui/Button.jsx";
import Cover from "../components/ui/Cover.jsx";
import { Field, TextArea, TextField, inputClass, inputProps } from "../components/ui/Field.jsx";
import CddField from "./CddField.jsx";
import { statusCdd, sugerirCdd, sugerirCddParaLivro } from "../lib/cdd.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useForm } from "../hooks/useForm.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { buscarPorIsbn, buscarPorTitulo, pareceIsbn } from "../services/catalogoService.js";
import { MAX_CAPA_BYTES, uploadCapa, uploadCapaUrl } from "../services/capaService.js";
import { fieldErrorsFromApi, isValidIsbn, validateImagem, validateObra } from "../lib/validators.js";

const EMPTY = {
  isbn: "",
  titulo: "",
  subtitulo: "",
  autor: "",
  editora: "",
  localPublicacao: "",
  anoPublicacao: "",
  numeroPaginas: "",
  cdd: "",
  cddDescricao: "",
  resumo: "",
  capaUrl: "",
};

const fromObra = (obra) =>
  Object.fromEntries(Object.keys(EMPTY).map((key) => [key, obra[key] == null || obra[key] === 0 ? "" : String(obra[key])]));

const blankToNull = (value) => (String(value).trim() === "" ? null : String(value).trim());

function toPayload(values) {
  const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, blankToNull(v)]));
  payload.numeroPaginas = Number(values.numeroPaginas) || 0;
  payload.anoPublicacao = values.anoPublicacao ? Number(values.anoPublicacao) : null;
  return payload;
}

/**
 * Busca única: digite ou bipe o ISBN (busca na hora) ou escreva o título e escolha na lista.
 * Ao escolher, todos os campos — inclusive capa e sugestão de CDD — são preenchidos.
 */
function BuscaCatalogo({ onFill }) {
  const toast = useToast();
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [semResultado, setSemResultado] = useState(false);
  const ultimo = useRef("");

  useEffect(() => {
    const texto = termo.trim();
    if (texto.length < 3) return;
    setSemResultado(false);
    const isbn = pareceIsbn(texto);
    const timer = setTimeout(
      async () => {
        ultimo.current = texto;
        setBuscando(true);
        try {
          if (isbn) {
            const livro = await buscarPorIsbn(texto);
            if (ultimo.current !== texto) return;
            onFill(livro);
            setResultados([]);
            setTermo("");
          } else {
            const lista = await buscarPorTitulo(texto);
            if (ultimo.current === texto) {
              setResultados(lista);
              setSemResultado(lista.length === 0);
            }
          }
        } catch (error) {
          if (ultimo.current === texto) toast.error(error.message);
        } finally {
          if (ultimo.current === texto) setBuscando(false);
        }
      },
      isbn ? 150 : 450,
    );
    return () => clearTimeout(timer);
  }, [termo, onFill, toast]);

  return (
    <div className="rounded-lg border-[1.5px] border-forest/30 bg-forest-soft p-5">
      <label htmlFor="busca-catalogo" className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <Sparkles size={18} className="text-forest" /> Preencher automaticamente
      </label>
      <div className="relative">
        <input
          id="busca-catalogo"
          value={termo}
          onChange={(e) => {
            const val = e.target.value;
            setTermo(val);
            if (val.trim().length < 3) {
              setResultados([]);
              setSemResultado(false);
            }
          }}
          placeholder="Bipe ou digite o ISBN, ou escreva o título"
          autoComplete="off"
          className={`${inputClass} bg-panel ${buscando ? "pr-28" : ""}`}
        />
        {buscando && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-muted">Buscando…</span>}
      </div>
      <p className="mt-2 text-xs text-ink-muted">Capa, autoria, editora, ano, páginas, sinopse e uma sugestão de CDD (entre os já cadastrados) vêm prontos. Depois é só revisar.</p>

      {semResultado && !buscando && (
        <p role="status" className="mt-3 text-sm font-semibold text-warn">
          Nenhuma obra encontrada para “{termo.trim()}”. Tente outro trecho do título, busque pelo ISBN ou preencha os campos abaixo manualmente.
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto rounded-lg border-[1.5px] border-line bg-panel scrollbar-thin">
          {resultados.map((livro, i) => (
            <li key={`${livro.isbn}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  onFill(livro);
                  setResultados([]);
                  setTermo("");
                }}
                className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sunken"
              >
                <Cover src={livro.capaUrl} title={livro.titulo} />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-semibold text-ink">{livro.titulo}</span>
                  <span className="block break-words text-xs text-ink-muted">
                    {[livro.autor, livro.editora, livro.anoPublicacao].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CoverPicker({ value, title, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problema = validateImagem(file, MAX_CAPA_BYTES);
    if (problema) return toast.error(problema);
    setUploading(true);
    try {
      onChange(await uploadCapa(file));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Cover src={value} title={title || "?"} size="lg" />
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onFile} />
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" icon={ImagePlus} loading={uploading} onClick={() => inputRef.current?.click()}>
          {value ? "Trocar" : "Enviar capa"}
        </Button>
        {value && <Button variant="ghost" size="icon" icon={Trash2} onClick={() => onChange("")} aria-label="Remover capa" />}
      </div>
    </div>
  );
}

function ObraForm({ obra, onClose }) {
  const { saveObra, cdds } = useLibrary();
  const toast = useToast();
  const editing = Boolean(obra);
  const validator = (v) => {
    const cdd = statusCdd(cdds, v.cdd, v.cddDescricao);
    return validateObra(v, { cddIncompleto: cdd.tipo === "incompleto" ? cdd.mensagem : undefined });
  };
  const { values, set, field, dirty, errors, setError, validate, applyServerErrors } = useForm(editing ? fromObra(obra) : EMPTY, validator);
  const requestClose = useGuardedClose(onClose, dirty);
  const [quantidade, setQuantidade] = useState(1);
  const [saving, setSaving] = useState(false);
  const [detalhes, setDetalhes] = useState(true);
  const [buscandoIsbnCampo, setBuscandoIsbnCampo] = useState(false);
  const [baixandoCapaUrl, setBaixandoCapaUrl] = useState(false);
  const [formError, setFormError] = useState("");

  // Sugestão manual: só entre os CDDs cadastrados, a partir do título e da sinopse.
  const sugestaoCdd = useMemo(() => sugerirCdd(`${values.titulo} ${values.resumo}`, cdds), [values.titulo, values.resumo, cdds]);

  // `preencher` precisa ser estável (a busca depende dela), então lê o CDD atual por ref.
  const cddAtual = useRef({ cdds, cdd: values.cdd });
  useEffect(() => {
    cddAtual.current = { cdds, cdd: values.cdd };
  });

  const internalizarUrlSeRemota = useCallback(
    async (urlStr) => {
      const limpa = String(urlStr ?? "").trim();
      if (!limpa || limpa.includes("/uploads/capas/")) return;
      if (!/^https?:\/\//i.test(limpa) && !limpa.startsWith("data:image/")) return;
      setBaixandoCapaUrl(true);
      try {
        const localUrl = await uploadCapaUrl(limpa);
        set({ capaUrl: localUrl });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setBaixandoCapaUrl(false);
      }
    },
    [set, toast],
  );

  const preencher = useCallback(
    (livro) => {
      const { cdds: cadastrados, cdd: cddAtualValor } = cddAtual.current;
      const sugerido = cddAtualValor.trim() ? null : sugerirCddParaLivro(livro, cadastrados);
      set({
        ...Object.fromEntries(Object.entries(livro).filter(([k, v]) => k in EMPTY && v)),
        ...(sugerido && { cdd: sugerido.id, cddDescricao: sugerido.descricao }),
      });
      setDetalhes(true);
      toast.info(`Dados preenchidos (${livro.fonte}).${sugerido ? ` CDD ${sugerido.id} sugerido.` : ""} Confira antes de salvar.`);
      if (livro.capaUrl) internalizarUrlSeRemota(livro.capaUrl);
    },
    [set, toast, internalizarUrlSeRemota],
  );

  const buscarPeloCampoIsbn = async () => {
    const raw = values.isbn?.trim();
    if (!raw) return;
    if (!isValidIsbn(raw)) return setError({ isbn: "ISBN inválido. Use 10 ou 13 números (confira os dígitos no verso do livro)." });
    setBuscandoIsbnCampo(true);
    try {
      const livro = await buscarPorIsbn(raw);
      preencher(livro);
    } catch (error) {
      setError({ isbn: error.message });
    } finally {
      setBuscandoIsbnCampo(false);
    }
  };

  const submit = async () => {
    setFormError("");
    if (!validate()) {
      // Campos escondidos na seção recolhida precisam aparecer para a pessoa ver o erro.
      setDetalhes(true);
      return setFormError("Confira os campos destacados em vermelho.");
    }
    setSaving(true);
    try {
      const payload = toPayload(values);
      await saveObra(editing ? payload : { ...payload, numExemplares: quantidade }, obra?.id);
      onClose();
    } catch (error) {
      const porCampo = fieldErrorsFromApi(error);
      if (!Object.keys(porCampo).length && error.status === 409 && /isbn/i.test(error.message)) porCampo.isbn = error.message;
      if (!applyServerErrors(porCampo)) setFormError(error.message);
      else setDetalhes(true);
      setSaving(false);
    }
  };

  return (
    <Drawer
      open
      onClose={requestClose}
      onSubmit={submit}
      error={formError}
      title={editing ? "Editar obra" : "Nova obra"}
      description={editing ? obra.titulo : "Comece pela busca. O resto se preenche sozinho."}
      footer={
        <>
          {!editing && (
            <div className="mr-auto flex items-center gap-2 text-sm text-ink-soft">
              <Button variant="secondary" size="icon" icon={Minus} onClick={() => setQuantidade((q) => Math.max(1, q - 1))} aria-label="Menos um exemplar" />
              <span className="tabular w-8 text-center font-bold text-ink">{quantidade}</span>
              <Button variant="secondary" size="icon" icon={Plus} onClick={() => setQuantidade((q) => Math.min(50, q + 1))} aria-label="Mais um exemplar" />
              <span>{quantidade === 1 ? "exemplar" : "exemplares"}</span>
            </div>
          )}
          <Button type="submit" loading={saving}>
            {editing ? "Salvar" : "Adicionar ao acervo"}
          </Button>
        </>
      }
    >
      {!editing && <BuscaCatalogo onFill={preencher} />}

      <div className="grid gap-5 sm:grid-cols-[96px_1fr]">
        <CoverPicker value={values.capaUrl} title={values.titulo} onChange={(capaUrl) => set({ capaUrl })} />
        <div className="min-w-0 space-y-4">
          <TextField label="Título" {...field("titulo")} maxLength={200} required />
          <TextField label="Autoria" {...field("autor")} hint="Vários autores: separe por vírgula." placeholder="Carolina Maria de Jesus" required />
          <TextField
            label="URL da capa"
            {...field("capaUrl")}
            onBlur={(e) => internalizarUrlSeRemota(e.target.value)}
            hint={baixandoCapaUrl ? "Baixando imagem para o servidor…" : "Cole um link da internet ou envie arquivo ao lado."}
            placeholder="https://..."
            optional
          />
        </div>
      </div>

      <CddField cdds={cdds} codigo={values.cdd} descricao={values.cddDescricao} onChange={set} sugestao={sugestaoCdd} />

      <button type="button" onClick={() => setDetalhes((d) => !d)} aria-expanded={detalhes} className="flex min-h-12 w-full items-center justify-between border-t border-line pt-4 text-sm font-semibold text-ink-soft hover:text-ink">
        <span className="flex items-center gap-2">
          <BookOpen size={15} /> Dados da publicação
        </span>
        <ChevronDown size={20} className={`transition-transform ${detalhes ? "rotate-180" : ""}`} />
      </button>

      {detalhes && (
        <div className="space-y-4">
          <Field label="ISBN" error={errors.isbn} optional>
            {(id) => (
              <div className="flex gap-2">
                <input id={id} autoComplete="off" {...inputProps(field("isbn"))} aria-invalid={Boolean(errors.isbn)} aria-describedby={errors.isbn ? `${id}-error` : undefined} inputMode="numeric" placeholder="9788535914849" className={`${inputClass} flex-1 font-mono`} />
                <Button variant="secondary" size="sm" onClick={buscarPeloCampoIsbn} loading={buscandoIsbnCampo} disabled={!values.isbn?.trim()}>
                  Buscar ISBN
                </Button>
              </div>
            )}
          </Field>
          <TextField label="Subtítulo" {...field("subtitulo")} optional />
          <div className="grid grid-cols-2 gap-4">
            <TextField label="Editora" {...field("editora")} optional />
            <TextField label="Local" {...field("localPublicacao")} optional />
            <TextField label="Ano" {...field("anoPublicacao")} inputMode="numeric" maxLength={4} placeholder="2020" optional />
            <TextField label="Páginas" {...field("numeroPaginas")} inputMode="numeric" optional />
          </div>
          <TextArea label="Sinopse" {...field("resumo")} rows={4} optional />
        </div>
      )}
    </Drawer>
  );
}

export default function ObraDrawer({ open, obra, onClose }) {
  return open ? <ObraForm obra={obra} onClose={onClose} /> : null;
}
