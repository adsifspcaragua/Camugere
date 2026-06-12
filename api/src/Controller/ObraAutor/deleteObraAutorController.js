import { deleteObraAutor } from "../../Model/ObraAutorModel.js";

export default async function deleteObraAutorController(req, res) {
    try {
        const { id_obra, id_autor } = req.params

        const result = await deleteObraAutor(id_autor, id_obra)

        if(!result){
            throw new Error("Não foi possível achat o objeto!")
        }

        return res.status(200).json({
            message: "Objeto deletado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
    
}