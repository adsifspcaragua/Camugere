import { createEmprestimo } from "../../Model/EmprestimoModel.js"
import { emprestimoValidator } from "../../Model/EmprestimoModel.js"
import { getExemplarById } from "../../Model/ExemplarModel.js"
import { updateExemplar } from "../../Model/ExemplarModel.js"

export default async function createEmprestimoController(req, res) {
    try {
        const emprestimo = req.body

        const { success, data, error } = emprestimoValidator(emprestimo)

        if (!success) {
            throw new Error("Não foi possível validar o empréstimo!", error)
        }

        const exemplar = await getExemplarById(emprestimo.id_exemplar)

        if(!exemplar){
            throw new Error("O exemplar não existe!")
        }

        if(!exemplar.disponivel){
            throw new Error("O exemplar não está disponível " + exemplar)
        }

        const novoExemplar = exemplar
        novoExemplar.disponivel = false
        
        const changeExemplar = await updateExemplar(exemplar.id, novoExemplar)

        if(!changeExemplar){
            throw new Error("Não foi possível concluir a ação!")
        }

        const result = await createEmprestimo(emprestimo)

        if (!result) {
            throw new Error("Não foi possível criar o empréstimo!")
        }

        return res.status(200).json({
            message: "Empréstimo criado com sucesso!",
            data: {
                emprestimo: result, 
                exemplar: changeExemplar}
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}