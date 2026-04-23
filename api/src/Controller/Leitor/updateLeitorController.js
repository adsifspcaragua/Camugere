import { updateLeitor } from "../../Model/LeitorModel.js";
import { leitorValidator } from "../../Model/LeitorModel.js";
import { validarCPF } from "../../Model/LeitorModel.js";
import { getUsuarioById } from "../../Model/UsuarioModel.js";

export default async function updateLeitorController(req, res) {
    try {
        const { id } = req.params
        const leitor = req.body

        const { success, data, error } = await leitorValidator(leitor)

        if (!success) {
            throw new Error(`Não foi possível validar leitor, ${error}`)
        }

        const cpfValidetor = validarCPF(leitor.cpf)

        if(!cpfValidetor){
            throw new Error(`Não foi possível validar CPF`)
        }

        const result = await updateLeitor(+id, leitor)

        if(!result){
            throw new Error("Não foi possível atualizar Leitor!")
        }

        return res.status(200).json({
            message: "Leitor atualizado com sucesso!",
            data: result
        })

    } catch (error) {
        return res.status(500).json({
            message: "Não foi possível atualizar o leitor!",
            error: error.message
        })
    }
}