import { render, screen, fireEvent } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import LeitorDrawer from "../components/LeitorDrawer"

test("submits structured address fields with reader data", () => {
  const onConfirm = vi.fn()
  render(<LeitorDrawer isOpen onClose={() => {}} onConfirm={onConfirm} />)

  fireEvent.change(screen.getByLabelText(/nome completo/i), {
    target: { value: "Maria Silva" },
  })
  fireEvent.change(screen.getByLabelText(/cpf/i), {
    target: { value: "12345678901" },
  })
  fireEvent.change(screen.getByLabelText(/e-mail/i), {
    target: { value: "maria@example.com" },
  })
  fireEvent.change(screen.getByLabelText(/cep/i), {
    target: { value: "20000000" },
  })
  fireEvent.change(screen.getByLabelText(/logradouro/i), {
    target: { value: "Rua Central" },
  })
  fireEvent.change(screen.getByLabelText(/número/i), {
    target: { value: "10" },
  })
  fireEvent.change(screen.getByLabelText(/cidade/i), {
    target: { value: "Rio" },
  })
  fireEvent.click(screen.getByRole("button", { name: /cadastrar leitor/i }))

  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({
      cep: "20000000",
      logradouro: "Rua Central",
      numero: "10",
      cidade: "Rio",
    }),
  )
})
