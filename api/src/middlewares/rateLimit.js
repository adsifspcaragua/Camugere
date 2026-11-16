import { HttpError } from "../lib/httpError.js";

/**
 * Limite simples por IP, em memória (um único servidor na biblioteca).
 * Protege as rotas públicas sensíveis contra tentativas em massa.
 * `apenasFalhas`: só conta respostas de erro (ex.: senha errada no login).
 */
export function rateLimit({ max, janelaMs, apenasFalhas = false, mensagem = "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo." }) {
  const acessos = new Map();
  const recentes = (chave, agora) => (acessos.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  const registrar = (chave) => {
    const agora = Date.now();
    acessos.set(chave, [...recentes(chave, agora), agora]);
    if (acessos.size > 10_000) acessos.clear();
  };

  return (req, res, next) => {
    const chave = req.ip;
    if (recentes(chave, Date.now()).length >= max) return next(new HttpError(429, mensagem));
    if (apenasFalhas) res.on("finish", () => res.statusCode >= 400 && registrar(chave));
    else registrar(chave);
    next();
  };
}
