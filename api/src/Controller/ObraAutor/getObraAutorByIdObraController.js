import { getObraAutorByIdObra } from "../../Model/ObraAutorModel.js";

export default async function getObraAutorByIdObraController(req, res) {
    try {
        const { id_obra } = req.params

        const result = await getObraAutorByIdObra(+id_autor)
        
        if(!result){
            throw new Error("Não foi possível achat o objeto!")
        }

        return res.status(200).json({
            message: "Objeto achado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
    
}