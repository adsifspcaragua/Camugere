import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import LoginPage from "../pages/LoginPage.jsx";

// Mock do AuthContext para LoginPage
vi.mock("../context/AuthContext.jsx", () => ({
  useAuth: () => ({
    login: vi.fn(),
    exitReason: null,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("renderiza o botão com acessibilidade e alterna entre temas claro e escuro ao clicar", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Inicialmente no modo claro (ou sistema padrão falso nos mocks)
    const button = screen.getByRole("button", { name: /alternar para modo escuro/i });
    expect(button).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    // Clica para mudar para escuro
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /alternar para modo claro/i })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Clica para voltar para claro
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /alternar para modo escuro/i })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("renderiza o botão de alternar tema na tela de login", () => {
    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole("button", { name: /alternar para modo/i });
    expect(toggleButton).toBeInTheDocument();
  });
});
