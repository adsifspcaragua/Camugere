/**
 * Preenchimento automático de obras a partir de catálogos públicos:
 * Brasil API (ISBNs brasileiros) e Google Books (ISBN ou título, com capa e sinopse).
 * Nenhuma das duas exige chave de API.
 */
import { sugerirCdd } from "../lib/cdd.js";

const onlyIsbn = (v = "") => v.replace(/[^0-9Xx]/g, "").toUpperCase();
export const pareceIsbn = (texto) => [10, 13].includes(onlyIsbn(texto).length) && /^[\d\s-]+[Xx]?$/.test(texto.trim());

const httpsCapa = (url) => url?.replace(/^http:/, "https:").replace("&edge=curl", "") ?? "";

function deGoogle(item) {
  const v = item.volumeInfo ?? {};
  const isbn = v.industryIdentifiers?.find((i) => i.type === "ISBN_13")?.identifier ?? v.industryIdentifiers?.find((i) => i.type === "ISBN_10")?.identifier ?? "";
  const assunto = v.categories?.[0] ?? "";
  const cdd = sugerirCdd([assunto, v.title, v.description].join(" "), v.language);
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
    cdd: cdd?.codigo ?? "",
    cddDescricao: cdd?.descricao ?? assunto,
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
  const cdd = sugerirCdd([d.subjects?.join(" "), d.title, d.synopsis].join(" "), "pt");
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
    cdd: cdd?.codigo ?? "",
    cddDescricao: cdd?.descricao ?? d.subjects?.[0] ?? "",
  };
}

// Junta os dois resultados: Brasil API costuma ter editora/local; Google, capa e sinopse.
const mesclar = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k] || b?.[k] || ""]));

export async function buscarPorIsbn(texto) {
  const isbn = onlyIsbn(texto);
  const [br, google] = await Promise.all([brasilApi(isbn).catch(() => null), googleBooks(`isbn:${isbn}`, 1).catch(() => [])]);
  const g = google[0];
  if (!br && !g) throw new Error("Não encontramos esse ISBN. Confira os números ou busque pelo título.");
  const livro = br ? mesclar(br, g) : g;
  return { ...livro, isbn };
}

export async function buscarPorTitulo(texto) {
  return googleBooks(`intitle:${texto}`).catch(() => []);
}
