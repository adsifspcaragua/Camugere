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
  }
]

const mockExemplares = [
  {
    idExemplar: 1,
    idObra: 1,
    numeroInventario: "INV-0001",
    disponivel: true,
  }
]

test("renders BookTable with correct data", () => {
  render(<BookTable obras={mockObras} exemplares={mockExemplares} emprestimos={[]} leitores={[]} searchQuery="" filter="all" />)
  expect(screen.getByText("React for Beginners")).toBeInTheDocument()
  expect(screen.getByText("John Doe")).toBeInTheDocument()
  expect(screen.getByText("005.133")).toBeInTheDocument()
})