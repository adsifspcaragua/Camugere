import express from "express";
import cors from "cors"
import authenticateUsuarioBibliotecarioController from "./Controller/Usuario/authenticateUsuarioController.js";
import UsuarioRouter from "./Router/UsuarioRouter.js"
import LeitorRouter from "./Router/LeitorRouter.js"
import BibliotecarioRouter from "./Router/BibliotecarioRouter.js"
import CddRouter from "./Router/CddRouter.js"
import ObraRouter from "./Router/ObraRouter.js"
import AutorRouter from "./Router/AutorRouter.js"
import ExemplarRouter from "./Router/ExemplarRouter.js"
import EmprestimoRouter from "./Router/EmprestimoRouter.js"
import ObraAutorRouter from "./Router/ObraAutorRouter.js"
import authMiddleware from "./Middlewares/authMiddleware.js";

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    return res.json({
        message: "Funcionou"
    })
})

app.post("/login", authenticateUsuarioBibliotecarioController)

app.use(authMiddleware)

app.use("/usuario", UsuarioRouter)
app.use("/leitor", LeitorRouter)
app.use("/bibliotecario", BibliotecarioRouter)
app.use("/cdd", CddRouter)
app.use("/obra", ObraRouter)
app.use("/autor", AutorRouter)
app.use("/exemplar", ExemplarRouter)
app.use("/emprestimo", EmprestimoRouter)
app.use("/obraautor", ObraAutorRouter)

export default app;
