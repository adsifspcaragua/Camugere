import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../lib/httpError.js";

export function extractToken(req) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return req.headers.jwt_token; // compatibilidade com clientes antigos
}

export function authMiddleware(req, _res, next) {
  const token = extractToken(req);
  if (!token) return next(unauthorized("Token de autenticação não informado."));

  try {
    req.auth = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(unauthorized("Token inválido ou expirado."));
  }
}
