import { useState, useEffect, useRef } from "react";
import { X, BookOpen, UserRound, Hash, Layers, Plus } from "lucide-react";

export default function ObraDrawer({ isOpen, onClose, onConfirm, editingObra = null }) {
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [cdd, setCdd] = useState("");
  const [cddDescricao, setCddDescricao] = useState("");
  const [resumo, setResumo] = useState("");
  const [capaUrl, setCapaUrl] = useState("");
  const [isbn, setIsbn] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState(""); // NOVO
  const [localPublicacao, setLocalPublicacao] = useState(""); // NOVO
  const [numExemplares, setNumExemplares] = useState(1);
  const [buscandoIsbn, setBuscandoIsbn] = useState(false);
  const inputRef = useRef(null);
  const isEdit = !!editingObra;
  
  useEffect(() => {
    if (isOpen) {
      if (editingObra) {
        setTitulo(editingObra.titulo || "");
        setAutor(editingObra.autor || "");
        setCdd(editingObra.cdd || "");
        setCddDescricao(editingObra.cddDescricao || "");
        setResumo(editingObra.resumo || "");
        setCapaUrl(editingObra.capaUrl || ""); 
        setAnoPublicacao(editingObra.anoPublicacao || ""); // Agora puxa ao editar
        setLocalPublicacao(editingObra.localPublicacao || ""); // Agora puxa ao editar
      } else {
        setTitulo("");
        setAutor("");
        setCdd("");
        setCddDescricao("");
        setResumo("");
        setCapaUrl("");
        setAnoPublicacao(""); // Limpa o campo ao abrir novo
        setLocalPublicacao(""); // Limpa o campo ao abrir novo
        setNumExemplares(1);
        setIsbn("");
      }
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, editingObra]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Dicionário temporário para o auto-preenchimento. 
  // Dica: Futuramente, você pode puxar isso da sua rota GET /cdd
  const dicionarioCdd = {
    "005.1": "Desenvolvimento de Sistemas e Programação",
    "869.3": "Literatura Brasileira - Ficção e Romance",
    "150": "Psicologia",
    "900": "Geografia e História"
  };

  // Se digitar o número, preenche o texto
  const handleCddChange = (e) => {
    const numero = e.target.value;
    setCdd(numero);
    if (dicionarioCdd[numero]) {
      setCddDescricao(dicionarioCdd[numero]);
    }
  };

  // Se digitar o texto, busca o número correspondente
  const handleCddDescricaoChange = (e) => {
    const texto = e.target.value;
    setCddDescricao(texto);
    const numeroEncontrado = Object.keys(dicionarioCdd).find(
      key => dicionarioCdd[key].toLowerCase() === texto.toLowerCase()
    );
    if (numeroEncontrado) {
      setCdd(numeroEncontrado);
    }
  };

const buscarDadosPorIsbn = async () => {
    if (!isbn) return;
    const isbnLimpo = isbn.replace(/\D/g, '');
    if (isbnLimpo.length !== 13 && isbnLimpo.length !== 10) {
      alert("Por favor, digite um ISBN válido de 10 ou 13 dígitos."); return;
    }
    setBuscandoIsbn(true);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbnLimpo}`);
      if (!response.ok) throw new Error("ISBN não encontrado na base de dados.");
      
      const data = await response.json();

      setTitulo(data.title || '');
      setAutor(data.authors?.length > 0 ? data.authors.join(', ') : '');
      setResumo(data.synopsis || '');
      setCapaUrl(data.cover_url || '');
      
      // Preenchendo os novos campos de publicação
      setAnoPublicacao(data.year || '');
      const localEditora = [data.location, data.publisher].filter(Boolean).join(' - ');
      setLocalPublicacao(localEditora || '');

      // Lógica do CDD
      if (data.subjects && data.subjects.length > 0) {
        setCddDescricao(data.subjects[0]);
        const numEncontrado = Object.keys(dicionarioCdd).find(
          key => dicionarioCdd[key].toLowerCase() === data.subjects[0].toLowerCase()
        );
        setCdd(numEncontrado || "");
      } else {
        setCddDescricao("");
        setCdd("");
      }

    } catch (error) {
      console.error("Erro ao buscar ISBN:", error);
      alert(error.message);
    } finally {
      setBuscandoIsbn(false);
    }
  };

  // Só permite salvar se Título e Autor estiverem preenchidos
  const canSubmit = Boolean(titulo && titulo.trim() !== "" && autor && autor.trim() !== "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    onConfirm({
      titulo: titulo.trim(),
      autor: autor.trim(),
      cdd: cdd.trim(),
      cddDescricao: cddDescricao.trim(),
      resumo: resumo.trim(),
      capaUrl: capaUrl.trim(),
      anoPublicacao: anoPublicacao.trim(),
      localPublicacao: localPublicacao.trim(),
      
      // O truque: envia um emoji padrão para o banco antigo não quebrar
      capa: "📕", 
      
      numExemplares: isEdit ? 0 : numExemplares,
      ...(editingObra && { idObra: editingObra.idObra }),
    });
    
    onClose();
  };


  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose} aria-hidden="true"
      />
      <div
        role="dialog" aria-modal="true" aria-label={isEdit ? "Editar Obra" : "Nova Obra"}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-surface-200 bg-white shadow-2xl transition-transform duration-300 ease-out dark:border-surface-800 dark:bg-surface-900 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-6 py-5 dark:border-surface-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{isEdit ? "Editar Obra" : "Nova Obra"}</h2>
              <p className="text-base text-surface-400 dark:text-surface-500">{isEdit ? "Atualizar dados da obra" : "Cadastrar obra no acervo"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-2xl p-3 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800" aria-label="Fechar">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 scrollbar-thin">
            
            {/* Visualização da Capa Real e URL */}
            <div className="flex gap-4 items-end">
              <div className="flex-shrink-0">
                {capaUrl ? (
                  <img src={capaUrl} alt="Capa" className="h-32 w-24 rounded-lg object-cover shadow-md" />
                ) : (
                  <div className="flex h-32 w-24 items-center justify-center rounded-lg bg-surface-100 text-surface-400 border border-dashed border-surface-300 dark:bg-surface-800 dark:border-surface-700 text-sm text-center px-2">
                    Sem Capa
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  URL da Capa
                </label>
                <input
                  type="text" value={capaUrl} onChange={(e) => setCapaUrl(e.target.value)}
                  placeholder="Link da imagem (opcional)"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
              </div>
            </div>

            {/* Busca por ISBN */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <Hash size={18} className="text-surface-400" /> Buscar por ISBN
              </label>
              <div className="flex gap-3">
                <input
                  type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Digite apenas os números"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
                <button
                  type="button" onClick={buscarDadosPorIsbn} disabled={buscandoIsbn || !isbn}
                  className="flex whitespace-nowrap items-center justify-center rounded-2xl bg-brand-100 px-5 font-semibold text-brand-700 transition-colors hover:bg-brand-200 disabled:opacity-50 dark:bg-brand-500/20 dark:text-brand-400 dark:hover:bg-brand-500/30"
                >
                  {buscandoIsbn ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <BookOpen size={18} className="text-surface-400" /> Título
              </label>
              <input
                ref={inputRef} type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Dom Casmurro" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Autor */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                <UserRound size={18} className="text-surface-400" /> Autor(a)
              </label>
              <input
                type="text" value={autor} onChange={(e) => setAutor(e.target.value)}
                placeholder="Ex: Machado de Assis" required
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
              />
            </div>

            {/* Publicação (Ano e Local) */}
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  Ano
                </label>
                <input
                  type="text" value={anoPublicacao} onChange={(e) => setAnoPublicacao(e.target.value)}
                  placeholder="Ex: 1899"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
              </div>
              <div className="flex-1">
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  Editora / Local
                </label>
                <input
                  type="text" value={localPublicacao} onChange={(e) => setLocalPublicacao(e.target.value)}
                  placeholder="Ex: Editora Ática - São Paulo"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
              </div>
            </div>

            {/* Resumo */}
            <div>
              <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                Resumo da Obra
              </label>
              <textarea
                value={resumo} onChange={(e) => setResumo(e.target.value)}
                placeholder="Descrição do livro..."
                rows={4}
                className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500 scrollbar-thin"
              />
            </div>

            {/* Campos de CDD */}
            <div className="flex gap-4">
              <div className="w-1/3">
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  <Hash size={18} className="text-surface-400" /> CDD
                </label>
                <input
                  type="text" value={cdd} onChange={handleCddChange}
                  placeholder="Ex: 869.3"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
              </div>
              <div className="flex-1">
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  Descrição (Assunto)
                </label>
                <input
                  type="text" value={cddDescricao} onChange={handleCddDescricaoChange}
                  placeholder="Ex: Literatura Brasileira"
                  className="w-full rounded-2xl border border-surface-200 bg-surface-50 py-3 px-4 text-base text-surface-900 placeholder-surface-400 outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-white dark:placeholder-surface-500 dark:focus:border-brand-500"
                />
              </div>
            </div>

            {/* Nº de Exemplares */}
            {!isEdit && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-base font-medium text-surface-700 dark:text-surface-300">
                  <Layers size={18} className="text-surface-400" /> Quantidade de Exemplares
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setNumExemplares((v) => Math.max(1, v - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-lg font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-white dark:hover:bg-surface-800"
                  >−</button>
                  <span className="w-10 text-center text-xl font-bold text-surface-900 dark:text-white">{numExemplares}</span>
                  <button type="button" onClick={() => setNumExemplares((v) => Math.min(20, v + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-surface-200 text-lg font-semibold text-surface-600 hover:bg-surface-100 dark:border-surface-700 dark:text-white dark:hover:bg-surface-800"
                  >+</button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Salvar (Fixo no rodapé da gaveta) */}
          <div className="border-t border-surface-200 px-6 py-5 dark:border-surface-800">
            <button
              type="submit" disabled={!canSubmit}
              className="w-full rounded-2xl bg-brand-600 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:bg-brand-700 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEdit ? "Salvar Alterações" : "Cadastrar Obra"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
