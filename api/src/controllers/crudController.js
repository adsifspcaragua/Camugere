import { asyncHandler } from "../utils/asyncHandler.js";
import { created, ok } from "../utils/response.js";
import { parseId } from "../utils/params.js";

/**
 * Gera os handlers CRUD padrão para um service com a interface
 * { listar, buscarPorId, criar, atualizar, remover }.
 * `parse` converte o parâmetro de rota (ids numéricos por padrão).
 */
export function crudController(service, { singular, plural, feminino = false, parse = parseId }) {
  const sufixo = feminino ? "a" : "o";

  return {
    listar: asyncHandler(async (_req, res) => ok(res, `${plural} listad${sufixo}s.`, await service.listar())),

    buscar: asyncHandler(async (req, res) =>
      ok(res, `${singular} encontrad${sufixo}.`, await service.buscarPorId(parse(req.params.id))),
    ),

    criar: asyncHandler(async (req, res) => created(res, `${singular} criad${sufixo}.`, await service.criar(req.body))),

    atualizar: asyncHandler(async (req, res) =>
      ok(res, `${singular} atualizad${sufixo}.`, await service.atualizar(parse(req.params.id), req.body)),
    ),

    remover: asyncHandler(async (req, res) =>
      ok(res, `${singular} removid${sufixo}.`, await service.remover(parse(req.params.id))),
    ),
  };
}
