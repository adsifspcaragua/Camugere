import express from 'express';
import createEmprestimoController from '../Controller/Emprestimo/createEmprestimoController.js';
import listEmprestimoController from '../Controller/Emprestimo/listEmprestimoController.js';
import getEmprestimoByIdController from '../Controller/Emprestimo/getEmprestimoByIdController.js';
import deleteEmprestimoController from '../Controller/Emprestimo/deleteEmprestimoController.js';
import updateEmprestimoController from '../Controller/Emprestimo/listEmprestimoController.js';
import listEmprestimoAtrasadoController from '../Controller/Emprestimo/listEmprestimoAtrasadoController.js';


const router = express.Router();

router.post('/create', createEmprestimoController)
router.get('/list', listEmprestimoController)
router.get('/list/atrasados', listEmprestimoAtrasadoController)
router.get('/get/:id', getEmprestimoByIdController)
router.delete('/delete/:id', deleteEmprestimoController)
router.put('/update/:id', updateEmprestimoController)

export default router