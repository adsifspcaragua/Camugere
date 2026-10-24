import { env } from "../config/env.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import dns from "dns/promises";
import net from "net";

export const UPLOADS_DIR = path.resolve("uploads");
export const CAPAS_DIR = path.join(UPLOADS_DIR, "capas");
fs.mkdirSync(CAPAS_DIR, { recursive: true });

export const MAX_CAPA_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 3;
const CAPA_PATH_PREFIX = "/uploads/capas/";

export function gerarNomeArquivo(ext) {
  return `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
}

// Detecta o formato real da imagem pelos primeiros bytes (não confia no Content-Type)
function detectarExtensao(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (buf.subarray(0, 4).toString("ascii") === "GIF8") return ".gif";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  return null;
}

function ipPrivado(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return ipPrivado(v.slice(7));
  return v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

// Proteção contra SSRF: só http/https e apenas hosts que resolvem para IPs públicos
async function validarUrlRemota(urlStr) {
  let url;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error("URL da capa inválida.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("A URL da capa deve ser http ou https.");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const enderecos = net.isIP(host) ? [{ address: host }] : await dns.lookup(host, { all: true });
  if (enderecos.length === 0 || enderecos.some((e) => ipPrivado(e.address))) {
    throw new Error("Endereço da capa não permitido.");
  }
  return url;
}

async function lerCorpoLimitado(response) {
  const declarado = Number(response.headers.get("content-length"));
  if (declarado && declarado > MAX_CAPA_BYTES) throw new Error("Imagem remota maior que 5MB.");

  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > MAX_CAPA_BYTES) throw new Error("Imagem remota maior que 5MB.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Baixa uma imagem remota e salva no Storage local. Retorna o caminho relativo (/uploads/capas/xxx)
export async function baixarCapaRemota(urlStr) {
  let atual = urlStr;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const url = await validarUrlRemota(atual);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "BibliotecaCamugere/1.0", Accept: "image/*" },
    });

    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      atual = new URL(response.headers.get("location"), url).toString();
      continue;
    }
    if (!response.ok) throw new Error(`Não foi possível baixar a capa (HTTP ${response.status}).`);

    const buffer = await lerCorpoLimitado(response);
    const ext = detectarExtensao(buffer);
    if (!ext) throw new Error("O link informado não é uma imagem válida (JPG, PNG, WEBP ou GIF).");

    const nome = gerarNomeArquivo(ext);
    await fs.promises.writeFile(path.join(CAPAS_DIR, nome), buffer);
    return `${CAPA_PATH_PREFIX}${nome}`;
  }
  throw new Error("Redirecionamentos demais ao baixar a capa.");
}

export function urlPublica(req, relativePath) {
  const base = (env.apiPublicUrl || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
  return `${base}${relativePath}`;
}

function ehCapaLocal(urlStr) {
  try {
    const { pathname } = new URL(urlStr);
    if (!pathname.startsWith(CAPA_PATH_PREFIX)) return false;
    const arquivo = path.basename(pathname);
    return fs.existsSync(path.join(CAPAS_DIR, arquivo));
  } catch {
    return false;
  }
}

/**
 * Garante que capaUrl aponte para o nosso Storage.
 * - vazio / já local: mantém
 * - URL remota: baixa, salva e devolve o novo link hospedado aqui
 * Em caso de falha no download, retorna { capaUrl: undefined, aviso }.
 */
export async function internalizarCapa(capaUrl, req) {
  const url = typeof capaUrl === "string" ? capaUrl.trim() : capaUrl;
  if (!url) return { capaUrl: url };
  if (ehCapaLocal(url)) return { capaUrl: url };
  try {
    const rel = await baixarCapaRemota(url);
    return { capaUrl: urlPublica(req, rel) };
  } catch (error) {
    return { capaUrl: undefined, aviso: `Capa não salva: ${error.message}` };
  }
}
