import express from "express"
import createLeitorController from "../Controller/Leitor/createLeitorController.js"
import listLeitorController from "../Controller/Leitor/listLeitorController.js"
import getLeitorByIdController from "../Controller/Leitor/getLeitorByIdController.js"
import deleteLeitorController from "../Controller/Leitor/deleteLeitorController.js"
import updateLeitorController from "../Controller/Leitor/updateLeitorController.js"
import listSuspensoesLeitorController from "../Controller/Leitor/listSuspensoesLeitorController.js"
import createSuspensaoLeitorController from "../Controller/Leitor/createSuspensaoLeitorController.js"
import reativarSuspensaoLeitorController from "../Controller/Leitor/reativarSuspensaoLeitorController.js"

const router = express.Router()

router.post("/create", createLeitorController)
router.get("/list", listLeitorController)
router.get("/get/:id", getLeitorByIdController)
router.put("/update/:id", updateLeitorController)
router.delete("/delete/:id", deleteLeitorController)
router.get("/:id/suspensoes", listSuspensoesLeitorController)
router.post("/:id/suspensoes", createSuspensaoLeitorController)
router.patch(
  "/:id/suspensoes/:suspensaoId/reativar",
  reativarSuspensaoLeitorController,
)

export default router
