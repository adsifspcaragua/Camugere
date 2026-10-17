import { getLeitorById } from "../../Model/LeitorModel.js"
import { reativarSuspensaoLeitor } from "../../Model/SuspensaoLeitorModel.js"

export default async function reativarSuspensaoLeitorController(req, res) {
  const id = Number(req.params.id)
  const suspensaoId = Number(req.params.suspensaoId)
  if (!Number.isInteger(id) || !Number.isInteger(suspensaoId))
    return res.status(400).json({ message: "Id inválido!" })

  try {
    if (!(await getLeitorById(id)))
      return res.status(404).json({ message: "Leitor não encontrado!" })
    const result = await reativarSuspensaoLeitor(id, suspensaoId)
    if (!result)
      return res.status(404).json({ message: "Suspensão não encontrada!" })
    return res
      .status(200)
      .json({ message: "Leitor reativado com sucesso!", data: result })
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Não foi possível reativar o leitor!",
        error: error.message,
      })
  }
}
