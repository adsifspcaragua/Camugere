import { getLeitorById } from "../../Model/LeitorModel.js"
import { listEmprestimosByLeitor } from "../../Model/EmprestimoModel.js"

export default async function listEmprestimoLeitorController(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id))
    return res.status(400).json({ message: "Id do leitor inválido!" })
  try {
    if (!(await getLeitorById(id)))
      return res.status(404).json({ message: "Leitor não encontrado!" })
    return res
      .status(200)
      .json({
        message: "Empréstimos listados com sucesso!",
        data: await listEmprestimosByLeitor(id),
      })
  } catch (error) {
    return res.status(500).json({ message: "Erro!", error: error.message })
  }
}
