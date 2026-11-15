/**
 * Preenchimento automático de obras a partir de catálogos públicos:
 * Brasil API (ISBNs brasileiros), OpenLibrary (ISBN e título, capas verificadas) e Google Books.
 * Nenhuma delas exige chave de API.
 */

// O CDD é classificado manualmente: as fontes só entregam pistas (`assunto`, `idioma`, `dewey`),
// que o formulário cruza com os CDDs já cadastrados — nada aqui cria classificação.
const textoAssunto = (...partes) => partes.filter(Boolean).join(" ");

const onlyIsbn = (v = "") => v.replace(/[^0-9Xx]/g, "").toUpperCase();
export const pareceIsbn = (texto) => [10, 13].includes(onlyIsbn(texto).length) && /^[\d\s-]+[Xx]?$/.test(texto.trim());

const httpsCapa = (url) => url?.replace(/^http:/, "https:").replace("&edge=curl", "") ?? "";

function deGoogle(item) {
  const v = item.volumeInfo ?? {};
  const isbn = v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ?? v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier ?? "";
  return {
    fonte: "Google Books",
    isbn,
    titulo: v.title ?? "",
    subtitulo: v.subtitle ?? "",
    autor: v.authors?.join(", ") ?? "",
    editora: v.publisher ?? "",
    localPublicacao: "",
    anoPublicacao: v.publishedDate?.slice(0, 4) ?? "",
    numeroPaginas: v.pageCount ? String(v.pageCount) : "",
    resumo: v.description ?? "",
    capaUrl: httpsCapa(v.imageLinks?.thumbnail),
    assunto: textoAssunto(v.categories?.[0], v.title, v.description),
    idioma: v.language ?? "",
    dewey: "",
  };
}

async function googleBooks(query, max = 6) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${max}&printType=books&langRestrict=pt`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.items ?? []).map(deGoogle).filter((l) => l.titulo);
}

async function brasilApi(isbn) {
  const response = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbn}`);
  if (!response.ok) return null;
  const d = await response.json();
  return {
    fonte: "Brasil API",
    isbn,
    titulo: d.title ?? "",
    subtitulo: d.subtitle ?? "",
    autor: d.authors?.join(", ") ?? "",
    editora: d.publisher ?? "",
    localPublicacao: d.location ?? "",
    anoPublicacao: d.year ? String(d.year) : "",
    numeroPaginas: d.page_count ? String(d.page_count) : "",
    resumo: d.synopsis ?? "",
    capaUrl: d.cover_url || "",
    assunto: textoAssunto(d.subjects?.join(" "), d.title, d.synopsis),
    idioma: "pt",
    dewey: "",
  };
}

async function openLibraryIsbn(isbn) {
  const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
  if (!response.ok) return null;
  const data = await response.json();
  const d = data[`ISBN:${isbn}`];
  if (!d) return null;
  const assuntos = (d.subjects ?? []).map((s) => s.name ?? s).join(" ");
  const dewey = d.classifications?.dewey_decimal_class?.[0]?.replace(/[^0-9.]/g, "") ?? "";
  const anoMatch = String(d.publish_date ?? "").match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  return {
    fonte: "OpenLibrary",
    isbn,
    titulo: d.title ?? "",
    subtitulo: d.subtitle ?? "",
    autor: (d.authors ?? []).map((a) => a.name).filter(Boolean).join(", "),
    editora: d.publishers?.[0]?.name ?? "",
    localPublicacao: d.publish_places?.[0]?.name ?? "",
    anoPublicacao: anoMatch ? anoMatch[1] : "",
    numeroPaginas: d.number_of_pages ? String(d.number_of_pages) : "",
    resumo: d.excerpts?.[0]?.text ?? "",
    capaUrl: httpsCapa(d.cover?.large || d.cover?.medium),
    assunto: textoAssunto(assuntos, d.title),
    idioma: "pt",
    dewey,
  };
}

async function openLibrarySearch(texto, max = 6) {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(texto)}&limit=${max}&fields=key,title,subtitle,author_name,publisher,publish_place,first_publish_year,number_of_pages_median,isbn,cover_i,subject,ddc`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.docs ?? [])
    .filter((d) => d.title)
    .map((d) => {
      const isbn = d.isbn?.find((i) => i.startsWith("97885") || i.startsWith("97865")) ?? d.isbn?.[0] ?? "";
      const assuntos = (d.subject ?? []).slice(0, 6).join(" ");
      const dewey = d.ddc?.[0]?.replace(/[^0-9.]/g, "") ?? "";
      return {
        fonte: "OpenLibrary",
        isbn,
        titulo: d.title ?? "",
        subtitulo: d.subtitle ?? "",
        autor: (d.author_name ?? []).join(", "),
        editora: d.publisher?.[0] ?? "",
        localPublicacao: d.publish_place?.[0] ?? "",
        anoPublicacao: d.first_publish_year ? String(d.first_publish_year) : "",
        numeroPaginas: d.number_of_pages_median ? String(d.number_of_pages_median) : "",
        resumo: "",
        capaUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : "",
        assunto: textoAssunto(assuntos, d.title),
        idioma: "pt",
        dewey,
      };
    });
}

// Junta resultados priorizando os campos preenchidos na ordem das fontes.
function mesclarFontes(...fontes) {
  const validas = fontes.filter(Boolean);
  if (!validas.length) return null;
  const chaves = Object.keys(validas[0]);
  const resultado = {};
  for (const k of chaves) {
    resultado[k] = validas.map((f) => f[k]).find((v) => v !== undefined && v !== null && String(v).trim() !== "") ?? "";
  }
  resultado.fonte = validas.map((f) => f.fonte).join(" + ");
  return resultado;
}

export async function buscarPorIsbn(texto) {
  const isbn = onlyIsbn(texto);
  const [br, ol, google] = await Promise.all([
    brasilApi(isbn).catch(() => null),
    openLibraryIsbn(isbn).catch(() => null),
    googleBooks(`isbn:${isbn}`, 1).catch(() => []),
  ]);
  let livro = mesclarFontes(br, ol, google[0]);
  // Se veio da Brasil API sem capa e não achou no ISBN da OpenLibrary, busca a capa pelo título na OpenLibrary
  if (livro && !livro.capaUrl && livro.titulo) {
    const porTitulo = await openLibrarySearch(livro.titulo, 3).catch(() => []);
    const comCapa = porTitulo.find((item) => item.capaUrl);
    if (comCapa) livro = mesclarFontes(livro, comCapa);
  }
  if (!livro) throw new Error("Não encontramos esse ISBN. Confira os números ou busque pelo título.");
  return { ...livro, isbn };
}

export async function buscarPorTitulo(texto) {
  const [google, ol] = await Promise.all([googleBooks(`intitle:${texto}`).catch(() => []), openLibrarySearch(texto).catch(() => [])]);
  return google.length > 0 ? google : ol;
}
