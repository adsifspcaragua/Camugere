import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const authService = vi.hoisted(() => ({ login: vi.fn(), fetchProfile: vi.fn() }));
vi.mock("../services/authService.js", () => authService);

import { AuthProvider, useAuth } from "../context/AuthContext.jsx";
import { ToastProvider, useToast } from "../context/ToastContext.jsx";
import { ConfirmProvider, useConfirm } from "../context/ConfirmContext.jsx";
import { getToken, setToken } from "../lib/api.js";

const authWrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("sem token começa anônimo", () => {
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    expect(result.current.status).toBe("anonymous");
    expect(authService.fetchProfile).not.toHaveBeenCalled();
  });

  it("login salva o token e carrega o perfil", async () => {
    authService.login.mockResolvedValue("tkn");
    authService.fetchProfile.mockResolvedValue({ usuario: { id: 1, nome: "Ana" } });
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await act(() => result.current.login("a@x.com", "senha"));
    expect(getToken()).toBe("tkn");
    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual({ id: 1, nome: "Ana" });

    act(() => result.current.logout());
    expect(getToken()).toBeNull();
    expect(result.current).toMatchObject({ status: "anonymous", user: null, exitReason: null });
  });

  it("token rejeitado (401) desloga com motivo 'expired'", async () => {
    setToken("velho");
    authService.fetchProfile.mockRejectedValue({ status: 401 });
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe("anonymous"));
    expect(result.current.exitReason).toBe("expired");
    expect(getToken()).toBeNull();
  });

  it("sem conexão mantém o token e permite tentar de novo", async () => {
    setToken("tkn");
    authService.fetchProfile.mockRejectedValueOnce({ status: 0 }).mockResolvedValueOnce({ usuario: { id: 1 } });
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper });
    await waitFor(() => expect(result.current.status).toBe("offline"));
    expect(getToken()).toBe("tkn");
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
  });

  it("useAuth fora do provider lança erro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
    console.error.mockRestore();
  });
});

describe("ToastContext", () => {
  function Disparador({ onReady }) {
    onReady(useToast());
    return null;
  }
  const montar = () => {
    let toast;
    render(
      <ToastProvider>
        <Disparador onReady={(t) => (toast = t)} />
      </ToastProvider>,
    );
    return () => toast;
  };

  afterEach(() => vi.useRealTimers());

  it("mostra aviso e some sozinho após o tempo do tipo", () => {
    vi.useFakeTimers();
    const toast = montar();
    act(() => toast().success("Salvo!"));
    expect(screen.getByRole("status")).toHaveTextContent("Salvo!");
    act(() => vi.advanceTimersByTime(4600));
    expect(screen.queryByText("Salvo!")).not.toBeInTheDocument();
  });

  it("erro usa role=alert e pode ser fechado", () => {
    const toast = montar();
    act(() => toast().error("Falhou"));
    expect(screen.getByRole("alert")).toHaveTextContent("Falhou");
    fireEvent.click(screen.getByLabelText("Fechar aviso"));
    expect(screen.queryByText("Falhou")).not.toBeInTheDocument();
  });

  it("botão de ação executa e fecha o aviso", () => {
    const desfazer = vi.fn();
    const toast = montar();
    act(() => toast().info("Excluído", { action: { label: "Desfazer", onClick: desfazer } }));
    fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    expect(desfazer).toHaveBeenCalled();
    expect(screen.queryByText("Excluído")).not.toBeInTheDocument();
  });

  it("mantém no máximo 4 avisos na tela", () => {
    const toast = montar();
    act(() => ["a", "b", "c", "d", "e"].forEach((m) => toast().info(m)));
    expect(screen.getAllByRole("status")).toHaveLength(4);
    expect(screen.queryByText("a")).not.toBeInTheDocument();
  });

  it("pausa enquanto o mouse está em cima", () => {
    vi.useFakeTimers();
    const toast = montar();
    act(() => toast().success("Leia"));
    fireEvent.mouseEnter(screen.getByRole("status"));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByText("Leia")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole("status"));
    act(() => vi.advanceTimersByTime(2600));
    expect(screen.queryByText("Leia")).not.toBeInTheDocument();
  });
});

describe("ConfirmContext", () => {
  const wrapper = ({ children }) => <ConfirmProvider>{children}</ConfirmProvider>;

  it.each([
    ["Excluir", true],
    ["Cancelar", false],
  ])("resolve a promessa ao clicar em %s", async (botao, esperado) => {
    const { result } = renderHook(() => useConfirm(), { wrapper });
    let resposta;
    act(() => {
      result.current({ title: "Excluir obra?", message: "Não dá para desfazer." }).then((r) => (resposta = r));
    });
    expect(screen.getByRole("alertdialog")).toHaveTextContent("Excluir obra?");
    fireEvent.click(screen.getByRole("button", { name: botao }));
    await waitFor(() => expect(resposta).toBe(esperado));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Esc cancela", async () => {
    const { result } = renderHook(() => useConfirm(), { wrapper });
    let resposta;
    act(() => {
      result.current({ title: "T", message: "M", confirmLabel: "Sim", cancelLabel: "Não" }).then((r) => (resposta = r));
    });
    expect(screen.getByRole("button", { name: "Sim" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(resposta).toBe(false));
  });
});
