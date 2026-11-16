import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// mysqldump simulado: grava o --result-file e termina com o código pedido.
let comportamento;
const spawn = jest.fn((exe, args) => {
  const p = new EventEmitter();
  p.stderr = new EventEmitter();
  setImmediate(() => {
    const opcoes = args.find((a) => a.startsWith("--defaults-extra-file=")).split("=")[1];
    spawn.opcoesLidas = fs.readFileSync(opcoes, "utf8");
    spawn.opcoesPath = opcoes;
    const arquivo = args.find((a) => a.startsWith("--result-file=")).split("=")[1];
    if (comportamento === "erro-exe") return p.emit("error", Object.assign(new Error("spawn ENOENT"), { code: "ENOENT" }));
    if (comportamento === "acesso-negado") {
      p.stderr.emit("data", "mysqldump: Got error: 1045: Access denied");
      return p.emit("close", 2);
    }
    fs.writeFileSync(arquivo, comportamento === "incompleto" ? "CREATE TABLE x;" : "CREATE TABLE x;\n-- Dump completed on 2026-11-15\n");
    p.emit("close", 0);
  });
  return p;
});
jest.unstable_mockModule("node:child_process", () => ({ spawn, spawnSync: jest.fn(() => ({ status: 1 })) }));

const { fazerBackup } = await import("../src/cli/backup.js");

let dir;
const env = (extra = {}) => ({
  DATABASE_URL: 'mysql://camugere:s%22e%5Cnha@localhost:3306/camugere',
  MYSQLDUMP: process.execPath,
  ...extra,
});
const fazer = (extra, pasta = path.join(dir, "backups")) => fazerBackup({ env: env(extra), pastaBase: pasta, log: () => {} });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "bk-fluxo-"));
  comportamento = "ok";
  spawn.mockClear();
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

it("gera o .sql e copia as capas; a senha vai num arquivo temporário que é apagado", async () => {
  const { destino, copia } = await fazer();
  expect(fs.readFileSync(path.join(destino, "camugere.sql"), "utf8")).toMatch(/Dump completed/);
  expect(fs.existsSync(path.join(destino, "uploads"))).toBe(true);
  expect(copia).toBeNull();

  const args = spawn.mock.calls[0][1];
  expect(args.join(" ")).not.toMatch(/nha/);
  expect(args).toEqual(expect.arrayContaining(["--single-transaction", "--no-tablespaces", "camugere"]));
  expect(spawn.opcoesLidas).toContain('password="s\\"e\\\\nha"');
  expect(fs.existsSync(spawn.opcoesPath)).toBe(false);
});

it("dois backups no mesmo minuto não se sobrescrevem e os antigos são apagados", async () => {
  const a = await fazer({ BACKUP_MANTER: "2" });
  const b = await fazer({ BACKUP_MANTER: "2" });
  const c = await fazer({ BACKUP_MANTER: "2" });
  expect(new Set([a.destino, b.destino, c.destino]).size).toBe(3);
  expect(fs.readdirSync(path.join(dir, "backups"))).toHaveLength(2);
});

it("copia para BACKUP_COPIA_PARA e só avisa se o destino não existir", async () => {
  const pendrive = path.join(dir, "pendrive");
  const { copia } = await fazer({ BACKUP_COPIA_PARA: pendrive });
  expect(fs.existsSync(path.join(copia, "camugere.sql"))).toBe(true);

  const log = jest.fn();
  const arquivo = path.join(dir, "arquivo.txt");
  fs.writeFileSync(arquivo, "x");
  const r = await fazerBackup({ env: env({ BACKUP_COPIA_PARA: arquivo }), pastaBase: path.join(dir, "b2"), log });
  expect(r.copia).toBeNull();
  expect(log).toHaveBeenCalledWith(expect.stringMatching(/ATENÇÃO: Não deu para copiar/));
  expect(r.avisoCopia).toMatch(/pen drive está conectado/);
  expect(fs.existsSync(path.join(r.destino, "camugere.sql"))).toBe(true);
});

it.each([
  ["acesso-negado", /código 2.*Access denied/],
  ["incompleto", /incompleto/],
  ["erro-exe", /ENOENT/],
])("falha (%s) explica o motivo e não deixa pasta pela metade", async (caso, msg) => {
  comportamento = caso;
  await expect(fazer()).rejects.toThrow(msg);
  expect(fs.readdirSync(path.join(dir, "backups"))).toEqual([]);
  expect(fs.existsSync(spawn.opcoesPath)).toBe(false);
});
