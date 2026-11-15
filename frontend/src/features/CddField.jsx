import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Lightbulb, List, X } from "lucide-react";
import Button from "../components/ui/Button.jsx";
import { Field, inputClass } from "../components/ui/Field.jsx";
import { acharPorCodigo, acharPorDescricao, filtrarCdds, normalizarCodigo, statusCdd } from "../lib/cdd.js";

/**
 * Par CDD + Assunto ligado aos CDDs já cadastrados:
 * - digitar um código cadastrado preenche (e trava) o assunto; digitar o assunto de um cadastrado preenche o código;
 * - a lista permite ver e escolher os cadastrados, filtrando pelo que está sendo digitado;
 * - um código novo exige assunto e será cadastrado junto com a obra.
 */
export default function CddField({ cdds, codigo, descricao, onChange, sugestao }) {
  const [painel, setPainel] = useState(false);
  const [consulta, setConsulta] = useState("");
  const rootRef = useRef(null);
  const listId = useId();

  const status = useMemo(() => statusCdd(cdds, codigo, descricao), [cdds, codigo, descricao]);
  const travado = status.tipo === "cadastrado" && Boolean(status.cdd.descricao);
  const semAssunto = status.tipo === "cadastrado" && !status.cdd.descricao;
  const opcoes = useMemo(() => filtrarCdds(cdds, consulta), [cdds, consulta]);

  useEffect(() => {
    const fora = (e) => !rootRef.current?.contains(e.target) && setPainel(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const escolher = (cdd) => {
    onChange({ cdd: cdd.id, cddDescricao: cdd.descricao });
    setPainel(false);
  };

  const digitarCodigo = (valor, abrir = true) => {
    if (abrir) {
      setConsulta(valor);
      setPainel(true);
    }
    const achado = acharPorCodigo(cdds, valor);
    if (achado) onChange({ cdd: valor, cddDescricao: achado.descricao });
    // Saiu de um CDD cadastrado: o assunto veio dele, então não deve ficar para o código novo.
    else onChange(travado ? { cdd: valor, cddDescricao: "" } : { cdd: valor });
  };

  const digitarDescricao = (valor) => {
    setConsulta(valor);
    setPainel(true);
    const achado = !codigo.trim() && acharPorDescricao(cdds, valor);
    onChange(achado ? { cdd: achado.id, cddDescricao: achado.descricao } : { cddDescricao: valor });
  };

  const aoTeclar = (e) => {
    if (e.key === "Escape" && painel) {
      e.stopPropagation();
      setPainel(false);
    }
  };

  const mensagem = {
    cadastrado: semAssunto
      ? "CDD cadastrado, mas ainda sem assunto: o que você digitar será salvo nele."
      : "CDD cadastrado. Para mudar o assunto dele, use a página Classificação (CDD).",
    novo: "CDD novo: será cadastrado junto com esta obra.",
    incompleto: status.mensagem,
  }[status.tipo];

  return (
    <div ref={rootRef} className="relative space-y-3">
      <div className="grid grid-cols-[120px_1fr] gap-4">
        <Field label="CDD">
          {(id) => (
            <input
              id={id}
              value={codigo}
              onChange={(e) => digitarCodigo(e.target.value)}
              onFocus={() => {
                setConsulta(codigo);
                setPainel(true);
              }}
              onBlur={(e) => {
                const limpo = normalizarCodigo(e.target.value);
                if (limpo !== e.target.value) digitarCodigo(limpo, false);
              }}
              onKeyDown={aoTeclar}
              placeholder="869.3"
              autoComplete="off"
              role="combobox"
              aria-expanded={painel}
              aria-controls={listId}
              aria-invalid={status.tipo === "incompleto"}
              className={`${inputClass} font-mono`}
            />
          )}
        </Field>
        <Field label="Assunto">
          {(id) => (
            <div className="relative">
              <input
                id={id}
                value={descricao}
                onChange={(e) => digitarDescricao(e.target.value)}
                onFocus={() => {
                  if (!travado) {
                    setConsulta(descricao);
                    setPainel(true);
                  }
                }}
                onKeyDown={aoTeclar}
                readOnly={travado}
                placeholder="Literatura brasileira — ficção"
                autoComplete="off"
                aria-invalid={status.tipo === "incompleto"}
                className={`${inputClass} ${travado ? "bg-sunken pr-12" : ""}`}
              />
              {status.tipo !== "vazio" && (
                <button
                  type="button"
                  onClick={() => onChange({ cdd: "", cddDescricao: "" })}
                  aria-label="Limpar CDD"
                  className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:bg-sunken hover:text-ink"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`flex items-start gap-1.5 text-xs ${status.tipo === "incompleto" ? "font-semibold text-danger" : "text-ink-muted"}`}>
          {status.tipo === "cadastrado" && <Check size={14} className="mt-px shrink-0 text-ok" />}
          {mensagem}
        </p>
        <Button
          variant="ghost"
          size="sm"
          icon={List}
          onClick={() => {
            setConsulta("");
            setPainel((aberto) => !aberto);
          }}
          aria-expanded={painel}
          aria-controls={listId}
        >
          CDDs cadastrados
        </Button>
      </div>

      {status.tipo === "vazio" && sugestao && (
        <button
          type="button"
          onClick={() => escolher(sugestao)}
          className="flex w-full items-center gap-2 rounded-md border-[1.5px] border-dashed border-forest/40 bg-forest-soft px-3 py-2 text-left text-sm text-ink hover:border-forest"
        >
          <Lightbulb size={16} className="shrink-0 text-forest" />
          <span className="min-w-0 flex-1">
            Sugestão: <span className="font-mono font-semibold">{sugestao.id}</span> — {sugestao.descricao}
          </span>
          <span className="shrink-0 font-semibold text-forest">Usar</span>
        </button>
      )}

      {painel && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border-[1.5px] border-line-strong bg-panel py-1 shadow-pop scrollbar-thin">
          {opcoes.length === 0 && (
            <li className="px-4 py-3 text-sm text-ink-muted">
              {cdds.length === 0 ? "Nenhum CDD cadastrado ainda. Digite o código e o assunto para cadastrar o primeiro." : "Nenhum CDD cadastrado combina. Preencha código e assunto para cadastrar um novo."}
            </li>
          )}
          {opcoes.map((cdd) => (
            <li key={cdd.id} role="option" aria-selected={cdd.id === normalizarCodigo(codigo)}>
              <button type="button" onClick={() => escolher(cdd)} className="flex w-full items-baseline gap-3 px-4 py-2.5 text-left hover:bg-forest-soft">
                <span className="w-16 shrink-0 font-mono text-sm font-semibold text-ink">{cdd.id}</span>
                <span className="min-w-0 break-words text-sm text-ink-soft">{cdd.descricao}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
