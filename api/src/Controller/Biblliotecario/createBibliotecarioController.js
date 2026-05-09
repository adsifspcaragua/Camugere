import { createBibliotecario } from "../../Model/BibliotecarioModel.js";
import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function createBibliotecarioController(req, res) {
    try {
        const bibliotecario = req.body
        
        const usuario = await getUsuarioById(bibliotecario.id_usuario)

        if(!usuario){
            throw new Error(`Este usuário não existe!`)
        }

        const result = await createBibliotecario(bibliotecario)

        if(!result){
            throw new Error(`Não foi possível criar o Usuário!`)
        }

        return res.status(200).json({
            message: "Bibliotecário criado com sucesso",
            bibliotecario: result,
            usuario: usuario
        })

    } catch (e) {
        return res.status(500).json({
            message: "Não foi possível criar o Bibliotecário",
            error: e.message
        })
    }
    
}