import express from "express";
import createLeitorController from "../Controller/Leitor/createLeitorController.js";
import listLeitorController from "../Controller/Leitor/listLeitorController.js";
import getLeitorByIdController from "../Controller/Leitor/getLeitorByIdController.js";
import deleteLeitorController from "../Controller/Leitor/deleteLeitorController.js";

const router = express.Router()

router.post("/create", createLeitorController)
router.get("/list", listLeitorController)
router.get("/get/:id", getLeitorByIdController)
router.delete("/delete/:id", deleteLeitorController)

export default router