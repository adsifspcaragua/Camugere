// Número de tombo legível e único por obra: "<id da obra>-<sequencial>", ex.: "0012-03".
export function formatarInventario(idObra, sequencial) {
  return `${String(idObra).padStart(4, "0")}-${String(sequencial).padStart(2, "0")}`;
}

export function proximoSequencial(numerosExistentes, idObra) {
  const prefixo = `${String(idObra).padStart(4, "0")}-`;
  const usados = numerosExistentes
    .filter((n) => n.startsWith(prefixo))
    .map((n) => Number(n.slice(prefixo.length)))
    .filter(Number.isInteger);
  return usados.length ? Math.max(...usados) + 1 : 1;
}

export function gerarInventarios(idObra, quantidade, numerosExistentes = []) {
  const inicio = proximoSequencial(numerosExistentes, idObra);
  return Array.from({ length: quantidade }, (_, i) => formatarInventario(idObra, inicio + i));
}
