import express from "express";
import createBibliotecarioController from "../Controller/Biblliotecario/createBibliotecarioController.js";

const router = express.Router()

router.post("create", createBibliotecarioController)

export default router