import express from 'express';
import createAutorController from '../Controller/Autor/createAutorController.js';
import listAutorController from '../Controller/Autor/listAutorController.js';
import getAutorByIdController from '../Controller/Autor/getAutorByIdController.js';
import deleteAutorController from '../Controller/Autor/deleteAutorController.js';
import updateAutorController from '../Controller/Autor/updateAutorController.js';

const router = express.Router()

router.post('/create', createAutorController)
router.get('/list', listAutorController)
router.get('/get/:id', getAutorByIdController)
router.delete('/delete/:id', deleteAutorController)
router.put('/update/:id', updateAutorController)

export default router