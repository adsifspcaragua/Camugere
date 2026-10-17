import { jest } from "@jest/globals"

jest.unstable_mockModule("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}))

const { leitorValidator } = await import("../Model/LeitorModel.js")
const { suspensaoValidator } = await import("../Model/SuspensaoLeitorModel.js")

describe("reader administration validators", () => {
  it("accepts structured address and borrowing status fields", () => {
    const result = leitorValidator({
      cpf: "52998224725",
      cep: "01001000",
      logradouro: "Praça da Sé",
      numero: "1",
      complemento: null,
      bairro: "Sé",
      cidade: "São Paulo",
      estado: "SP",
      podeEmprestar: false,
      suspensoAte: "2026-11-01T00:00:00.000Z",
      motivoSuspensao: "Atraso",
    })

    expect(result.success).toBe(true)
  })

  it("requires a suspension reason", () => {
    expect(suspensaoValidator({ motivo: "" }).success).toBe(false)
    expect(suspensaoValidator({ motivo: "Atrasos recorrentes" }).success).toBe(
      true,
    )
  })
})
