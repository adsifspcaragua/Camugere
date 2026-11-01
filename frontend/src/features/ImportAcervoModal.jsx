import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, ArrowRight, BookOpen } from "lucide-react";
import Modal from "../components/ui/Modal.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Badge from "../components/ui/Badge.jsx";
import { parseAcervoCsv } from "../lib/csvImport.js";
import { useLibrary } from "../context/LibraryContext.jsx";
import { plural } from "../lib/format.js";

export default function ImportAcervoModal({ open, onClose }) {
  const { importObras, reload } = useLibrary();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [parsedObras, setParsedObras] = useState([]);
  const [parsingError, setParsingError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const resetState = () => {
    setFile(null);
    setParsedObras([]);
    setParsingError("");
    setLoading(false);
    setResult(null);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".csv") && selectedFile.type !== "text/csv") {
      setParsingError("Selecione um arquivo no formato CSV (.csv).");
      return;
    }

    setFile(selectedFile);
    setParsingError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const obras = parseAcervoCsv(text);
        if (obras.length === 0) {
          setParsingError("Nenhuma obra com título válido foi encontrada no arquivo. Verifique o cabeçalho e os dados.");
          setParsedObras([]);
        } else {
          setParsedObras(obras);
        }
      } catch (err) {
        setParsingError(`Erro ao processar o CSV: ${err.message}`);
        setParsedObras([]);
      }
    };
    reader.onerror = () => {
      setParsingError("Falha ao ler o arquivo selecionado.");
    };
    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) processFile(dropped);
  };

  const handleImport = async () => {
    if (parsedObras.length === 0 || loading) return;
    setLoading(true);
    setParsingError("");

    try {
      const res = await importObras(parsedObras);
      const data = res?.data || res;
      setResult(data);
      await reload();
    } catch (err) {
      setParsingError(err.message || "Erro ao importar as obras.");
    } finally {
      setLoading(false);
    }
  };

  const totalExemplares = parsedObras.reduce((acc, o) => acc + (o.numExemplares || 1), 0);

  return (
    <Modal open={open} onClose={handleClose} labelledBy="import-modal-title">
      <div className="p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Upload size={20} />
            </span>
            <div>
              <h2 id="import-modal-title" className="font-display text-lg font-bold text-ink">
                Importar Acervo via CSV
              </h2>
              <p className="text-xs text-ink-muted">
                Compatível com exportação do Camugere e planilhas legadas da biblioteca
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-md p-1.5 text-ink-muted hover:bg-sunken hover:text-ink transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg bg-ok-soft/30 border border-ok/20">
              <CheckCircle2 size={42} className="text-ok mb-2" />
              <h3 className="font-semibold text-base text-ink">Importação concluída com sucesso!</h3>
              <p className="text-sm text-ink-soft mt-1">
                Os dados foram sincronizados com o acervo da biblioteca.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-md bg-sunken">
                <span className="block text-xl font-bold text-ink">{result.criadas || 0}</span>
                <span className="text-xs text-ink-muted">Novas obras</span>
              </div>
              <div className="p-3 rounded-md bg-sunken">
                <span className="block text-xl font-bold text-ink">{result.atualizadas || 0}</span>
                <span className="text-xs text-ink-muted">Obras atualizadas</span>
              </div>
              <div className="p-3 rounded-md bg-sunken">
                <span className="block text-xl font-bold text-brand">{result.exemplaresCriados || 0}</span>
                <span className="text-xs text-ink-muted">Exemplares gerados</span>
              </div>
            </div>

            {result.erros && result.erros.length > 0 && (
              <div className="mt-3 p-3 rounded-md bg-warn-soft/40 border border-warn/20 text-xs text-ink-soft">
                <p className="font-semibold text-ink mb-1">Avisos ({result.erros.length}):</p>
                <ul className="list-disc pl-4 space-y-0.5 max-h-24 overflow-y-auto">
                  {result.erros.map((e, idx) => (
                    <li key={idx}>Linha {e.linha}: {e.titulo ? `“${e.titulo}” - ` : ""}{e.erro}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button onClick={handleClose}>Concluir</Button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  dragOver
                    ? "border-brand bg-brand-soft/20"
                    : "border-line-strong hover:border-brand/60 bg-sunken/40 hover:bg-sunken"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <FileText size={38} className="text-ink-muted mb-3" />
                <p className="font-semibold text-sm text-ink text-center">
                  Arraste e solte o arquivo CSV aqui ou clique para selecionar
                </p>
                <p className="text-xs text-ink-muted mt-1 text-center">
                  Formatos aceitos: CSV Camugere (Título, Autoria, CDD, ISBN...) ou legado (title, writers...)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md bg-sunken border border-line">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-brand shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-ink truncate max-w-[280px]">{file.name}</p>
                      <p className="text-xs text-ink-muted">
                        {plural(parsedObras.length, "obra")} identificada(s) · {plural(totalExemplares, "exemplar", "exemplares")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetState}>
                    Trocar arquivo
                  </Button>
                </div>

                {parsingError && (
                  <div className="flex items-start gap-2.5 p-3 rounded-md bg-danger-soft text-danger text-xs">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{parsingError}</span>
                  </div>
                )}

                {parsedObras.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-ink-muted font-medium">
                      <span>Pré-visualização (primeiras {Math.min(5, parsedObras.length)} de {parsedObras.length} obras):</span>
                      <span className="text-brand font-semibold">{totalExemplares} exemplares no total</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto rounded-md border border-line divide-y divide-line text-xs bg-panel">
                      {parsedObras.slice(0, 5).map((obra, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink truncate">{obra.titulo}</p>
                            <p className="text-ink-muted truncate">
                              {obra.autor || "Sem autor"} {obra.cdd ? `· CDD: ${obra.cdd}` : ""} {obra.isbn ? `· ISBN: ${obra.isbn}` : ""}
                            </p>
                          </div>
                          <Badge tone="ok">{plural(obra.numExemplares, "exemplar", "exemplares")}</Badge>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-ink-muted italic">
                      * Obras já cadastradas com o mesmo ISBN ou título receberão os novos exemplares automaticamente.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-line">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                icon={loading ? undefined : ArrowRight}
                onClick={handleImport}
                disabled={parsedObras.length === 0 || loading}
              >
                {loading ? <Spinner size={16} label="Importando..." /> : `Importar ${parsedObras.length} ${parsedObras.length === 1 ? "obra" : "obras"}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

