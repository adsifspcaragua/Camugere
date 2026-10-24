import express from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/response.js";
import { parseId } from "../utils/params.js";
import { validateBody } from "../middlewares/validate.js";
import { crudController } from "../controllers/crudController.js";
import { crudRouter } from "./crudRouter.js";

import * as usuarioService from "../services/usuarioService.js";
import * as leitorService from "../services/leitorService.js";
import * as bibliotecarioService from "../services/bibliotecarioService.js";
import * as autorService from "../services/autorService.js";
import * as cddService from "../services/cddService.js";
import * as obraService from "../services/obraService.js";
import * as exemplarService from "../services/exemplarService.js";
import * as emprestimoService from "../services/emprestimoService.js";
import * as obraAutorService from "../services/obraAutorService.js";
import * as suspensaoService from "../services/suspensaoService.js";
import * as lembreteService from "../services/lembreteService.js";
import { internalizarCapa } from "../services/capaService.js";

import { createUsuarioSchema, updateUsuarioSchema } from "../schemas/usuarioSchema.js";
import { createLeitorSchema, suspensaoSchema, updateLeitorSchema } from "../schemas/leitorSchema.js";
import { autorSchema, updateAutorSchema } from "../schemas/autorSchema.js";
import { createCddSchema, updateCddSchema } from "../schemas/cddSchema.js";
import { createObraSchema, updateObraSchema } from "../schemas/obraSchema.js";
import { createExemplarSchema, updateExemplarSchema } from "../schemas/exemplarSchema.js";
import { createEmprestimoSchema, renovarEmprestimoSchema, updateEmprestimoSchema } from "../schemas/emprestimoSchema.js";
import { bibliotecarioSchema, obraAutorSchema } from "../schemas/vinculoSchema.js";

const asText = (value) => String(value);

// ---------- CRUDs simples ----------
export const usuarioRouter = crudRouter(crudController(usuarioService, { singular: "Usuário", plural: "Usuários" }), {
  createSchema: createUsuarioSchema,
  updateSchema: updateUsuarioSchema,
});

export const leitorRouter = crudRouter(crudController(leitorService, { singular: "Leitor", plural: "Leitores" }), {
  createSchema: createLeitorSchema,
  updateSchema: updateLeitorSchema,
});
leitorRouter.get(
  "/:id/emprestimos",
  asyncHandler(async (req, res) => ok(res, "Histórico de empréstimos.", await leitorService.historicoEmprestimos(parseId(req.params.id)))),
);
leitorRouter.get(
  "/:id/suspensoes",
  asyncHandler(async (req, res) => ok(res, "Histórico de suspensões.", await suspensaoService.listarPorLeitor(parseId(req.params.id)))),
);
leitorRouter.post(
  "/:id/suspender",
  validateBody(suspensaoSchema),
  asyncHandler(async (req, res) =>
    created(res, "Leitor suspenso.", await suspensaoService.suspender(parseId(req.params.id), req.body, req.auth.id_bibliotecario)),
  ),
);
leitorRouter.patch(
  "/suspensao/:id/encerrar",
  asyncHandler(async (req, res) => ok(res, "Suspensão encerrada.", await suspensaoService.encerrar(parseId(req.params.id)))),
);

const bibliotecarioController = crudController(bibliotecarioService, { singular: "Bibliotecário", plural: "Bibliotecários" });
delete bibliotecarioController.atualizar;
bibliotecarioController.remover = asyncHandler(async (req, res) =>
  ok(res, "Bibliotecário removido.", await bibliotecarioService.remover(parseId(req.params.id), req.auth)),
);
export const bibliotecarioRouter = crudRouter(bibliotecarioController, { createSchema: bibliotecarioSchema });
bibliotecarioRouter.post(
  "/cadastrar",
  validateBody(createUsuarioSchema),
  asyncHandler(async (req, res) => created(res, "Bibliotecário cadastrado.", await bibliotecarioService.cadastrar(req.body))),
);

export const autorRouter = crudRouter(crudController(autorService, { singular: "Autor", plural: "Autores" }), {
  createSchema: autorSchema,
  updateSchema: updateAutorSchema,
});

export const cddRouter = crudRouter(crudController(cddService, { singular: "CDD", plural: "CDDs", parse: asText }), {
  createSchema: createCddSchema,
  updateSchema: updateCddSchema,
});

// ---------- Obra (internaliza a capa remota antes de salvar) ----------
const obraController = crudController(obraService, { singular: "Obra", plural: "Obras", feminino: true });

async function comCapaInternalizada(req) {
  if (req.body.capaUrl === undefined) return {};
  const { capaUrl, aviso } = await internalizarCapa(req.body.capaUrl, req);
  if (capaUrl === undefined) delete req.body.capaUrl; // download falhou: mantém a capa atual
  else req.body.capaUrl = capaUrl;
  return aviso ? { aviso } : {};
}

