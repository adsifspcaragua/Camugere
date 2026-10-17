import express from "express"
import createBibliotecarioController from "../Controller/Biblliotecario/createBibliotecarioController.js"
import listBibliotecarioController from "../Controller/Biblliotecario/listBibliotecarioController.js"
import getBibliotecarioByIdController from "../Controller/Biblliotecario/getBibliotecarioByIdController.js"
import deleteBibliotecarioController from "../Controller/Biblliotecario/deleteBibliotecarioController.js"
import registerBibliotecarioController from "../Controller/Biblliotecario/registerBibliotecarioController.js"

const router = express.Router()

router.post("/create", createBibliotecarioController)
router.post("/register", registerBibliotecarioController)
router.get("/list", listBibliotecarioController)
router.get("/get/:id", getBibliotecarioByIdController)
router.delete("/delete/:id", deleteBibliotecarioController)

export default router
