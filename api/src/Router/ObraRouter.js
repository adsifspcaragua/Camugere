import express from 'express';
import createObraController from '../Controller/Obra/createObraController.js';
import listObraController from '../Controller/Obra/listObraController.js';
import getObraByIdObraController from '../Controller/Obra/getObraByIdController.js';
import deleteObraController from '../Controller/Obra/deleteObraController.js';
import updateObraController from '../Controller/Obra/updateObraController.js';

const router = express.Router()

router.post('/create', createObraController)
router.get('/list', listObraController)
router.get('/get/:id', getObraByIdObraController)
router.delete('/delete/:id', deleteObraController)
router.put('/update/:id', updateObraController)

export default router