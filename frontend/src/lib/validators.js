import { onlyDigits } from "./format.js";
import { normalizarCodigo } from "./cdd.js";

/**
 * Validação dos formulários, espelhando as regras da API (api/src/schemas).
 * Cada `validateX(values)` devolve { campo: "mensagem de orientação" } — vazio quando tudo está certo.
 * As mensagens dizem o que fazer, não só o que está errado.
 */

const blank = (v) => String(v ?? "").trim() === "";
const len = (v) => String(v ?? "").trim().length;

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isValidEmail = (v) => EMAIL_RE.test(String(v ?? "").trim());

function cpfDigit(cpf, size) {
  let sum = 0;
  for (let i = 0; i < size; i++) sum += Number(cpf[i]) * (size + 1 - i);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  return cpfDigit(cpf, 9) === Number(cpf[9]) && cpfDigit(cpf, 10) === Number(cpf[10]);
}

export function isValidIsbn(value) {
  const isbn = String(value ?? "").replace(/[^0-9Xx]/g, "").toUpperCase();
  if (isbn.length === 13) {
    if (!/^\d{13}$/.test(isbn)) return false;
    const sum = [...isbn].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0;
  }
  if (isbn.length === 10) {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false;
    const sum = [...isbn].reduce((acc, d, i) => acc + (d === "X" ? 10 : Number(d)) * (10 - i), 0);
    return sum % 11 === 0;
  }
  return false;
}

/** Aplica as regras na ordem e devolve a primeira mensagem — ou undefined. */
const first = (...checks) => checks.find(Boolean);

const required = (v, msg) => (blank(v) ? msg : undefined);
const maxLen = (v, max, label) => (len(v) > max ? `${label} aceita no máximo ${max} caracteres (agora tem ${len(v)}).` : undefined);

const emailError = (v) =>
  first(
    required(v, "Informe o e-mail."),
    !isValidEmail(v) && "E-mail inválido. Use o formato nome@exemplo.com.",
    maxLen(v, 100, "O e-mail"),
  ) || undefined;

const senhaError = (v) =>
  first(required(v, "Informe a senha."), String(v).length < 6 && "A senha precisa ter ao menos 6 caracteres.", String(v).length > 72 && "A senha aceita no máximo 72 caracteres.") || undefined;

const clean = (errors) => Object.fromEntries(Object.entries(errors).filter(([, msg]) => msg));

export function validateLogin({ email, senha }) {
  return clean({
    email: emailError(email),
    senha: required(senha, "Informe a senha."),
  });
}

export function validateLeitor(v) {
  const cpf = onlyDigits(v.cpf);
  const tel = onlyDigits(v.telefone);
  const cep = onlyDigits(v.cep);
  return clean({
    nome:
      first(required(v.nome, "Informe o nome completo."), len(v.nome) < 2 && "O nome precisa ter ao menos 2 letras.", maxLen(v.nome, 80, "O nome")) || undefined,
    email: emailError(v.email),
    cpf:
      first(
        required(v.cpf, "Informe o CPF do leitor."),
        cpf.length !== 11 && `O CPF tem 11 números (faltam ${Math.max(0, 11 - cpf.length)}).`,
        cpf.length === 11 && !isValidCpf(cpf) && "CPF inválido. Confira os números digitados.",
      ) || undefined,
    telefone: tel && (tel.length < 10 || tel.length > 11) ? "Telefone deve ter DDD + número (10 ou 11 dígitos). Ex.: (21) 99999-0000." : undefined,
    cep: cep && cep.length !== 8 ? "O CEP tem 8 números. Ex.: 20040-020." : undefined,
    logradouro: maxLen(v.logradouro, 150, "O logradouro"),
    numero: maxLen(v.numero, 20, "O número"),
    complemento: maxLen(v.complemento, 80, "O complemento"),
    bairro: maxLen(v.bairro, 80, "O bairro"),
    cidade: maxLen(v.cidade, 80, "A cidade"),
    uf: !blank(v.uf) && !/^[A-Za-z]{2}$/.test(String(v.uf).trim()) ? "Use a sigla do estado com 2 letras. Ex.: RJ." : undefined,
  });
}

export function validateBibliotecario(v) {
  return clean({
    nome:
      first(required(v.nome, "Informe o nome."), len(v.nome) < 2 && "O nome precisa ter ao menos 2 letras.", maxLen(v.nome, 80, "O nome")) || undefined,
    email: emailError(v.email),
    senha: senhaError(v.senha),
    confirmacao: first(required(v.confirmacao, "Repita a senha para confirmar."), v.confirmacao !== v.senha && "As senhas não conferem. Digite a mesma senha nos dois campos.") || undefined,
  });
}

