import express from "express";
import createLeitorController from "../Controller/Leitor/createLeitorController.js";

const router = express.Router()

router.post("/create", createLeitorController)

export default router