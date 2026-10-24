import express from "express";
import { validateBody } from "../middlewares/validate.js";

// Rotas no padrão já usado pelo frontend: /list, /get/:id, /create, /update/:id, /delete/:id
export function crudRouter(controller, { createSchema, updateSchema } = {}) {
  const router = express.Router();
  const validar = (schema) => (schema ? [validateBody(schema)] : []);

  router.get("/list", controller.listar);
  router.get("/get/:id", controller.buscar);
  if (controller.criar) router.post("/create", ...validar(createSchema), controller.criar);
  if (controller.atualizar) router.put("/update/:id", ...validar(updateSchema), controller.atualizar);
  router.delete("/delete/:id", controller.remover);

  return router;
}
