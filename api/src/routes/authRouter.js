import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { validateBody } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/auth.js";
import { loginSchema } from "../schemas/usuarioSchema.js";
import * as usuarioService from "../services/usuarioService.js";

const router = express.Router();

router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { token, ...perfil } = await usuarioService.autenticar(req.body);
    // `data` continua sendo o token para manter compatibilidade com clientes antigos.
    res.json({ message: "Login efetuado.", data: token, perfil });
  }),
);

router.post("/validate", (req, res) => ok(res, "Token válido.", usuarioService.validarToken(req.body?.token)));

router.get("/me", authMiddleware, asyncHandler(async (req, res) => ok(res, "Perfil carregado.", await usuarioService.perfil(req.auth))));

export default router;
