// Cópia de segurança: banco (mysqldump) + capas enviadas (api/uploads).
// Uso: backup-camugere.bat na pasta raiz, ou "npm run backup" na pasta api.
// Opcional no api/.env:
//   BACKUP_COPIA_PARA  pasta extra que recebe uma cópia (pen drive, Google Drive etc.)
//   BACKUP_MANTER      quantos backups guardar na pasta backups (padrão 10)
//   MYSQLDUMP          caminho do mysqldump.exe, se não for encontrado sozinho
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import dotenv from "dotenv";

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PREFIXO = "camugere-";
const NOME = /^camugere-\d{4}-\d{2}-\d{2}_\d{2}h\d{2}(-\d+)?$/;

export function lerConexao(databaseUrl) {
  if (!databaseUrl) throw new Error("DATABASE_URL não está definida no api/.env.");
  const url = new URL(databaseUrl);
  if (!url.protocol.startsWith("mysql")) throw new Error("DATABASE_URL não é um endereço MySQL.");
  const banco = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!banco) throw new Error("DATABASE_URL não informa o nome do banco.");
  return {
    host: url.hostname || "localhost",
    porta: Number(url.port || 3306),
    usuario: decodeURIComponent(url.username),
    senha: decodeURIComponent(url.password),
    banco,
  };
}

export function nomeDoBackup(data = new Date()) {
  const d = (n) => String(n).padStart(2, "0");
  return `${PREFIXO}${data.getFullYear()}-${d(data.getMonth() + 1)}-${d(data.getDate())}_${d(data.getHours())}h${d(data.getMinutes())}`;
}

// O instalador do MySQL no Windows não coloca o mysqldump no PATH: procura nas pastas padrão.
export function acharMysqldump({ env = process.env, existe = fs.existsSync, listar = listarPasta, noPath = estaNoPath } = {}) {
  if (env.MYSQLDUMP) {
    if (existe(env.MYSQLDUMP)) return env.MYSQLDUMP;
    throw new Error(`MYSQLDUMP aponta para um arquivo que não existe: ${env.MYSQLDUMP}`);
  }
  if (noPath("mysqldump")) return "mysqldump";
  const raizes = [env.ProgramFiles, env["ProgramFiles(x86)"], "C:\\Program Files", "C:\\Program Files (x86)"].filter(Boolean);
  for (const raiz of [...new Set(raizes)]) {
    const mysql = path.join(raiz, "MySQL");
    const servidores = listar(mysql)
      .filter((n) => /^MySQL Server /i.test(n))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const s of servidores) {
      const exe = path.join(mysql, s, "bin", "mysqldump.exe");
      if (existe(exe)) return exe;
    }
  }
  throw new Error("mysqldump não encontrado. Informe o caminho em MYSQLDUMP no api/.env (ex.: C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe).");
}

function listarPasta(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function estaNoPath(cmd) {
  const r = spawnSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
  return r.status === 0;
}

// Apaga os backups mais antigos da pasta, mantendo os "manter" mais recentes. Só mexe em pastas com o nome do backup.
export function limparAntigos(pasta, manter) {
  const backups = listarPasta(pasta).filter((n) => NOME.test(n)).sort();
  const apagar = backups.slice(0, Math.max(0, backups.length - manter));
  for (const n of apagar) fs.rmSync(path.join(pasta, n), { recursive: true, force: true });
  return apagar;
}

function pastaLivre(base, nome) {
  let destino = path.join(base, nome);
  for (let i = 2; fs.existsSync(destino); i++) destino = path.join(base, `${nome}-${i}`);
  return destino;
}

function rodarMysqldump(exe, conexao, arquivoSql) {
  // A senha vai num arquivo temporário (só deste usuário), e não na linha de comando.
  const opcoes = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "camugere-")), "my.cnf");
  const aspas = (v) => `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  fs.writeFileSync(
    opcoes,
    `[client]\nuser=${aspas(conexao.usuario)}\npassword=${aspas(conexao.senha)}\nhost=${aspas(conexao.host)}\nport=${conexao.porta}\n`,
    { mode: 0o600 },
  );
  const args = [
    `--defaults-extra-file=${opcoes}`,
    "--single-transaction",
    "--no-tablespaces",
    "--routines",
    "--triggers",
    "--default-character-set=utf8mb4",
    `--result-file=${arquivoSql}`,
    conexao.banco,
  ];
  return new Promise((resolve, reject) => {
    let erro = "";
    const p = spawn(exe, args, { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
    p.stderr.on("data", (d) => (erro += d));
    p.on("error", reject);
    p.on("close", (codigo) => {
      fs.rmSync(path.dirname(opcoes), { recursive: true, force: true });
      if (codigo === 0) resolve();
      else reject(new Error(`mysqldump falhou (código ${codigo}): ${erro.trim() || "sem detalhes"}`));
    });
  });
}

function tamanho(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export async function fazerBackup({ env = process.env, pastaBase = path.resolve(API_DIR, "../backups"), log = console.log } = {}) {
  const conexao = lerConexao(env.DATABASE_URL);
  const exe = acharMysqldump({ env });
  fs.mkdirSync(pastaBase, { recursive: true });
  const destino = pastaLivre(pastaBase, nomeDoBackup());
  fs.mkdirSync(destino);

  try {
    log("Copiando o banco de dados...");
    const sql = path.join(destino, `${conexao.banco}.sql`);
    await rodarMysqldump(exe, conexao, sql);
    if (!/-- Dump completed/.test(fs.readFileSync(sql, "utf8").slice(-300))) throw new Error("o arquivo do banco ficou incompleto.");
    log(`  ok: ${path.basename(sql)} (${tamanho(fs.statSync(sql).size)})`);

    const uploads = path.join(API_DIR, "uploads");
    if (fs.existsSync(uploads)) {
      log("Copiando as capas...");
      fs.cpSync(uploads, path.join(destino, "uploads"), { recursive: true });
      log("  ok: uploads");
    }
  } catch (e) {
    fs.rmSync(destino, { recursive: true, force: true });
    throw e;
  }

  const manter = Math.max(1, Number(env.BACKUP_MANTER) || 10);
  const apagados = limparAntigos(pastaBase, manter);
  if (apagados.length) log(`Backups antigos apagados (mantendo os ${manter} mais recentes): ${apagados.length}`);

  let copia = null;
  if (env.BACKUP_COPIA_PARA) {
    try {
      copia = path.join(env.BACKUP_COPIA_PARA, path.basename(destino));
      fs.cpSync(destino, copia, { recursive: true });
      log(`Cópia extra em: ${copia}`);
    } catch (e) {
      copia = null;
      log(`ATENÇÃO: não deu para copiar para ${env.BACKUP_COPIA_PARA} (${e.code || e.message}). O pen drive está conectado?`);
    }
  }
  return { destino, copia };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  dotenv.config({ path: path.join(API_DIR, ".env"), quiet: true });
  fazerBackup()
    .then(({ destino, copia }) => {
      console.log(`\nBackup concluído em:\n  ${destino}`);
      if (!copia) console.log("\nLembre de copiar essa pasta para fora deste computador (pen drive ou nuvem).");
    })
    .catch((e) => {
      console.error(`\nO backup NÃO foi feito: ${e.message}`);
      process.exitCode = 1;
    });
}
