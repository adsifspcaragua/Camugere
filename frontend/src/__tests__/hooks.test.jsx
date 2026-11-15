import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { useForm } from "../hooks/useForm.js";
import { useHotkeys } from "../hooks/useHotkeys.js";
import { useGuardedClose } from "../hooks/useGuardedClose.js";
import { useConnection } from "../hooks/useConnection.js";
import { ConfirmContext } from "../context/ConfirmContext.jsx";

const validar = (v) => (v.nome?.trim() ? {} : { nome: "Informe o nome." });
const evento = (value) => ({ target: { value } });

describe("useForm", () => {
  it("field() liga valor e onChange, com transformação opcional", () => {
    const { result } = renderHook(() => useForm({ nome: "" }, validar));
    act(() => result.current.field("nome", (x) => x.toUpperCase()).onChange(evento("ana")));
    expect(result.current.values.nome).toBe("ANA");
    expect(result.current.field("outro").value).toBe("");
  });

  it("só mostra erro ao sair do campo e limpa ao corrigir", () => {
    const { result } = renderHook(() => useForm({ nome: "" }, validar));
    expect(result.current.errors).toEqual({});
    act(() => result.current.field("nome").onBlur());
    expect(result.current.field("nome").error).toBe("Informe o nome.");
    act(() => result.current.field("nome").onChange(evento("Ana")));
    expect(result.current.errors).toEqual({});
    act(() => result.current.field("nome").onBlur());
    expect(result.current.errors).toEqual({});
  });

  it("validate() devolve se está válido e guarda os erros", () => {
    const { result } = renderHook(() => useForm({ nome: "" }, validar));
    let ok;
    act(() => (ok = result.current.validate()));
    expect(ok).toBe(false);
    expect(result.current.errors.nome).toBeDefined();
    act(() => result.current.set({ nome: "Ana" }));
    act(() => (ok = result.current.validate()));
    expect(ok).toBe(true);
  });

  it("applyServerErrors mostra erros da API e informa se algum casou", () => {
    const { result } = renderHook(() => useForm({ cpf: "" }));
    let casou;
    act(() => (casou = result.current.applyServerErrors({ cpf: "CPF já cadastrado" })));
    expect(casou).toBe(true);
    expect(result.current.errors.cpf).toBe("CPF já cadastrado");
    act(() => (casou = result.current.applyServerErrors(null)));
    expect(casou).toBe(false);
  });

  it("dirty indica mudança em relação ao estado inicial", () => {
    const { result } = renderHook(() => useForm({ nome: "Ana" }));
    expect(result.current.dirty).toBe(false);
    act(() => result.current.set({ nome: "Bia" }));
    expect(result.current.dirty).toBe(true);
    act(() => result.current.set({ nome: "Ana" }));
    expect(result.current.dirty).toBe(false);
  });

  it("setError adiciona erro manual", () => {
    const { result } = renderHook(() => useForm({}));
    act(() => result.current.setError({ geral: "x" }));
    expect(result.current.errors).toEqual({ geral: "x" });
  });
});

describe("useHotkeys", () => {
  function Teclado({ map, enabled }) {
    useHotkeys(map, enabled);
    return <input aria-label="campo" />;
  }

  it("dispara o atalho (sem diferenciar maiúsculas)", () => {
    const n = vi.fn();
    render(<Teclado map={{ n }} />);
    fireEvent.keyDown(document, { key: "N" });
    expect(n).toHaveBeenCalledTimes(1);
  });

  it("ignora enquanto digita, com modificadores ou desabilitado", () => {
    const n = vi.fn();
    const { getByLabelText, rerender } = render(<Teclado map={{ n }} />);
    fireEvent.keyDown(document, { key: "n", ctrlKey: true });
    getByLabelText("campo").focus();
    fireEvent.keyDown(document, { key: "n" });
    getByLabelText("campo").blur();
    rerender(<Teclado map={{ n }} enabled={false} />);
    fireEvent.keyDown(document, { key: "n" });
    expect(n).not.toHaveBeenCalled();
  });
});

describe("useGuardedClose", () => {
  const wrapper = (confirm) => ({ children }) => <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>;

  it("fecha direto quando nada mudou", async () => {
    const onClose = vi.fn();
    const confirm = vi.fn();
    const { result } = renderHook(() => useGuardedClose(onClose, false), { wrapper: wrapper(confirm) });
    await act(() => result.current());
    expect(onClose).toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("pergunta antes de descartar alterações", async () => {
    const onClose = vi.fn();
    const confirm = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const { result } = renderHook(() => useGuardedClose(onClose, true), { wrapper: wrapper(confirm) });
    await act(() => result.current());
    expect(onClose).not.toHaveBeenCalled();
    await act(() => result.current());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0][0].title).toBe("Descartar alterações?");
  });
});

describe("useConnection", () => {
  it("reage aos eventos online/offline do navegador", () => {
    const { result } = renderHook(() => useConnection());
    expect(result.current).toBe(true);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current).toBe(false);
    act(() => window.dispatchEvent(new Event("online")));
    expect(result.current).toBe(true);
  });
});
