import express from "express"
import listExemplarController from "../Controller/Exemplar/listExemplarController.js"
import listExemplarDisponivelController from "../Controller/Exemplar/listExemplarDisponivelController.js"
import listExemplarIndisponivelController from "../Controller/Exemplar/listExemplarIndisponivelController.js"
import createExemplarController from "../Controller/Exemplar/createExemplarController.js"
import getExemplarByIdController from "../Controller/Exemplar/getExemplarByIdController.js"
import deleteExemplarController from "../Controller/Exemplar/deleteExemplarController.js"
import updateExemplarController from "../Controller/Exemplar/updateExemplarController.js"

const router = express.Router()

router.get("/list", listExemplarController)
router.get("/list/disponivel", listExemplarDisponivelController)
router.get("/list/indisponivel", listExemplarIndisponivelController)
router.post("/create", createExemplarController)
router.get("/get/:id", getExemplarByIdController)
router.delete("/delete/:id", deleteExemplarController)
router.put("/update/:id", updateExemplarController)

export default router