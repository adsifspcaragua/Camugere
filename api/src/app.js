import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { authMiddleware } from "./middlewares/auth.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { UPLOADS_DIR } from "./services/capaService.js";
import authRouter from "./routes/authRouter.js";
import uploadRouter from "./routes/uploadRouter.js";
import {
  autorRouter,
  bibliotecarioRouter,
  cddRouter,
  emprestimoRouter,
  exemplarRouter,
  leitorRouter,
  obraAutorRouter,
  obraRouter,
  usuarioRouter,
} from "./routes/index.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

const status = (_req, res) => res.json({ message: "API Biblioteca Camugerê", status: "ok" });
app.get("/status", status);

// Em produção a API também entrega o site (frontend/dist): basta abrir http://localhost:3000.
if (env.frontendDir) app.use(express.static(env.frontendDir, { index: "index.html" }));
else app.get("/", status);

// Rotas públicas
app.use(authRouter);

// Rotas protegidas
app.use(authMiddleware);
app.use("/usuario", usuarioRouter);
app.use("/leitor", leitorRouter);
app.use("/bibliotecario", bibliotecarioRouter);
app.use("/cdd", cddRouter);
app.use("/obra", obraRouter);
app.use("/autor", autorRouter);
app.use("/exemplar", exemplarRouter);
app.use("/emprestimo", emprestimoRouter);
app.use("/obraautor", obraAutorRouter);
app.use("/upload", uploadRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
