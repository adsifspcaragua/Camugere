import e from "cors";
import createBibliotecarioController from "../Controller/Biblliotecario/createBibliotecarioController";

const router = e.Router()

router.post("create", createBibliotecarioController)

export default router