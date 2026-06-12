import express from 'express'
import createObraAutorController from '../Controller/ObraAutor/createObraAutorController.js'
import listObraAutorController from '../Controller/ObraAutor/listObraAutorController.js'
import getObraAutorByIdAutorController from '../Controller/ObraAutor/getObraAutorByIdAutorController.js'
import getObraAutorByIdObraController from '../Controller/ObraAutor/getObraAutorByIdObraController.js'
import deleteObraAutorController from '../Controller/ObraAutor/deleteObraAutorController.js'

const router = express.Router()

router.post('/create', createObraAutorController)
router.get('/list', listObraAutorController)
router.get('/getbyid/autor/:id_autor', getObraAutorByIdAutorController)
router.get('/getbyid/obra/:id_obra', getObraAutorByIdObraController)
router.delete('/delete', deleteObraAutorController)

export default router