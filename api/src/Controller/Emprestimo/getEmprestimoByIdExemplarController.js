import { getEmprestimoByIdExemplar } from "../../Model/EmprestimoModel.js";

export default async function getEmprestimoByIdExemplarController(req, res) {
    try {
        const { id } = req.params

        const result = await getEmprestimoByIdExemplar(+id)

        if (!result) {
            throw new Error("Não foi possível encontrar o empréstimo!")
        }

        return res.status(200).json({
            message: "Empréstimo encontrado com sucesso!",
            data: result
        })
    } catch (error) {
        return res.status(500).json({
            message: "Erro!",
            error: error.message
        })
    }
}