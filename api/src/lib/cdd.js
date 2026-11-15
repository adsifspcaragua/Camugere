/**
 * Normaliza o código CDD digitado: remove espaços e usa ponto como separador decimal
 * ("869,3" e " 869.3 " viram "869.3"). Letras são preservadas (ex.: "869e" no acervo legado).
 */
export const normalizarCodigo = (codigo) =>
  String(codigo ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/,/g, ".");

const comparavel = (texto) => String(texto ?? "").trim().replace(/\s+/g, " ").toLowerCase();
export const mesmaDescricao = (a, b) => comparavel(a) === comparavel(b);
