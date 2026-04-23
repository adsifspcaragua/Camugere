import express from "express";
import cors from "cors"
import UsuarioRouter from "./Router/UsuarioRouter.js"
import LeitorRouter from "./Router/LeitorRouter.js"

const app = express()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    return res.json({
        message: "Funcionou"
    })
})


app.listen(3000, () => {
    console.log('Servirdor Rodando no http://localhost:3000')
})

app.use("/usuario", UsuarioRouter)
app.use("/leitor", LeitorRouter)