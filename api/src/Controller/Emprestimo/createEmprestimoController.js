import { createEmprestimo } from "../../Model/EmprestimoModel.js"
import { emprestimoValidator } from "../../Model/EmprestimoModel.js"
import { getExemplarById } from "../../Model/ExemplarModel.js"
import { updateExemplar } from "../../Model/ExemplarModel.js"
import { enviarEmailEmprestimo } from "../../Services/emailService.js"
import { getLeitorById, updateLeitor } from "../../Model/LeitorModel.js"

export default async function createEmprestimoController(req, res) {
  try {
    const emprestimo = req.body

    const { success, data, error } = emprestimoValidator(emprestimo)

    if (!success) {
      throw new Error("Não foi possível validar o empréstimo!", error)
    }

    const leitor = await getLeitorById(+emprestimo.id_leitor)

    if (!leitor) {
      return res.status(404).json({
        message: "Leitor não encontrado!",
      })
    }

    const suspensaoExpirada =
      leitor.suspensoAte && new Date(leitor.suspensoAte) <= new Date()
    if (!leitor.podeEmprestar && !suspensaoExpirada) {
      return res.status(409).json({
        message: "Leitor não pode realizar empréstimos!",
        motivo: leitor.motivoSuspensao || null,
        suspensoAte: leitor.suspensoAte || null,
      })
    }

    if (suspensaoExpirada) {
      await updateLeitor(
        {
          podeEmprestar: true,
          suspensoAte: null,
          motivoSuspensao: null,
        },
        leitor.id,
      )
    }

    const exemplar = await getExemplarById(emprestimo.id_exemplar)

    if (!exemplar) {
      throw new Error("O exemplar não existe!")
    }

    if (!exemplar.disponivel) {
      throw new Error("O exemplar não está disponível")
    }

    const changeExemplar = await updateExemplar(exemplar.id, {
      disponivel: false,
    })

    if (!changeExemplar) {
      throw new Error("Não foi possível concluir a ação!")
    }

    const result = await createEmprestimo(emprestimo)

    if (!result) {
      throw new Error("Não foi possível criar o empréstimo!")
    }

    // Envia notificação por e-mail apenas se o bibliotecário optou por enviar
    let emailInfo = null
    if (emprestimo.enviarNotificacao !== false) {
      try {
        emailInfo = await enviarEmailEmprestimo(result)
      } catch (emailErr) {
        console.error(
          "Aviso: falha ao enviar e-mail de notificação do empréstimo:",
          emailErr.message,
        )
        emailInfo = {
          enviado: false,
          emailDestino: result?.leitor?.usuario?.email || null,
          erro: emailErr.message,
        }
      }
    } else {
      emailInfo = {
        enviado: false,
        desativadoPeloBibliotecario: true,
      }
    }

    return res.status(200).json({
      message: "Empréstimo criado com sucesso!",
      data: {
        emprestimo: result,
        exemplar: changeExemplar,
        emailNotification: emailInfo,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: "Erro!",
      error: error.message,
    })
  }
}
