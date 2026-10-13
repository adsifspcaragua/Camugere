import express from "express";
import multer from "multer";
import path from "path";
import {
  UPLOADS_DIR,
  CAPAS_DIR,
  MAX_CAPA_BYTES,
  gerarNomeArquivo,
  baixarCapaRemota,
  urlPublica,
} from "../Services/capaService.js";

export { UPLOADS_DIR };

const EXT_POR_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CAPAS_DIR),
  filename: (req, file, cb) => cb(null, gerarNomeArquivo(EXT_POR_MIME[file.mimetype])),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_CAPA_BYTES },
  fileFilter: (req, file, cb) => {
    if (EXT_POR_MIME[file.mimetype]) return cb(null, true);
    cb(new Error("Formato inválido. Use JPG, PNG, WEBP ou GIF."));
  },
});

const router = express.Router();

/**
 * POST /upload/capa
 * - multipart com campo "capa" (arquivo físico), ou
 * - campo/JSON "url" com link remoto (ex.: Brasil API), que é baixado para o Storage.
 * Em ambos os casos devolve o link do nosso Storage.
 */
router.post("/capa", (req, res) => {
  upload.single("capa")(req, res, async (err) => {
    if (err) {
      const message = err.code === "LIMIT_FILE_SIZE" ? "Imagem maior que 5MB." : err.message;
      return res.status(400).json({ message });
    }

    if (req.file) {
      const rel = `/uploads/capas/${path.basename(req.file.filename)}`;
      return res.status(201).json({ path: rel, url: urlPublica(req, rel) });
    }

    const remota = req.body?.url;
    if (!remota) return res.status(400).json({ message: "Envie um arquivo ou uma URL de imagem." });

    try {
      const rel = await baixarCapaRemota(String(remota).trim());
      return res.status(201).json({ path: rel, url: urlPublica(req, rel) });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });
});

export default router;
