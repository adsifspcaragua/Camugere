import express from "express"
import createUsuarioController from "../Controller/Usuario/createUsuarioController.js"

const router = express.Router()

router.get('/create', createUsuarioController)

export default router