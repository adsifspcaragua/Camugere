/**
 * Parser e normalizador de CSV para importação de acervo.
 * Compatível tanto com o formato de exportação nativo do Camugere quanto com
 * planilhas legadas de sistemas de biblioteca (ex: Koha, Biblivre, planilhas Access/Excel).
 */

/**
 * Faz o parse de texto CSV respeitando RFC 4180 (aspas duplas escapadas, quebras de linha e vírgulas).
 */
export function parseRawCsv(csvText) {
  if (!csvText || typeof csvText !== "string") return [];

  // Remove BOM se presente
  const text = csvText.replace(/^\uFEFF/, "");

  // Detecta se o delimitador é ponto-e-vírgula ou vírgula pela primeira linha
  const firstLine = text.split(/\r\n|\n|\r/)[0] || "";
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";

  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // pula a próxima aspa
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\r") {
        if (nextChar === "\n") i++;
        currentRow.push(currentField);
        if (currentRow.some((f) => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        if (currentRow.some((f) => f.trim().length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normaliza nomes de colunas para mapear cabeçalhos flexíveis.
 */
function normalizeHeaderName(name = "") {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const FIELD_MAP = {
  subtitulo: ["subtitulo", "subtitle"],
  titulo: ["titulo", "title", "nome", "obra", "livro"],
  autor: ["autoria", "autor", "autores", "writers", "author", "escritor", "escritores"],
  cdd: ["classification", "classificacao", "cdd", "subject"],
  isbn: ["isbn", "issn"],
  exemplares: ["exemplares", "exemplar", "total", "quantidade", "qtd", "copias"],
  editora: ["editora", "publisher"],
  anoPublicacao: ["anopublicacao", "ano", "year", "publicacao"],
  numeroPaginas: ["numeropaginas", "paginas", "numberofpages", "pages", "numpaginas"],
  edicao: ["edicao", "edition"],
  resumo: ["resumo", "descricao", "description", "sinopse"],
  capaUrl: ["capaurl", "capa", "cover"],
};

export function mapHeaderToField(headerName) {
  const norm = normalizeHeaderName(headerName);
  // 1. Prioriza correspondência exata
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    if (aliases.includes(norm)) return field;
  }
  // 2. Correspondência por inclusão
  for (const [field, aliases] of Object.entries(FIELD_MAP)) {
    if (aliases.some((a) => norm.includes(a))) return field;
  }
  return null;
}

/**
 * Limpa o campo de autor (ex: remove wrappers de array legados como '{"Carolina Maria de Jesus"}').
 */
export function cleanAutor(raw = "") {
  if (!raw) return "";
  let val = String(raw).trim();

  // Remove recursivamente aspas externas e chaves
  let mudou = true;
  while (mudou && val.length > 0) {
    const antes = val;
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).trim();
    if (val.startsWith("{") && val.endsWith("}")) val = val.slice(1, -1).trim();
    mudou = val !== antes;
  }

  // Remove aspas internas duplicadas ou residuais
  val = val.replace(/^"+|"+$/g, "");

  // Se tiver autores separados por vírgula dentro de aspas duplas escapadas: ""Autor 1"",""Autor 2""
  val = val
    .split(/","|",\s*"/)
    .map((s) => s.replace(/^"+|"+$/g, "").trim())
    .filter(Boolean)
    .join(", ");

  return val;
}

/**
 * Limpa o CDD/Classificação (remove chaves se houver, ex: {869e} -> 869e).
 */
export function cleanCdd(raw = "") {
  if (!raw) return "";
  return String(raw).replace(/[{}]/g, "").trim();
}

/**
 * Limpa ISBN (remove pontuação e valida se é texto sem isbn).
 */
export function cleanIsbn(raw = "") {
  if (!raw) return null;
  const val = String(raw).trim();
  if (val.toLowerCase().includes("sem isbn")) return null;
  const digits = val.replace(/[^0-9Xx]/g, "");
  return digits.length >= 8 ? digits : null;
}

/**
 * Extrai ano de publicação válido de strings ou datas legadas.
 */
export function cleanAno(raw = "") {
  if (!raw) return null;
  const str = String(raw).trim();
  if (str.startsWith("1905-") || str.startsWith("1900-")) {
    // Artefato comum de exportações de bancos antigos com data default
    return null;
  }
  // Se for uma data tipo YYYY-MM-DD
  const match = str.match(/\b(19\d{2}|20\d{2})\b/);
  if (match) {
    const year = parseInt(match[1], 10);
    return year >= 1500 && year <= 2100 ? year : null;
  }
  const num = parseInt(str, 10);
  if (!Number.isNaN(num) && num >= 1500 && num <= 2100) {
    return num;
  }
  return null;
}

/**
 * Converte o texto CSV em uma lista de obras agrupadas e normalizadas.
 */
export function parseAcervoCsv(csvText) {
  const rows = parseRawCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const fieldMapping = headers.map(mapHeaderToField);

  // Mapeia cada linha para um objeto
  const parsedItems = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item = {};

    for (let c = 0; c < row.length; c++) {
      const field = fieldMapping[c];
      if (field) {
        // Se já tinha valor (ex: cdd mapeado de classification após subject), preserva o mais rico
        if (!item[field] || (field === "cdd" && (!item[field] || item[field] === "{}"))) {
          item[field] = row[c]?.trim() ?? "";
        }
      }
    }

    if (!item.titulo) continue; // Pula linhas sem título

    const titulo = item.titulo;
    const autor = cleanAutor(item.autor);
    const cdd = cleanCdd(item.cdd);
    const isbn = cleanIsbn(item.isbn);
    const ano = cleanAno(item.anoPublicacao || item.edicao);
    const paginas = item.numeroPaginas ? parseInt(item.numeroPaginas, 10) || 0 : 0;
    const exemplares = item.exemplares ? Math.max(1, parseInt(item.exemplares, 10) || 1) : 1;

    parsedItems.push({
      titulo,
      subtitulo: item.subtitulo || null,
      autor: autor || null,
      cdd: cdd || null,
      isbn: isbn || null,
      editora: item.editora || null,
      anoPublicacao: ano,
      numeroPaginas: paginas > 0 ? paginas : 0,
      resumo: item.resumo || null,
      capaUrl: item.capaUrl || null,
      edicao: item.edicao && !item.edicao.match(/^\d{4}$/) ? item.edicao : null,
      numExemplares: exemplares,
    });
  }

  // Agrupamento: se a mesma obra aparece em múltiplas linhas (como no controle legado
  // onde cada linha era 1 exemplar físico), agrupa por ISBN (se houver) ou por Título
  const agrupadas = new Map();

  for (const item of parsedItems) {
    const chave = item.isbn
      ? `isbn:${item.isbn}`
      : `titulo:${item.titulo.toLowerCase().trim()}|autor:${(item.autor || "").toLowerCase().trim()}`;

    if (agrupadas.has(chave)) {
      const existente = agrupadas.get(chave);
      existente.numExemplares += item.numExemplares;
      // Preenche campos que possam estar vazios na linha anterior
      if (!existente.autor && item.autor) existente.autor = item.autor;
      if (!existente.cdd && item.cdd) existente.cdd = item.cdd;
      if (!existente.editora && item.editora) existente.editora = item.editora;
      if (!existente.anoPublicacao && item.anoPublicacao) existente.anoPublicacao = item.anoPublicacao;
      if (!existente.numeroPaginas && item.numeroPaginas) existente.numeroPaginas = item.numeroPaginas;
      if (!existente.resumo && item.resumo) existente.resumo = item.resumo;
      if (!existente.capaUrl && item.capaUrl) existente.capaUrl = item.capaUrl;
    } else {
      agrupadas.set(chave, { ...item });
    }
  }

  return Array.from(agrupadas.values());
}
