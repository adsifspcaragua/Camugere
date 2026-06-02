import express from "express";
import listCddController from "../Controller/Cdd/listCddController.js";
import createCddController from "../Controller/Cdd/createCddController.js";
import getCddByIdController from "../Controller/Cdd/getCddByIdController.js";
import deleteCddController from "../Controller/Cdd/deleteCddController.js";
import updateCddController from "../Controller/Cdd/updateCddController.js";

const router = express.Router();

router.get("/list", listCddController)
router.post("/create", createCddController)
router.get("/get/:id", getCddByIdController)
router.delete("/delete/:id", deleteCddController)
router.put("/update/:id", updateCddController)

export default router;