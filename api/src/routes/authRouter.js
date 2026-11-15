import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/response.js";
import { validateBody } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/auth.js";
import { rateLimit } from "../middlewares/rateLimit.js";
import {
  alterarSenhaSchema,
  esqueciSenhaSchema,
  loginSchema,
  primeiroAcessoSchema,
  redefinirSenhaSchema,
  tokenRedefinicaoSchema,
} from "../schemas/usuarioSchema.js";
import * as usuarioService from "../services/usuarioService.js";
import * as acessoService from "../services/acessoService.js";

const router = express.Router();
const QUINZE_MIN = 15 * 60 * 1000;

router.post(
  "/login",
  rateLimit({ max: 10, janelaMs: QUINZE_MIN, apenasFalhas: true }),
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { token, ...perfil } = await usuarioService.autenticar(req.body);
    // `data` continua sendo o token para manter compatibilidade com clientes antigos.
    res.json({ message: "Login efetuado.", data: token, perfil });
  }),
);

router.post("/validate", (req, res) => ok(res, "Token válido.", usuarioService.validarToken(req.body?.token)));

router.get("/me", authMiddleware, asyncHandler(async (req, res) => ok(res, "Perfil carregado.", await usuarioService.perfil(req.auth))));

// ---------- Primeiro acesso (sistema sem nenhum bibliotecário) ----------
router.get(
  "/primeiro-acesso",
  asyncHandler(async (_req, res) => ok(res, "Situação do primeiro acesso.", { necessario: await acessoService.precisaPrimeiroAcesso() })),
);
router.post(
  "/primeiro-acesso",
  rateLimit({ max: 10, janelaMs: QUINZE_MIN }),
  validateBody(primeiroAcessoSchema),
  asyncHandler(async (req, res) => created(res, "Primeiro acesso configurado.", await acessoService.configurarPrimeiroAcesso(req.body))),
);

// ---------- Senha ----------
router.patch(
  "/me/senha",
  authMiddleware,
  validateBody(alterarSenhaSchema),
  asyncHandler(async (req, res) => ok(res, "Senha alterada.", await acessoService.alterarPropriaSenha(req.auth, req.body))),
);
router.post(
  "/senha/esqueci",
  rateLimit({ max: 5, janelaMs: QUINZE_MIN }),
  validateBody(esqueciSenhaSchema),
  asyncHandler(async (req, res) =>
    ok(res, "Se o e-mail tiver acesso ao sistema, enviaremos um link para criar uma nova senha.", await acessoService.solicitarRedefinicao(req.body)),
  ),
);
router.post(
  "/senha/validar-link",
  rateLimit({ max: 30, janelaMs: QUINZE_MIN }),
  validateBody(tokenRedefinicaoSchema),
  asyncHandler(async (req, res) => ok(res, "Situação do link.", await acessoService.validarLink(req.body.token))),
);
router.post(
  "/senha/redefinir",
  rateLimit({ max: 10, janelaMs: QUINZE_MIN }),
  validateBody(redefinirSenhaSchema),
  asyncHandler(async (req, res) => ok(res, "Senha redefinida.", await acessoService.redefinirComLink(req.body))),
);

export default router;
