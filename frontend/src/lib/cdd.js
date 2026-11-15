import { matches, normalize } from "./format.js";

/** "869,3" e " 869.3 " viram "869.3" (mesma regra da API). */
export const normalizarCodigo = (codigo = "") => String(codigo).trim().replace(/\s+/g, "").replace(/,/g, ".");

const mesmoTexto = (a, b) => normalize(a).trim().replace(/\s+/g, " ") === normalize(b).trim().replace(/\s+/g, " ");

export function acharPorCodigo(cdds, codigo) {
  const alvo = normalizarCodigo(codigo).toLowerCase();
  return alvo ? (cdds.find((c) => c.id.toLowerCase() === alvo) ?? null) : null;
}

export function acharPorDescricao(cdds, descricao) {
  return descricao?.trim() ? (cdds.find((c) => mesmoTexto(c.descricao, descricao)) ?? null) : null;
}

/** Busca pelo código ou por parte da descrição, ignorando acentos e caixa. */
export const filtrarCdds = (cdds, consulta) => cdds.filter((c) => matches(consulta ?? "", c.id, c.descricao));

/**
 * Situação do par código/descrição digitado no formulário da obra:
 * vazio | cadastrado | novo (será cadastrado) | incompleto (falta código ou descrição).
 */
export function statusCdd(cdds, codigo, descricao) {
  const cod = normalizarCodigo(codigo);
  const desc = String(descricao ?? "").trim();
  if (!cod && !desc) return { tipo: "vazio" };
  if (!cod) return { tipo: "incompleto", mensagem: "Informe o código do CDD." };
  const existente = acharPorCodigo(cdds, cod);
  if (existente) return { tipo: "cadastrado", cdd: existente };
  if (!desc) return { tipo: "incompleto", mensagem: `O CDD ${cod} ainda não está cadastrado. Informe o assunto para cadastrá-lo.` };
  return { tipo: "novo" };
}

/**
 * Palavras-chave que apontam para uma classe do CDD: [padrão, código para português, código geral].
 * Servem só para escolher entre os CDDs que a bibliotecária já cadastrou — nunca criam um novo.
 */
const REGRAS = [
  [/poe(sia|try|mas?)|poems?|verso/i, "869.1", "811"],
  [/cont(os?)|short stor/i, "869.3", "813"],
  [/fic(ção|cao|tion)|romance|novel|literat/i, "869.3", "813"],
  [/juvenil|infant|juvenile|children/i, "028.5", "028.5"],
  [/hist(ória|oria|ory)/i, "981", "900"],
  [/pol[ií]tic|democra|political/i, "320", "320"],
  [/racis|étnic|etnic|negr|indígen|indigen|feminis|gênero|genero|gender/i, "305", "305"],
  [/educa|pedagog|ensino|teaching/i, "370", "370"],
  [/psicolog|psycholog/i, "150", "150"],
  [/filosof|philosoph/i, "100", "100"],
  [/relig|teolog|bíbli|bibli|spiritual/i, "200", "200"],
  [/econom|business|negócio|finan/i, "330", "330"],
  [/direito|law|jurid/i, "340", "340"],
  [/sociolog|social science|ciências sociais|sociedade/i, "300", "300"],
  [/comput|programa|software|tecnolog|technology/i, "005", "005"],
  [/medic|saúde|saude|health/i, "610", "610"],
  [/culin|cozinha|cook|receita/i, "641.5", "641.5"],
  [/arte|art\b|music|música|cinema|fotograf/i, "700", "700"],
  [/ciênci|scienc|biolog|físic|químic|matem/i, "500", "500"],
  [/geograf|viage|travel/i, "910", "910"],
  [/biograf|memória|memoir|autobiog/i, "920", "920"],
];

/** Código exato; senão a classe mais geral cadastrada (869 p/ 869.3); senão o mais específico (869.31 p/ 869.3). */
function cddMaisProximo(cdds, codigo) {
  const exato = acharPorCodigo(cdds, codigo);
  if (exato) return exato;
  const gerais = cdds.filter((c) => c.id.length >= 3 && codigo.startsWith(c.id)).sort((a, b) => b.id.length - a.id.length);
  if (gerais[0]) return gerais[0];
  return cdds.filter((c) => c.id.startsWith(codigo)).sort((a, b) => a.id.length - b.id.length)[0] ?? null;
}

/**
 * Sugere, entre os CDDs cadastrados, o que melhor combina com o assunto/título.
 * Devolve o registro cadastrado ({ id, descricao }) ou null — não inventa classificação.
 */
export function sugerirCdd(texto = "", cdds = [], idioma = "pt") {
  if (!cdds.length || !texto.trim()) return null;
  // A classe 869 é específica de literatura em português.
  const portugues = !idioma || idioma.startsWith("pt");
  for (const [padrao, codBr, codGeral] of REGRAS) {
    if (!padrao.test(texto)) continue;
    const achado = cddMaisProximo(cdds, portugues ? codBr : codGeral);
    if (achado) return achado;
  }
  return null;
}

/** Para um livro vindo dos catálogos online: prefere o Dewey da fonte se já estiver cadastrado. */
export function sugerirCddParaLivro(livro, cdds) {
  return (livro.dewey && acharPorCodigo(cdds, livro.dewey)) || sugerirCdd(livro.assunto, cdds, livro.idioma);
}
