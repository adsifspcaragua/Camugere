import { createLeitor } from "../../Model/LeitorModel.js";
import { leitorValidator } from "../../Model/LeitorModel.js";
import { validarCPF } from "../../Model/LeitorModel.js";
import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function createLeitorController(req, res) {
    try {
        const leitor = req.body
        const { success, data, error } = await leitorValidator(leitor)

        if (!success) {
            throw new Error(`Não foi possível validar leitor, ${error}`)
        }

        // const usuario = await getUsuarioById(leitor.id_usuario)

        // if(!usuario){
        //     throw new Error(`Este usuário não existe!`)
        // }

        const cpfValidetor = validarCPF(leitor.cpf)

        if(!cpfValidetor){
            throw new Error(`Não foi possível validar CPF`)
        }

        const result = await createLeitor(leitor)

        if(!result){
            throw new Error("Não foi possível criar Leitor!")
        }

        return res.status(200).json({
            message: "Leitor criado com sucesso!",
            data: result
        })

    } catch (e) {
        return res.status(500).json({
            message: "Não foi possível criar o leitor!",
            error: e.message
        })
    }
}