import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JEST_WORKER_ID ? "test-secret" : required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  corsOrigin: process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || "*",
  apiPublicUrl: process.env.API_PUBLIC_URL,
  // Endereço que a equipe abre no navegador; usado no link de "esqueci minha senha".
  appUrl: (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ""),
  // Site compilado (frontend/dist) servido pela própria API: um só programa e um só endereço.
  frontendDir: process.env.JEST_WORKER_ID ? null : pastaFrontend(),
};

function pastaFrontend() {
  const dir = path.resolve(API_DIR, process.env.FRONTEND_DIR || "../frontend/dist");
  return fs.existsSync(path.join(dir, "index.html")) ? dir : null;
}
