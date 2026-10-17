import { getLeitorById } from "../../Model/LeitorModel.js"
import {
  createSuspensaoLeitor,
  suspensaoValidator,
} from "../../Model/SuspensaoLeitorModel.js"

export default async function createSuspensaoLeitorController(req, res) {
  const id = Number(req.params.id)
  if (!Number.isInteger(id))
    return res.status(400).json({ message: "Id do leitor inválido!" })

  try {
    if (!(await getLeitorById(id)))
      return res.status(404).json({ message: "Leitor não encontrado!" })
    const validation = suspensaoValidator(req.body)
    if (!validation.success)
      return res
        .status(400)
        .json({
          message: "Dados da suspensão inválidos!",
          error: validation.error.message,
        })

    const result = await createSuspensaoLeitor(
      id,
      validation.data,
      req.authPayload?.id_bibliotecario,
    )
    return res
      .status(201)
      .json({ message: "Leitor suspenso com sucesso!", data: result })
  } catch (error) {
    if (error.code === "ACTIVE_SUSPENSION")
      return res.status(409).json({ message: error.message })
    return res
      .status(500)
      .json({
        message: "Não foi possível suspender o leitor!",
        error: error.message,
      })
  }
}
