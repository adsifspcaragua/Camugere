import { createObraAutor } from "../../Model/ObraAutorModel.js"

export default async function createObraAutorController(req, res) {
    try {
        const obraAutor = req.body

        const result = await createObraAutor(obraAutor)

        if(!result){
            throw new Error("Não foi possível criar o objeto!")
        }

        return res.status(200).json({
            message: "Objeto criado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}