export function validateCdd(v, { editing = false, existente } = {}) {
  const codigo = normalizarCodigo(v.id);
  return clean({
    id: editing
      ? undefined
      : first(
          required(codigo, "Informe o código CDD. Ex.: 869.3."),
          codigo && !/^\d[\dA-Za-z.\-/]*$/.test(codigo) && "O código deve começar com número. Ex.: 869.3.",
          codigo.length > 15 && "O código aceita no máximo 15 caracteres.",
          existente && `O CDD ${existente.id} já está cadastrado como “${existente.descricao}”.`,
        ) || undefined,
    descricao: first(required(v.descricao, "Informe o assunto (ex.: Literatura brasileira)."), maxLen(v.descricao, 150, "O assunto")) || undefined,
  });
}

export function validateObra(v, { cddIncompleto } = {}) {
  const ano = String(v.anoPublicacao ?? "").trim();
  const paginas = String(v.numeroPaginas ?? "").trim();
  const isbnTxt = String(v.isbn ?? "").trim();
  const capa = String(v.capaUrl ?? "").trim();
  const anoMax = new Date().getFullYear() + 1;
  return clean({
    titulo: first(required(v.titulo, "Informe o título da obra."), maxLen(v.titulo, 200, "O título")) || undefined,
    autor: required(v.autor, "Informe a autoria. Vários autores: separe por vírgula."),
    subtitulo: maxLen(v.subtitulo, 200, "O subtítulo"),
    editora: maxLen(v.editora, 100, "A editora"),
    localPublicacao: maxLen(v.localPublicacao, 100, "O local"),
    isbn: isbnTxt && !isValidIsbn(isbnTxt) ? "ISBN inválido. Use 10 ou 13 números (confira os dígitos no verso do livro)." : undefined,
    anoPublicacao: ano && (!/^\d{1,4}$/.test(ano) || Number(ano) > anoMax) ? `Ano inválido. Use 4 dígitos, até ${anoMax}.` : undefined,
    numeroPaginas: paginas && !/^\d+$/.test(paginas) ? "Páginas deve ser um número inteiro. Ex.: 320." : undefined,
    capaUrl: capa && !/^(https?:\/\/|data:image\/|\/uploads\/)/i.test(capa) ? "O link da capa deve começar com http:// ou https://." : maxLen(capa, 2000, "O link da capa"),
    resumo: maxLen(v.resumo, 10000, "A sinopse"),
    cdd: cddIncompleto,
  });
}

export function validateSuspensao({ motivo }) {
  return clean({
    motivo: first(required(motivo, "Explique o motivo da suspensão."), len(motivo) < 3 && "Descreva o motivo com ao menos 3 caracteres.", maxLen(motivo, 500, "O motivo")) || undefined,
  });
}

export function validateEmprestimo({ leitor, exemplar, dias }) {
  return clean({
    leitor: first(!leitor && "Escolha o leitor na lista.", leitor?.suspensao && "Este leitor está suspenso e não pode pegar livros agora.") || undefined,
    exemplar: !exemplar ? "Escolha o exemplar na lista." : undefined,
    devolucao: !Number.isFinite(dias) ? "Informe uma data de devolução válida." : dias < 1 ? "Escolha uma data futura." : dias > 365 ? "O prazo máximo é de 365 dias." : undefined,
  });
}

/** Valida arquivo de imagem (capa) antes de enviar. */
export function validateImagem(file, maxBytes) {
  if (!file) return "Nenhum arquivo selecionado.";
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return "Formato não aceito. Envie uma imagem JPG, PNG, WebP ou GIF.";
  if (file.size > maxBytes) return `A imagem tem ${(file.size / 1024 / 1024).toFixed(1)} MB; o limite é ${Math.round(maxBytes / 1024 / 1024)} MB. Reduza o tamanho e tente de novo.`;
  return null;
}

/**
 * Converte o `details` da API (["cpf: CPF inválido", ...]) em { cpf: "CPF inválido" }.
 * Mensagens sem campo ficam fora (ficam só no aviso geral).
 */
export function fieldErrorsFromApi(error, known = null) {
  const result = {};
  for (const item of error?.details ?? []) {
    const match = /^([\w.]+):\s*(.+)$/.exec(String(item));
    if (!match) continue;
    const campo = match[1].split(".").pop();
    if (known && !known.includes(campo)) continue;
    result[campo] ??= capitalize(match[2]);
  }
  return result;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
