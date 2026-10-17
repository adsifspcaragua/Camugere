import React from "react"
import { render, screen } from "@testing-library/react"
import BookTable from "../components/BookTable"

const mockObras = [
  {
    idObra: 1,
    capa: "B",
    titulo: "React for Beginners",
    autor: "John Doe",
    cdd: "005.133",
  },
]

const mockExemplares = [
  {
    idExemplar: 1,
    idObra: 1,
    numeroInventario: "INV-0001",
    disponivel: true,
  },
]

test("renders BookTable with correct data", () => {
  render(
    <BookTable
      obras={mockObras}
      exemplares={mockExemplares}
      emprestimos={[]}
      leitores={[]}
      searchQuery=""
      filter="all"
    />,
  )
  expect(screen.getByText("React for Beginners")).toBeInTheDocument()
  expect(screen.getByText("John Doe")).toBeInTheDocument()
  expect(screen.getByText("005.133")).toBeInTheDocument()
  expect(screen.getAllByText("1").length).toBe(2) // Total and Disponíveis
})

test("decreases available copies when a loan is active for that copy", () => {
  const activeLoans = [
    {
      idEmprestimo: 101,
      idExemplar: 1,
      idLeitor: 1,
      status: "ativo",
      statusDevolucao: false,
    }
  ]
  const { rerender } = render(
    <BookTable obras={mockObras} exemplares={mockExemplares} emprestimos={[]} leitores={[]} searchQuery="" />
  )
  expect(screen.getAllByText("1").length).toBe(2)

  // When loan is registered:
  rerender(
    <BookTable obras={mockObras} exemplares={mockExemplares} emprestimos={activeLoans} leitores={[]} searchQuery="" />
  )
  // Total is still 1, but Disponíveis is 0
  expect(screen.getAllByText("1").length).toBe(1)
  expect(screen.getByText("0")).toBeInTheDocument()
})