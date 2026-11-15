import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Função comum (não vi.fn): o spy do vitest reporta como "não tratada" a rejeição que a página já trata.
const calls = [];
let impl = async () => {};
const login = (...args) => {
  calls.push(args);
  return impl(...args);
};
vi.mock("../context/AuthContext.jsx", () => ({ useAuth: () => ({ login, exitReason: null }) }));
vi.mock("../components/ThemeToggle.jsx", () => ({ default: () => null }));
vi.mock("../components/layout/Footer.jsx", () => ({ default: () => null }));

import LoginPage from "../pages/LoginPage.jsx";

describe("LoginPage: erros de formulário", () => {
  beforeEach(() => {
    calls.length = 0;
    impl = async () => {};
  });

  it("mostra instruções e não chama a API com campos vazios/inválidos", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole("button", { name: /entrar no sistema/i }));
    expect(screen.getByText("Informe o e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
    expect(calls).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/e-mail de acesso/i), { target: { value: "abc" } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar no sistema/i }));
    expect(calls).toHaveLength(0);
  });

  it("traduz 401 em mensagem orientativa", async () => {
    const falha = { status: 401, message: "Credenciais inválidas" };
    impl = async () => {
      throw falha;
    };
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/e-mail de acesso/i), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText(/senha/i), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /entrar no sistema/i }));
    await screen.findByText(/e-mail ou senha incorretos/i);
  });
});
