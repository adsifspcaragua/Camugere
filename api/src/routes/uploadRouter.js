import express from "express";
import multer from "multer";
import path from "path";
import { asyncHandler } from "../utils/asyncHandler.js";
import { badRequest } from "../lib/httpError.js";
import { CAPAS_DIR, MAX_CAPA_BYTES, baixarCapaRemota, gerarNomeArquivo, urlPublica } from "../services/capaService.js";

const EXTENSAO_POR_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, CAPAS_DIR),
    filename: (_req, file, cb) => cb(null, gerarNomeArquivo(EXTENSAO_POR_MIME[file.mimetype])),
  }),
  limits: { fileSize: MAX_CAPA_BYTES },
  fileFilter: (_req, file, cb) =>
    EXTENSAO_POR_MIME[file.mimetype] ? cb(null, true) : cb(badRequest("Formato inválido. Use JPG, PNG, WEBP ou GIF.")),
});

function receberArquivo(req, res, next) {
  upload.single("capa")(req, res, (error) => {
    if (error?.code === "LIMIT_FILE_SIZE") return next(badRequest("Imagem maior que 5MB."));
    next(error);
  });
}

const router = express.Router();

/**
 * POST /upload/capa
 * Aceita um arquivo (multipart, campo "capa") ou uma URL remota (campo "url"),
 * e devolve o link da imagem hospedada no próprio servidor.
 */
router.post(
  "/capa",
  receberArquivo,
  asyncHandler(async (req, res) => {
    let caminho;
    if (req.file) {
      caminho = `/uploads/capas/${path.basename(req.file.filename)}`;
    } else if (req.body?.url) {
      try {
        caminho = await baixarCapaRemota(String(req.body.url).trim());
      } catch (error) {
        throw badRequest(error.message);
      }
    } else {
      throw badRequest("Envie um arquivo ou uma URL de imagem.");
    }
    res.status(201).json({ message: "Capa salva.", path: caminho, url: urlPublica(req, caminho) });
  }),
);

export default router;
