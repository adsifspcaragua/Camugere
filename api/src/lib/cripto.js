// Cifra segredos guardados no banco (ex.: senha do e-mail) com AES-256-GCM.
// A chave deriva do JWT_SECRET deste computador: sem ele, o valor no banco não serve para nada.
import crypto from "node:crypto";
import { env } from "../config/env.js";

const chave = () => crypto.createHash("sha256").update(`camugere:segredos:${env.jwtSecret}`).digest();

export function cifrar(texto) {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv("aes-256-gcm", chave(), iv);
  const dados = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  return [iv, cifra.getAuthTag(), dados].map((b) => b.toString("base64")).join(".");
}

/** Devolve o texto original, ou null se o valor foi adulterado ou cifrado com outra chave. */
export function decifrar(valor) {
  try {
    const [iv, tag, dados] = String(valor).split(".").map((p) => Buffer.from(p, "base64"));
    const decifra = crypto.createDecipheriv("aes-256-gcm", chave(), iv);
    decifra.setAuthTag(tag);
    return Buffer.concat([decifra.update(dados), decifra.final()]).toString("utf8");
  } catch {
    return null;
  }
}
