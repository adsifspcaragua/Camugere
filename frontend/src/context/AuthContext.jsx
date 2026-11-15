import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getToken, setToken, setUnauthorizedHandler } from "../lib/api.js";
import * as authService from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? "checking" : "anonymous");
  // Motivo da última saída, exibido na tela de login (ex.: sessão expirada).
  const [exitReason, setExitReason] = useState(null);

  const logout = useCallback((reason = null) => {
    setToken(null);
    setUser(null);
    setExitReason(reason);
    setStatus("anonymous");
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const { usuario } = await authService.fetchProfile();
      setUser(usuario);
      setStatus("authenticated");
    } catch (error) {
      // Sem conexão, mantém o token e deixa a pessoa tentar de novo.
      if (error.status === 0) setStatus("offline");
      else logout(error.status === 401 ? "expired" : null);
    }
  }, [logout]);

  const retry = useCallback(() => {
    setStatus("checking");
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setUnauthorizedHandler(() => logout("expired"));
    if (getToken()) loadProfile();
  }, [logout, loadProfile]);

  // Abre a sessão com um token já emitido (ex.: logo após configurar o primeiro acesso).
  const entrarComToken = useCallback(
    async (token) => {
      setToken(token);
      setExitReason(null);
      await loadProfile();
    },
    [loadProfile],
  );

  const login = useCallback(async (email, senha) => entrarComToken(await authService.login(email, senha)), [entrarComToken]);

  // Trocar a senha encerra as outras sessões; esta continua com o token novo devolvido pela API.
  const alterarSenha = useCallback(async (senhaAtual, novaSenha) => {
    const { token } = await authService.alterarSenha(senhaAtual, novaSenha);
    setToken(token);
  }, []);

  const signOut = useCallback(() => logout(null), [logout]);
  const value = useMemo(
    () => ({ user, status, exitReason, login, entrarComToken, alterarSenha, logout: signOut, retry }),
    [user, status, exitReason, login, entrarComToken, alterarSenha, signOut, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