obraController.criar = asyncHandler(async (req, res) => {
  const extra = await comCapaInternalizada(req);
  res.status(201).json({ message: "Obra criada.", ...extra, data: await obraService.criar(req.body) });
});
obraController.atualizar = asyncHandler(async (req, res) => {
  const extra = await comCapaInternalizada(req);
  const data = await obraService.atualizar(parseId(req.params.id), req.body);
  res.json({ message: "Obra atualizada.", ...extra, data });
});

export const obraRouter = crudRouter(obraController, { createSchema: createObraSchema, updateSchema: updateObraSchema });

// ---------- Exemplar ----------
const exemplarController = crudController(exemplarService, { singular: "Exemplar", plural: "Exemplares" });
export const exemplarRouter = crudRouter(exemplarController, {
  createSchema: createExemplarSchema,
  updateSchema: updateExemplarSchema,
});
exemplarRouter.get("/list/disponivel", asyncHandler(async (_req, res) => ok(res, "Exemplares disponíveis.", await exemplarService.listar({ disponivel: true }))));
exemplarRouter.get("/list/indisponivel", asyncHandler(async (_req, res) => ok(res, "Exemplares emprestados.", await exemplarService.listar({ disponivel: false }))));

// ---------- Empréstimo ----------
const emprestimoController = crudController(emprestimoService, { singular: "Empréstimo", plural: "Empréstimos" });
export const emprestimoRouter = crudRouter(emprestimoController, {
  createSchema: createEmprestimoSchema,
  updateSchema: updateEmprestimoSchema,
});

const devolver = asyncHandler(async (req, res) =>
  ok(res, "Devolução registrada.", await emprestimoService.registrarDevolucao(parseId(req.params.id))),
);

emprestimoRouter.get("/list/ativos", asyncHandler(async (_req, res) => ok(res, "Empréstimos ativos.", await emprestimoService.listarAtivos())));
emprestimoRouter.get("/list/atrasados", asyncHandler(async (_req, res) => ok(res, "Empréstimos atrasados.", await emprestimoService.listarAtrasados())));
emprestimoRouter.get(
  "/getbyexemplar/:id",
  asyncHandler(async (req, res) => ok(res, "Empréstimo encontrado.", await emprestimoService.buscarAtivoPorExemplar(parseId(req.params.id)))),
);
emprestimoRouter.get(
  "/lembretes",
  asyncHandler(async (_req, res) => {
    const pendentes = await lembreteService.listarPendentes();
    ok(res, "Lembretes pendentes.", { diasAntes: lembreteService.DIAS_ANTES, automatico: process.env.LEMBRETES_AUTOMATICOS !== "false", pendentes: pendentes.length });
  }),
);
emprestimoRouter.post("/lembretes/enviar", asyncHandler(async (_req, res) => ok(res, "Lembretes processados.", await lembreteService.enviarLembretes())));
emprestimoRouter.patch("/devolver/:id", devolver);
emprestimoRouter.patch(
  "/desfazer-devolucao/:id",
  asyncHandler(async (req, res) => ok(res, "Devolução desfeita.", await emprestimoService.desfazerDevolucao(parseId(req.params.id)))),
);
emprestimoRouter.patch("/change-status-devolucao/:id", devolver); // rota legada
emprestimoRouter.patch(
  "/renovar/:id",
  validateBody(renovarEmprestimoSchema),
  asyncHandler(async (req, res) => ok(res, "Empréstimo renovado.", await emprestimoService.renovar(parseId(req.params.id), req.body.dias))),
);

// ---------- Obra x Autor ----------
export const obraAutorRouter = express.Router();
obraAutorRouter.get("/list", asyncHandler(async (_req, res) => ok(res, "Vínculos listados.", await obraAutorService.listar())));
obraAutorRouter.get(
  "/getbyid/obra/:id_obra",
  asyncHandler(async (req, res) => ok(res, "Vínculos da obra.", await obraAutorService.listarPorObra(parseId(req.params.id_obra, "id_obra")))),
);
obraAutorRouter.get(
  "/getbyid/autor/:id_autor",
  asyncHandler(async (req, res) => ok(res, "Vínculos do autor.", await obraAutorService.listarPorAutor(parseId(req.params.id_autor, "id_autor")))),
);
obraAutorRouter.post(
  "/create",
  validateBody(obraAutorSchema),
  asyncHandler(async (req, res) => created(res, "Vínculo criado.", await obraAutorService.criar(req.body))),
);
obraAutorRouter.delete(
  "/delete/:id_obra/:id_autor",
  asyncHandler(async (req, res) =>
    ok(res, "Vínculo removido.", await obraAutorService.remover(parseId(req.params.id_obra, "id_obra"), parseId(req.params.id_autor, "id_autor"))),
  ),
);
