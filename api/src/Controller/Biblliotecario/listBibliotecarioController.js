import { listBibliotecario } from "../../Model/BibliotecarioModel.js";

export default async function listBibliotecarioController(req, res) {
    try {
        const result = await listBibliotecario()

        if(!result){
            throw new Error("Não foi possível listar os bibliotecarios")
        }

        return res.status(200).json({
            message: "Bibliotecarios listados com sucesso",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
    
}