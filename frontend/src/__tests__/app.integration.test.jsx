/**
 * Integração da interface: App completo (providers, páginas e gavetas reais) contra um backend falso.
 * Só o `fetch` é substituído; services, contextos e componentes rodam como em produção.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App.jsx";
import { TOKEN_KEY } from "../lib/api.js";

const hoje = new Date();
const diasAtras = (n) => new Date(hoje.getTime() - n * 86_400_000).toISOString();

const db = () => ({
  obras: [
    {
      id: 1, titulo: "Dom Casmurro", autor: "Machado de Assis", cdd: "869.3", cddDescricao: "Ficção brasileira", isbn: "9788535914849", capaUrl: null, ativa: true,
      exemplares: [
        { id: 11, id_obra: 1, numeroInventario: "0001-01", disponivel: true },
        { id: 12, id_obra: 1, numeroInventario: "0001-02", disponivel: false },
      ],
    },
    {
      id: 2, titulo: "A Hora da Estrela", autor: "Clarice Lispector", cdd: null, cddDescricao: null, isbn: null, capaUrl: null, ativa: true,
      exemplares: [{ id: 21, id_obra: 2, numeroInventario: "0002-01", disponivel: false }],
    },
  ],
  cdds: [{ id: "869.3", descricao: "Ficção brasileira", _count: { obras: 1 } }],
  leitores: [
    { id: 1, id_usuario: 101, cpf: "52998224725", telefone: "12999998888", cidade: "Caraguatatuba", usuario: { id: 101, nome: "Ana Souza", email: "ana@x.com" }, suspensaoAtiva: null },
    { id: 2, id_usuario: 102, cpf: "11144477735", telefone: null, usuario: { id: 102, nome: "Bruno Lima", email: "bruno@x.com" }, suspensaoAtiva: { id: 9, motivo: "Atrasos recorrentes", dataFim: null } },
  ],
  emprestimos: [
    // ativo e atrasado (14 dias de prazo, retirado há 20)
    { id: 100, dataInicio: diasAtras(20), diasLocacao: 14, statusDevolucao: false, dataDevolucao: null, id_leitor: 1, id_exemplar: 12, leitor: { usuario: { nome: "Ana Souza", email: "ana@x.com" } }, exemplar: { numeroInventario: "0001-02", obra: { id: 1, titulo: "Dom Casmurro" } } },
    // ativo no prazo
    { id: 101, dataInicio: diasAtras(2), diasLocacao: 14, statusDevolucao: false, dataDevolucao: null, id_leitor: 1, id_exemplar: 21, leitor: { usuario: { nome: "Ana Souza", email: "ana@x.com" } }, exemplar: { numeroInventario: "0002-01", obra: { id: 2, titulo: "A Hora da Estrela" } } },
    // devolvido
    { id: 102, dataInicio: diasAtras(60), diasLocacao: 14, statusDevolucao: true, dataDevolucao: diasAtras(50), id_leitor: 2, id_exemplar: 11, leitor: { usuario: { nome: "Bruno Lima", email: "bruno@x.com" } }, exemplar: { numeroInventario: "0001-01", obra: { id: 1, titulo: "Dom Casmurro" } } },
  ],
});

let dados;
let chamadas;
let sobrescritas;

const json = (status, body) => Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) });

function backend(url, opts = {}) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const method = opts.method ?? "GET";
  const body = opts.body && typeof opts.body === "string" ? JSON.parse(opts.body) : undefined;
  chamadas.push({ method, path, body });

  const chave = `${method} ${path}`;
  if (sobrescritas[chave]) return sobrescritas[chave](body);

  const rotas = {
    "POST /login": () => json(200, { data: "token-de-teste" }),
    "GET /me": () => json(200, { data: { usuario: { id: 1, nome: "Bibliotecária Teste", email: "admin@camugere.org" } } }),
    "GET /obra/list": () => json(200, { data: dados.obras }),
    "GET /cdd/list": () => json(200, { data: dados.cdds }),
    "GET /leitor/list": () => json(200, { data: dados.leitores }),
    "GET /emprestimo/list": () => json(200, { data: dados.emprestimos }),
    "GET /emprestimo/lembretes": () => json(200, { data: { diasAntes: 2, automatico: true, pendentes: 1 } }),
    "GET /bibliotecario/list": () => json(200, { data: [{ id: 1, id_usuario: 1, usuario: { id: 1, nome: "Bibliotecária Teste", email: "admin@camugere.org" } }] }),
    "POST /emprestimo/create": () => json(201, { data: { id: 200, emailNotification: { enviado: true, emailDestino: "ana@x.com" } } }),
    "PATCH /emprestimo/devolver/100": () => json(200, { data: { id: 100 } }),
    "PATCH /emprestimo/desfazer-devolucao/100": () => json(200, { data: { id: 100 } }),
    "POST /leitor/create": (b) => json(201, { data: { id: 3, ...b } }),
    "POST /leitor/1/suspender": (b) => json(201, { data: { id: 10, ...b } }),
    "PATCH /leitor/suspensao/9/encerrar": () => json(200, { data: { id: 9 } }),
    "POST /obra/create": (b) => json(201, { message: "Obra criada.", data: { id: 3, ...b } }),
    "PUT /obra/update/1": (b) => json(200, { message: "Obra atualizada.", data: { id: 1, ...b } }),
  };
  if (rotas[chave]) return rotas[chave]();
  if (method === "GET" && /^\/leitor\/\d+\/(emprestimos|suspensoes)$/.test(path)) return json(200, { data: [] });
  return json(404, { message: `Rota ${chave} não simulada` });
}

beforeEach(() => {
  dados = db();
  chamadas = [];
  sobrescritas = {};
  localStorage.clear();
  globalThis.fetch = vi.fn(backend);
  window.scrollTo = vi.fn();
  window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
});

async function entrarAutenticado() {
  localStorage.setItem(TOKEN_KEY, "token-de-teste");
  render(<App />);
  await screen.findByRole("navigation", { name: "Principal" });
  await waitFor(() => expect(screen.queryByText("Carregando acervo")).not.toBeInTheDocument());
}

const navegar = (rotulo) => fireEvent.click(within(screen.getByRole("navigation", { name: "Principal" })).getByRole("button", { name: new RegExp(rotulo) }));
const escolher = (combobox, texto, opcao) => {
  fireEvent.change(combobox, { target: { value: texto } });
  fireEvent.click(screen.getByRole("option", { name: new RegExp(opcao) }));
};

describe("App: login", () => {
  it("entra com e-mail e senha e abre o painel", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("E-mail de acesso"), { target: { value: "admin@camugere.org" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "camugere123" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar no sistema/i }));
    await screen.findByRole("navigation", { name: "Principal" });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("token-de-teste");
    expect(chamadas.find((c) => c.path === "/login").body).toEqual({ email: "admin@camugere.org", senha: "camugere123" });
  });

  it("sessão expirada volta para o login com aviso", async () => {
    localStorage.setItem(TOKEN_KEY, "velho");
    sobrescritas["GET /me"] = () => json(401, { message: "Acesso revogado." });
    render(<App />);
    expect(await screen.findByLabelText("E-mail de acesso")).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("sem conexão mostra a tela de reconexão", async () => {
    localStorage.setItem(TOKEN_KEY, "tkn");
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch")).mockImplementation(backend);
    render(<App />);
    expect(await screen.findByText("Sem conexão com o servidor")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await screen.findByRole("navigation", { name: "Principal" });
  });
});

describe("App: navegação por todas as páginas", () => {
  it.each([
    ["Empréstimos", "Dom Casmurro"],
    ["Leitores", "Bruno Lima"],
    ["Acervo", "A Hora da Estrela"],
    ["Classificação", "869.3"],
    ["Relatórios", "Relatórios"],
    ["Configurações", "Configurações"],
  ])("abre %s sem erro e mostra os dados", async (pagina, texto) => {
    await entrarAutenticado();
    navegar(pagina);
    const main = screen.getByRole("main");
    await waitFor(() => expect(within(main).getAllByText(new RegExp(texto)).length).toBeGreaterThan(0));
    expect(screen.queryByText("Algo deu errado por aqui")).not.toBeInTheDocument();
    expect(within(screen.getByRole("navigation", { name: "Principal" })).getByRole("button", { name: new RegExp(pagina) })).toHaveAttribute("aria-current", "page");
  });

  it("o painel inicial mostra o empréstimo atrasado", async () => {
    await entrarAutenticado();
    const main = screen.getByRole("main");
    expect(within(main).getAllByText(/Dom Casmurro/).length).toBeGreaterThan(0);
    expect(within(main).getAllByText(/Ana Souza/).length).toBeGreaterThan(0);
  });

  it("a busca do topo leva ao acervo filtrado", async () => {
    await entrarAutenticado();
    fireEvent.change(screen.getAllByRole("searchbox")[0], { target: { value: "Clarice" } });
    const main = screen.getByRole("main");
    await waitFor(() => expect(within(main).getAllByText(/A Hora da Estrela/).length).toBeGreaterThan(0));
    expect(within(main).queryByText(/Dom Casmurro/)).not.toBeInTheDocument();
  });

  it("sair do sistema volta ao login", async () => {
    await entrarAutenticado();
    fireEvent.click(screen.getByLabelText("Sair do sistema"));
    expect(await screen.findByLabelText("E-mail de acesso")).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("App: fluxo de empréstimo", () => {
  it("registra empréstimo pelo atalho N e envia os dados certos à API", async () => {
    await entrarAutenticado();
    fireEvent.keyDown(document, { key: "n" });
    const gaveta = await screen.findByRole("dialog", { name: "Novo empréstimo" });
    const [leitor, exemplar] = within(gaveta).getAllByRole("combobox");
    escolher(leitor, "Ana", "Ana Souza");
    escolher(exemplar, "0001-01", "Dom Casmurro");
    fireEvent.click(within(gaveta).getByRole("button", { name: "Registrar empréstimo" }));

    await screen.findByText("Empréstimo registrado. Comprovante enviado para ana@x.com.");
    const criacao = chamadas.find((c) => c.path === "/emprestimo/create");
    expect(criacao.body).toEqual({ id_leitor: 1, id_exemplar: 11, diasLocacao: 14, enviarNotificacao: true });
    expect(screen.queryByRole("dialog", { name: "Novo empréstimo" })).not.toBeInTheDocument();
  });

  it("bloqueia leitor suspenso antes de chamar a API", async () => {
    await entrarAutenticado();
    fireEvent.keyDown(document, { key: "n" });
    const gaveta = await screen.findByRole("dialog", { name: "Novo empréstimo" });
    const [leitor, exemplar] = within(gaveta).getAllByRole("combobox");
    escolher(leitor, "Bruno", "Bruno Lima");
    expect(within(gaveta).getByText(/Bruno Lima está suspenso\(a\) por tempo indeterminado: Atrasos recorrentes/)).toBeInTheDocument();
    escolher(exemplar, "0001-01", "Dom Casmurro");
    fireEvent.click(within(gaveta).getByRole("button", { name: "Registrar empréstimo" }));
    expect(await within(gaveta).findByText("Confira os campos destacados em vermelho.")).toBeInTheDocument();
    expect(chamadas.some((c) => c.path === "/emprestimo/create")).toBe(false);
  });

  it("mostra no campo exemplar o conflito 409 devolvido pela API", async () => {
    sobrescritas["POST /emprestimo/create"] = () => json(409, { message: "Este exemplar já está emprestado." });
    await entrarAutenticado();
    fireEvent.keyDown(document, { key: "n" });
    const gaveta = await screen.findByRole("dialog", { name: "Novo empréstimo" });
    const [leitor, exemplar] = within(gaveta).getAllByRole("combobox");
    escolher(leitor, "Ana", "Ana Souza");
    escolher(exemplar, "0001-01", "Dom Casmurro");
    fireEvent.click(within(gaveta).getByRole("button", { name: "Registrar empréstimo" }));
    await waitFor(() => expect(within(gaveta).getAllByText("Este exemplar já está emprestado.").length).toBeGreaterThan(0));
    expect(screen.getByRole("dialog", { name: "Novo empréstimo" })).toBeInTheDocument();
  });

  it("registra devolução pelo atalho D e permite desfazer", async () => {
    await entrarAutenticado();
    fireEvent.keyDown(document, { key: "d" });
    const gaveta = await screen.findByRole("dialog", { name: "Registrar devolução" });
    escolher(within(gaveta).getByRole("combobox"), "0001-02", "Dom Casmurro");
    expect(within(gaveta).getByText(/dia\(s\) de atraso/)).toBeInTheDocument();
    fireEvent.click(within(gaveta).getByRole("button", { name: "Confirmar devolução" }));

    await screen.findByText("Devolução de “Dom Casmurro” registrada.");
    expect(chamadas.some((c) => c.method === "PATCH" && c.path === "/emprestimo/devolver/100")).toBe(true);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Desfazer" })));
    await screen.findByText("Ação desfeita.");
    expect(chamadas.some((c) => c.path === "/emprestimo/desfazer-devolucao/100")).toBe(true);
  });

  it("pede para escolher o empréstimo antes de confirmar a devolução", async () => {
    await entrarAutenticado();
    fireEvent.keyDown(document, { key: "d" });
    const gaveta = await screen.findByRole("dialog", { name: "Registrar devolução" });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Confirmar devolução" }));
    expect(await within(gaveta).findByText("Escolha o empréstimo que está sendo devolvido.")).toBeInTheDocument();
  });

  it("renovação e lembretes não quebram a página de empréstimos", async () => {
    await entrarAutenticado();
    navegar("Empréstimos");
    expect(within(screen.getByRole("main")).getAllByText(/atraso/).length).toBeGreaterThan(0);
  });

  it("erro ao carregar os dados aparece como aviso", async () => {
    sobrescritas["GET /obra/list"] = () => json(500, { message: "Erro interno do servidor." });
    localStorage.setItem(TOKEN_KEY, "token-de-teste");
    render(<App />);
    expect(await screen.findByText("Erro interno do servidor.")).toBeInTheDocument();
  });
});

describe("App: cadastro de leitores", () => {
  const abrirNovoLeitor = async () => {
    await entrarAutenticado();
    navegar("Leitores");
    fireEvent.click(within(screen.getByRole("main")).getByRole("button", { name: "Novo leitor" }));
    return screen.findByRole("dialog", { name: "Novo leitor" });
  };

  const preencherLeitor = (gaveta) => {
    fireEvent.change(within(gaveta).getByLabelText("Nome completo"), { target: { value: "Carla Dias" } });
    fireEvent.change(within(gaveta).getByLabelText("E-mail"), { target: { value: "carla@x.com" } });
    fireEvent.change(within(gaveta).getByLabelText("CPF"), { target: { value: "52998224725" } });
    fireEvent.change(within(gaveta).getByLabelText(/Telefone/), { target: { value: "12988887777" } });
    fireEvent.change(within(gaveta).getByLabelText("Número"), { target: { value: "10" } });
    fireEvent.change(within(gaveta).getByLabelText("Bairro"), { target: { value: "Centro" } });
    fireEvent.change(within(gaveta).getByLabelText("Cidade"), { target: { value: "Caraguatatuba" } });
    fireEvent.change(within(gaveta).getByLabelText("UF"), { target: { value: "sp" } });
  };

  it("valida os campos antes de enviar", async () => {
    const gaveta = await abrirNovoLeitor();
    fireEvent.change(within(gaveta).getByLabelText("CPF"), { target: { value: "11111111111" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Cadastrar leitor" }));
    await waitFor(() => expect(within(gaveta).getAllByRole("alert").length).toBeGreaterThan(0));
    expect(chamadas.some((c) => c.path === "/leitor/create")).toBe(false);
  });

  it("cadastra leitor com CPF formatado na tela e só dígitos na API", async () => {
    const gaveta = await abrirNovoLeitor();
    preencherLeitor(gaveta);
    expect(within(gaveta).getByLabelText("CPF")).toHaveValue("529.982.247-25");
    fireEvent.click(within(gaveta).getByRole("button", { name: "Cadastrar leitor" }));

    await screen.findByText("Carla Dias cadastrado(a).");
    const envio = chamadas.find((c) => c.path === "/leitor/create").body;
    expect(envio).toMatchObject({ nome: "Carla Dias", email: "carla@x.com", uf: "SP" });
    expect(envio.cpf.replace(/\D/g, "")).toBe("52998224725");
  });

  it("mantém a gaveta aberta quando a API recusa o CPF duplicado", async () => {
    sobrescritas["POST /leitor/create"] = () => json(409, { message: "Já existe um registro com este CPF. Confira o valor informado." });
    const gaveta = await abrirNovoLeitor();
    preencherLeitor(gaveta);
    fireEvent.click(within(gaveta).getByRole("button", { name: "Cadastrar leitor" }));
    await waitFor(() => expect(screen.getAllByText(/Já existe um registro com este CPF/).length).toBeGreaterThan(0));
    expect(screen.getByRole("dialog", { name: "Novo leitor" })).toBeInTheDocument();
  });

  it("abre o detalhe do leitor e suspende os empréstimos", async () => {
    await entrarAutenticado();
    navegar("Leitores");
    fireEvent.click(within(screen.getByRole("main")).getAllByRole("button", { name: /Ana Souza/ })[0]);
    const gaveta = await screen.findByRole("dialog", { name: "Ana Souza" });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Suspender empréstimos deste leitor" }));
    fireEvent.change(within(gaveta).getByLabelText("Motivo da suspensão"), { target: { value: "Livro devolvido danificado" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Suspender leitor" }));
    await screen.findByText("Ana Souza está suspenso(a) de novos empréstimos.");
    expect(chamadas.find((c) => c.path === "/leitor/1/suspender").body).toMatchObject({ motivo: "Livro devolvido danificado" });
  });

  it("libera leitor suspenso", async () => {
    await entrarAutenticado();
    navegar("Leitores");
    fireEvent.click(within(screen.getByRole("main")).getAllByRole("button", { name: /Bruno Lima/ })[0]);
    const gaveta = await screen.findByRole("dialog", { name: "Bruno Lima" });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Liberar agora" }));
    await screen.findByText("Bruno Lima pode voltar a pegar livros.");
    expect(chamadas.some((c) => c.method === "PATCH" && c.path === "/leitor/suspensao/9/encerrar")).toBe(true);
  });
});

describe("App: cadastro de obras", () => {
  const abrirNovaObra = async () => {
    await entrarAutenticado();
    navegar("Acervo");
    fireEvent.click(within(screen.getByRole("main")).getByRole("button", { name: "Nova obra" }));
    return screen.findByRole("dialog", { name: "Nova obra" });
  };

  it("exige título e autoria", async () => {
    const gaveta = await abrirNovaObra();
    fireEvent.click(within(gaveta).getByRole("button", { name: "Adicionar ao acervo" }));
    await waitFor(() => expect(within(gaveta).getAllByRole("alert").length).toBeGreaterThan(0));
    expect(chamadas.some((c) => c.path === "/obra/create")).toBe(false);
  });

  it("cadastra obra com CDD existente e a quantidade de exemplares escolhida", async () => {
    const gaveta = await abrirNovaObra();
    fireEvent.change(within(gaveta).getByLabelText("Título"), { target: { value: "Quarto de Despejo" } });
    fireEvent.change(within(gaveta).getByLabelText("Autoria"), { target: { value: "Carolina Maria de Jesus" } });
    fireEvent.change(within(gaveta).getByLabelText("CDD"), { target: { value: "869.3" } });
    fireEvent.click(within(gaveta).getByLabelText("Mais um exemplar"));
    fireEvent.click(within(gaveta).getByLabelText("Mais um exemplar"));
    fireEvent.click(within(gaveta).getByLabelText("Menos um exemplar"));
    fireEvent.click(within(gaveta).getByRole("button", { name: "Adicionar ao acervo" }));

    await screen.findByText("“Quarto de Despejo” adicionada ao acervo.");
    expect(chamadas.find((c) => c.path === "/obra/create").body).toMatchObject({
      titulo: "Quarto de Despejo",
      autor: "Carolina Maria de Jesus",
      cdd: "869.3",
      numExemplares: 2,
    });
  });

  it("edita obra existente", async () => {
    await entrarAutenticado();
    navegar("Acervo");
    fireEvent.click(within(screen.getByRole("main")).getByLabelText("Editar Dom Casmurro"));
    const gaveta = await screen.findByRole("dialog", { name: "Editar obra" });
    expect(within(gaveta).getByLabelText("Título")).toHaveValue("Dom Casmurro");
    fireEvent.change(within(gaveta).getByLabelText("Título"), { target: { value: "Dom Casmurro (ed. revista)" } });
    fireEvent.click(within(gaveta).getByRole("button", { name: "Salvar" }));
    await screen.findByText("“Dom Casmurro (ed. revista)” atualizada.");
    expect(chamadas.some((c) => c.method === "PUT" && c.path === "/obra/update/1")).toBe(true);
  });
});
