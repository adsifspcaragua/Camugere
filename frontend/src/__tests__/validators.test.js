import {
  fieldErrorsFromApi,
  isValidCpf,
  isValidEmail,
  isValidIsbn,
  validateBibliotecario,
  validateCdd,
  validateEmprestimo,
  validateImagem,
  validateLeitor,
  validateLogin,
  validateObra,
  validateSuspensao,
} from "../lib/validators.js";

const leitorOk = { nome: "Maria Souza", email: "maria@ex.com", cpf: "529.982.247-25", telefone: "", cep: "", uf: "" };

describe("validators", () => {
  it("valida CPF com dígitos verificadores", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
  it("valida e-mail e ISBN", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidIsbn("978-85-359-1484-9")).toBe(true);
    expect(isValidIsbn("9788535914840")).toBe(false);
    expect(isValidIsbn("85-359-0277-5")).toBe(true);
  });
  it("login exige e-mail válido e senha", () => {
    expect(validateLogin({ email: "", senha: "" })).toHaveProperty("email");
    expect(validateLogin({ email: "x@y.com", senha: "" })).toHaveProperty("senha");
    expect(validateLogin({ email: "x@y.com", senha: "1" })).toEqual({});
  });
  it("leitor: aceita completo e explica o que falta", () => {
    expect(validateLeitor(leitorOk)).toEqual({});
    const erros = validateLeitor({ ...leitorOk, nome: "", cpf: "123", email: "x", telefone: "123", cep: "1", uf: "RJX" });
    expect(Object.keys(erros).sort()).toEqual(["cep", "cpf", "email", "nome", "telefone", "uf"]);
    expect(erros.cpf).toMatch(/faltam 8/);
    expect(validateLeitor({ ...leitorOk, cpf: "529.982.247-24" }).cpf).toMatch(/inválido/);
  });
  it("bibliotecário: senha curta e confirmação divergente", () => {
    const base = { nome: "Ana", email: "ana@ex.com", senha: "123456", confirmacao: "123456" };
    expect(validateBibliotecario(base)).toEqual({});
    expect(validateBibliotecario({ ...base, senha: "123", confirmacao: "123" })).toHaveProperty("senha");
    expect(validateBibliotecario({ ...base, confirmacao: "654321" }).confirmacao).toMatch(/não conferem/);
  });
  it("CDD: código, assunto e duplicidade", () => {
    expect(validateCdd({ id: "869,3", descricao: "Literatura" })).toEqual({});
    expect(validateCdd({ id: "abc", descricao: "" })).toHaveProperty("id");
    expect(validateCdd({ id: "869.3", descricao: "x" }, { existente: { id: "869.3", descricao: "Lit" } }).id).toMatch(/já está cadastrado/);
    expect(validateCdd({ id: "", descricao: "x" }, { editing: true })).toEqual({});
  });
  it("obra: título, autor, ISBN, ano, páginas e capa", () => {
    const ok = { titulo: "Quarto de despejo", autor: "Carolina", isbn: "", anoPublicacao: "1960", numeroPaginas: "200", capaUrl: "https://x.com/a.jpg" };
    expect(validateObra(ok)).toEqual({});
    const erros = validateObra({ ...ok, titulo: " ", autor: "", isbn: "123", anoPublicacao: "20x", numeroPaginas: "-3", capaUrl: "ftp://a" });
    expect(Object.keys(erros).sort()).toEqual(["anoPublicacao", "autor", "capaUrl", "isbn", "numeroPaginas", "titulo"]);
    expect(validateObra(ok, { cddIncompleto: "Informe o assunto" }).cdd).toBe("Informe o assunto");
  });
  it("suspensão e empréstimo", () => {
    expect(validateSuspensao({ motivo: "ab" })).toHaveProperty("motivo");
    expect(validateSuspensao({ motivo: "Atraso" })).toEqual({});
    expect(validateEmprestimo({ leitor: null, exemplar: null, dias: NaN })).toHaveProperty("leitor");
    expect(validateEmprestimo({ leitor: { suspensao: {} }, exemplar: {}, dias: 5 }).leitor).toMatch(/suspenso/);
    expect(validateEmprestimo({ leitor: {}, exemplar: {}, dias: 0 }).devolucao).toMatch(/futura/);
    expect(validateEmprestimo({ leitor: {}, exemplar: {}, dias: 14 })).toEqual({});
  });
  it("imagem: tipo e tamanho", () => {
    expect(validateImagem({ type: "application/pdf", size: 1 }, 100)).toMatch(/Formato/);
    expect(validateImagem({ type: "image/png", size: 5 * 1024 * 1024 }, 1024)).toMatch(/limite/);
    expect(validateImagem({ type: "image/png", size: 10 }, 100)).toBeNull();
  });
  it("converte details da API em erros por campo", () => {
    const err = { details: ["cpf: CPF inválido", "email: e-mail inválido", "mensagem sem campo"] };
    expect(fieldErrorsFromApi(err)).toEqual({ cpf: "CPF inválido", email: "E-mail inválido" });
  });
});
