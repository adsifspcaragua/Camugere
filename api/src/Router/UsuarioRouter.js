import express from "express"
import createUsuarioController from "../Controller/Usuario/createUsuarioController.js"
import listUsuarioController from "../Controller/Usuario/listUsuarioController.js"
import getUsuarioByIdController from "../Controller/Usuario/getUsuarioByIdController.js"
import deleteUsuarioController from "../Controller/Usuario/deleteUsuarioController.js"
import updateUsuarioController from "../Controller/Usuario/updateUsuarioController.js"
import authenticateUsuarioBibliotecarioController from "../Controller/Usuario/authenticateUsuarioController.js"

const router = express.Router()

router.post('/create', createUsuarioController)
router.get('/list', listUsuarioController)
router.get('/get/:id', getUsuarioByIdController)
router.delete('/delete/:id', deleteUsuarioController)
router.put('/update/:id', updateUsuarioController)
router.post('/login', authenticateUsuarioBibliotecarioController)

export default router