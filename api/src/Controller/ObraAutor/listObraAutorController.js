import { listObraAutor } from "../../Model/ObraAutorModel.js";

export default async function listObraAutorController(req, res) {
    try {
        const result = await listObraAutor()

        if(!result){
            throw new Error("Não foi listar criar o objeto!")
        }

        return res.status(200).json({
            message: "Objetos listados com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}