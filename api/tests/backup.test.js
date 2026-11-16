import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { acharMysqldump, lerConexao, limparAntigos, listarBackups, nomeDoBackup } from "../src/cli/backup.js";

describe("lerConexao", () => {
  it("extrai os dados do DATABASE_URL, com senha codificada", () => {
    expect(lerConexao("mysql://camugere:s%40nha%231@127.0.0.1:3307/camugere")).toEqual({
      host: "127.0.0.1", porta: 3307, usuario: "camugere", senha: "s@nha#1", banco: "camugere",
    });
    expect(lerConexao("mysql://u:p@localhost/bib").porta).toBe(3306);
  });

  it.each([
    [undefined, /não está definida/],
    ["postgres://u:p@h/db", /não é um endereço MySQL/],
    ["mysql://u:p@h", /nome do banco/],
  ])("recusa %p", (url, msg) => {
    expect(() => lerConexao(url)).toThrow(msg);
  });
});

it("nomeDoBackup usa data e hora locais", () => {
  expect(nomeDoBackup(new Date(2026, 0, 5, 9, 7))).toBe("camugere-2026-01-05_09h07");
});

describe("acharMysqldump", () => {
  const sem = { noPath: () => false, listar: () => [], existe: () => false };

  it("MYSQLDUMP no .env tem prioridade e precisa existir", () => {
    expect(acharMysqldump({ ...sem, env: { MYSQLDUMP: "D:\\x\\mysqldump.exe" }, existe: () => true })).toBe("D:\\x\\mysqldump.exe");
    expect(() => acharMysqldump({ ...sem, env: { MYSQLDUMP: "D:\\x" } })).toThrow(/não existe/);
  });

  it("usa o do PATH quando existe", () => {
    expect(acharMysqldump({ ...sem, env: {}, noPath: () => true })).toBe("mysqldump");
  });

  it("procura na pasta do MySQL, da versão mais nova para a mais antiga", () => {
    const listar = (dir) => (dir === path.join("C:\\Program Files", "MySQL") ? ["MySQL Router 8.0", "MySQL Server 8.0", "MySQL Server 8.4", "MySQL Workbench 8.0"] : []);
    const existe = (f) => f.includes("Server 8.");
    expect(acharMysqldump({ ...sem, env: { ProgramFiles: "C:\\Program Files" }, listar, existe })).toBe(
      path.join("C:\\Program Files", "MySQL", "MySQL Server 8.4", "bin", "mysqldump.exe"),
    );
  });

  it("explica o que fazer quando não acha", () => {
    expect(() => acharMysqldump({ ...sem, env: {} })).toThrow(/MYSQLDUMP no api\/\.env/);
  });
});

describe("limparAntigos", () => {
  let dir;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "bk-teste-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("mantém os mais recentes e não toca em outras pastas", () => {
    const nomes = ["camugere-2026-01-01_10h00", "camugere-2026-01-02_10h00", "camugere-2026-01-02_10h00-2", "camugere-2026-01-03_08h30", "fotos", "camugere-velho"];
    for (const n of nomes) fs.mkdirSync(path.join(dir, n));
    expect(limparAntigos(dir, 2)).toEqual(["camugere-2026-01-01_10h00", "camugere-2026-01-02_10h00"]);
    expect(fs.readdirSync(dir).sort()).toEqual(["camugere-2026-01-02_10h00-2", "camugere-2026-01-03_08h30", "camugere-velho", "fotos"]);
  });

  it("pasta inexistente não é erro", () => {
    expect(limparAntigos(path.join(dir, "nada"), 3)).toEqual([]);
  });

  it("listarBackups: do mais novo para o mais antigo, com o tamanho do .sql", () => {
    fs.mkdirSync(path.join(dir, "camugere-2026-01-01_10h00"));
    fs.writeFileSync(path.join(dir, "camugere-2026-01-01_10h00", "camugere.sql"), "x".repeat(10));
    fs.mkdirSync(path.join(dir, "camugere-2026-01-02_10h00"));
    fs.mkdirSync(path.join(dir, "outra"));
    expect(listarBackups(dir)).toEqual([
      { nome: "camugere-2026-01-02_10h00", bytes: 0 },
      { nome: "camugere-2026-01-01_10h00", bytes: 10 },
    ]);
    expect(listarBackups(path.join(dir, "nada"))).toEqual([]);
  });
});
