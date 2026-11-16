/**
 * Telas de acesso: primeiro acesso, "esqueci minha senha", redefinição por link e troca de senha.
 * Só o `fetch` é simulado; páginas, contextos e services rodam como em produção.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App.jsx";
import { TOKEN_KEY } from "../lib/api.js";

let rotas;
let chamadas;
const json = (status, body) => Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) });

function backend(url, opts = {}) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const method = opts.method ?? "GET";
  const body = typeof opts.body === "string" ? JSON.parse(opts.body) : undefined;
  chamadas.push({ method, path, body, auth: opts.headers?.Authorization });
  const rota = rotas[`${method} ${path}`];
  if (rota) return rota(body);
  if (method === "GET" && /\/list$/.test(path)) return json(200, { data: [] });
  return json(404, { message: "não simulada" });
}

const usuario = { id: 1, nome: "Maria Souza", email: "maria@bib.org" };

beforeEach(() => {
  chamadas = [];
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn();
  window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  rotas = {
    "GET /primeiro-acesso": () => json(200, { data: { necessario: false } }),
    "GET /me": () => json(200, { data: { usuario } }),
    "GET /emprestimo/lembretes": () => json(200, { data: { diasAntes: 2, automatico: true, emailConfigurado: true, pendentes: 0 } }),
    "GET /bibliotecario/list": () =>
      json(200, { data: [{ id: 1, usuario }, { id: 2, usuario: { id: 2, nome: "João Lima", email: "joao@bib.org" } }] }),
  };
  globalThis.fetch = vi.fn(backend);
});

const preencher = (rotulo, valor) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } });

describe("primeiro acesso", () => {
  it("sistema vazio mostra o cadastro inicial e entra direto", async () => {
    rotas["GET /primeiro-acesso"] = () => json(200, { data: { necessario: true } });
    rotas["POST /primeiro-acesso"] = () => json(201, { data: { token: "tk-novo", usuario } });
    render(<App />);

    await screen.findByRole("heading", { name: "Primeiro acesso" });
    preencher("Seu nome", "Maria Souza");
    preencher("Seu e-mail", "maria@bib.org");
    preencher("Crie uma senha", "segredo1");
    preencher("Repita a senha", "segredo1");
    fireEvent.click(screen.getByRole("button", { name: /Criar conta e entrar/ }));

    await screen.findByRole("navigation", { name: "Principal" });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("tk-novo");
    expect(chamadas.find((c) => c.path === "/primeiro-acesso" && c.method === "POST").body).toEqual({ nome: "Maria Souza", email: "maria@bib.org", senha: "segredo1" });
  });

  it("valida antes de enviar (senhas diferentes)", async () => {
    rotas["GET /primeiro-acesso"] = () => json(200, { data: { necessario: true } });
    render(<App />);
    await screen.findByRole("heading", { name: "Primeiro acesso" });
    preencher("Seu nome", "Maria");
    preencher("Seu e-mail", "maria@bib.org");
    preencher("Crie uma senha", "segredo1");
    preencher("Repita a senha", "outra123");
    fireEvent.click(screen.getByRole("button", { name: /Criar conta e entrar/ }));
    expect(await screen.findByText(/As senhas não conferem/)).toBeInTheDocument();
    expect(chamadas.some((c) => c.method === "POST")).toBe(false);
  });

  it("com equipe cadastrada, mostra o login normal", async () => {
    render(<App />);
    await waitFor(() => expect(chamadas.some((c) => c.path === "/primeiro-acesso")).toBe(true));
    expect(screen.getByRole("heading", { name: "Entrar no Sistema" })).toBeInTheDocument();
  });
});

describe("esqueci minha senha", () => {
  const pedir = async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Esqueci minha senha" }));
    preencher("E-mail de acesso", "maria@bib.org");
    fireEvent.click(screen.getByRole("button", { name: "Enviar link" }));
  };

  it("com e-mail configurado, confirma o envio sem revelar se a conta existe", async () => {
    rotas["POST /senha/esqueci"] = () => json(200, { data: { emailConfigurado: true } });
    await pedir();
    expect(await screen.findByText(/você vai receber um e-mail/)).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === "/senha/esqueci").body).toEqual({ email: "maria@bib.org" });
  });

  it("sem e-mail configurado, orienta a pedir a um colega", async () => {
    rotas["POST /senha/esqueci"] = () => json(200, { data: { emailConfigurado: false } });
    await pedir();
    expect(await screen.findByText(/Peça a outra pessoa da equipe/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Voltar para o login/ }));
    expect(screen.getByRole("heading", { name: "Entrar no Sistema" })).toBeInTheDocument();
  });
});

describe("redefinição pelo link do e-mail", () => {
  const TOKEN = "a".repeat(43);
  beforeEach(() => window.history.replaceState(null, "", `/?redefinir=${TOKEN}`));

  it("link válido: salva a nova senha e volta ao login com aviso", async () => {
    rotas["POST /senha/validar-link"] = () => json(200, { data: { valido: true } });
    rotas["POST /senha/redefinir"] = () => json(200, { data: { redefinida: true } });
    render(<App />);
    await screen.findByLabelText("Nova senha");
    preencher("Nova senha", "nova1234");
    preencher("Repita a nova senha", "nova1234");
    fireEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));

    expect(await screen.findByText("Senha redefinida. Entre com a nova senha.")).toBeInTheDocument();
    expect(chamadas.find((c) => c.path === "/senha/redefinir").body).toEqual({ token: TOKEN, novaSenha: "nova1234" });
    expect(window.location.search).toBe("");
  });

  it("link expirado: avisa e não mostra o formulário", async () => {
    rotas["POST /senha/validar-link"] = () => json(200, { data: { valido: false } });
    render(<App />);
    expect(await screen.findByText(/inválido, já foi usado ou expirou/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });
});

describe("senha na área logada", () => {
  const abrirEquipe = async () => {
    localStorage.setItem(TOKEN_KEY, "tk");
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Principal" });
    fireEvent.click(within(nav).getByRole("button", { name: /Configurações/ }));
    return screen.findByRole("button", { name: "Alterar minha senha" });
  };

  it("altera a própria senha e passa a usar o token novo", async () => {
    rotas["PATCH /me/senha"] = () => json(200, { data: { token: "tk-v2" } });
    fireEvent.click(await abrirEquipe());
    const gaveta = await screen.findByRole("dialog", { name: "Alterar minha senha" });
    fireEvent.change(within(gaveta).getByLabelText("Senha atual"), { target: { value: "antiga1" } });
    fireEvent.change(within(gaveta).getByLabelText("Nova senha"), { target: { value: "nova1234" } });
    fireEvent.change(within(gaveta).getByLabelText("Repita a nova senha"), { target: { value: "nova1234" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar nova senha" }));

    await screen.findByText("Senha alterada.");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("tk-v2");
    expect(chamadas.find((c) => c.path === "/me/senha").body).toEqual({ senhaAtual: "antiga1", novaSenha: "nova1234" });
  });

  it("senha atual errada aparece no campo", async () => {
    rotas["PATCH /me/senha"] = () => json(400, { message: "A senha atual está incorreta.", details: ["senhaAtual: a senha atual está incorreta"] });
    fireEvent.click(await abrirEquipe());
    const gaveta = await screen.findByRole("dialog", { name: "Alterar minha senha" });
    fireEvent.change(within(gaveta).getByLabelText("Senha atual"), { target: { value: "errada1" } });
    fireEvent.change(within(gaveta).getByLabelText("Nova senha"), { target: { value: "nova1234" } });
    fireEvent.change(within(gaveta).getByLabelText("Repita a nova senha"), { target: { value: "nova1234" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar nova senha" }));
    expect(await within(gaveta).findByText("A senha atual está incorreta")).toBeInTheDocument();
  });

  it("define nova senha para um colega", async () => {
    rotas["PATCH /bibliotecario/2/senha"] = () => json(200, { data: { id: 2 } });
    await abrirEquipe();
    fireEvent.click(screen.getByRole("button", { name: "Definir nova senha para João Lima" }));
    const gaveta = await screen.findByRole("dialog", { name: "Nova senha para João Lima" });
    fireEvent.change(within(gaveta).getByLabelText("Nova senha"), { target: { value: "temp1234" } });
    fireEvent.change(within(gaveta).getByLabelText("Repita a nova senha"), { target: { value: "temp1234" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar nova senha" }));
    await screen.findByText("Senha de João Lima redefinida.");
    expect(chamadas.find((c) => c.path === "/bibliotecario/2/senha").body).toEqual({ novaSenha: "temp1234" });
  });

  it("avisa quando o e-mail não está configurado e desativa o envio de lembretes", async () => {
    rotas["GET /emprestimo/lembretes"] = () => json(200, { data: { diasAntes: 2, automatico: true, emailConfigurado: false, pendentes: 0 } });
    await abrirEquipe();
    expect(await screen.findByText(/O envio de e-mail não está configurado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Enviar pendentes agora/ })).toBeDisabled();
  });
});

describe("e-mail da biblioteca (Configurações)", () => {
  const abrirConfiguracoes = async () => {
    localStorage.setItem(TOKEN_KEY, "tk");
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "Principal" });
    fireEvent.click(within(nav).getByRole("button", { name: /Configurações/ }));
    return screen.findByRole("heading", { name: "E-mail da biblioteca" });
  };

  it("configura o Gmail com senha de app e atualiza o status", async () => {
    let salvo = { configurado: false, origem: null, nomeRemetente: "Biblioteca Camugerê", senhaDefinida: false };
    rotas["GET /configuracao/email"] = () => json(200, { data: salvo });
    rotas["PUT /configuracao/email"] = (b) => {
      salvo = { configurado: true, origem: "tela", host: b.host, porta: b.porta, usuario: b.usuario, nomeRemetente: b.nomeRemetente, senhaDefinida: true };
      return json(200, { data: salvo });
    };
    await abrirConfiguracoes();
    expect(await screen.findByText("Não configurado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Configurar" }));
    const gaveta = await screen.findByRole("dialog", { name: "Configurar e-mail" });
    expect(within(gaveta).getByRole("link", { name: /apppasswords/ })).toHaveAttribute("href", "https://myaccount.google.com/apppasswords");
    fireEvent.change(within(gaveta).getByLabelText("E-mail da conta"), { target: { value: "biblioteca@gmail.com" } });
    fireEvent.change(within(gaveta).getByLabelText("Senha de app"), { target: { value: "abcdefghijklmnop" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar" }));

    await screen.findByText(/E-mail configurado/);
    expect(chamadas.find((c) => c.method === "PUT").body).toEqual({
      host: "smtp.gmail.com", porta: 587, seguro: false, usuario: "biblioteca@gmail.com", senha: "abcdefghijklmnop", nomeRemetente: "Biblioteca Camugerê",
    });
    expect(await screen.findByText("biblioteca@gmail.com")).toBeInTheDocument();
  });

  it("outro provedor exige servidor e porta; senha em branco mantém a salva", async () => {
    rotas["GET /configuracao/email"] = () =>
      json(200, { data: { configurado: true, origem: "tela", host: "smtp.meuprovedor.com", porta: 465, seguro: true, usuario: "bib@meuprovedor.com", nomeRemetente: "Biblioteca", senhaDefinida: true } });
    rotas["PUT /configuracao/email"] = (b) => json(200, { data: { configurado: true, origem: "tela", ...b } });
    await abrirConfiguracoes();
    fireEvent.click(await screen.findByRole("button", { name: "Alterar" }));
    const gaveta = await screen.findByRole("dialog", { name: "Configurar e-mail" });
    expect(within(gaveta).getByLabelText("Provedor")).toHaveValue("outro");
    fireEvent.change(within(gaveta).getByLabelText("Servidor SMTP"), { target: { value: "" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar" }));
    expect(await within(gaveta).findByText(/Informe o servidor SMTP/)).toBeInTheDocument();

    fireEvent.change(within(gaveta).getByLabelText("Servidor SMTP"), { target: { value: "smtp.novo.com" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar" }));
    await screen.findByText(/E-mail configurado/);
    expect(chamadas.find((c) => c.method === "PUT").body).toMatchObject({ host: "smtp.novo.com", porta: 465, seguro: true, senha: "" });
  });

  it("envia e-mail de teste e mostra a explicação quando falha", async () => {
    rotas["GET /configuracao/email"] = () => json(200, { data: { configurado: true, origem: "tela", host: "smtp.gmail.com", porta: 587, usuario: "b@gmail.com", senhaDefinida: true } });
    rotas["POST /configuracao/email/teste"] = () => json(200, { message: "E-mail de teste enviado para maria@bib.org." });
    await abrirConfiguracoes();
    fireEvent.click(await screen.findByRole("button", { name: /Enviar e-mail de teste/ }));
    expect(await screen.findByText("E-mail de teste enviado para maria@bib.org.")).toBeInTheDocument();

    rotas["POST /configuracao/email/teste"] = () => json(400, { message: "O servidor recusou o e-mail ou a senha." });
    fireEvent.click(screen.getByRole("button", { name: /Enviar e-mail de teste/ }));
    expect(await screen.findByText("O servidor recusou o e-mail ou a senha.")).toBeInTheDocument();
  });

  it("configuração vinda do .env aparece como configurada, sem botão de remover", async () => {
    rotas["GET /configuracao/email"] = () => json(200, { data: { configurado: true, origem: "env", host: "smtp.env", porta: 587, usuario: "env@x.org", senhaDefinida: true } });
    await abrirConfiguracoes();
    expect(await screen.findByText(/Definido no arquivo/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  });
});
