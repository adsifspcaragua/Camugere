import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null)
const STORAGE_KEY = "biblioteca-auth-token"
const API_BASE_URL = import.meta.env.VITE_API_URL

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const validateToken = useCallback(async (tokenToCheck) => {
    if (!tokenToCheck) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToCheck }),
      });

      // 401/403 = token inválido ou expirado
      return response.ok;
    } catch (err) {
      console.error("Erro ao validar token:", err);
      // Falha de rede não deve necessariamente deslogar o usuário;
      // aqui optei por tratar como inválido, mas dá pra revisar isso
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkSavedToken() {
      const savedToken = localStorage.getItem(STORAGE_KEY);

      if (!savedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const isValid = await validateToken(savedToken);
      if (!isMounted) return;

      if (isValid) {
        setToken(savedToken); // isLoading continua true; quem desliga é o loadUser
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setIsLoading(false);
      }
    }

    checkSavedToken();
    return () => { isMounted = false; };
  }, [validateToken]); // sem 'user' na lista de dependências

  // useEffect(() => {
  //   const savedToken = localStorage.getItem(STORAGE_KEY);
  //   if (savedToken) {
  //     setToken(savedToken);
  //   }
  //   setIsLoading(false);
  // }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, hash: password }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      throw new Error(errorJson?.message || "Falha ao autenticar");
    }

    const result = await response.json();
    const accessToken = result?.data;
    if (!accessToken) throw new Error("Resposta inválida do servidor");

    setIsLoading(true); // entra em estado de carregamento até o user chegar
    localStorage.setItem(STORAGE_KEY, accessToken);
    setToken(accessToken);
    return accessToken;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const payload = jwtDecode(token);
        const response = await fetch(`${API_BASE_URL}/bibliotecario/get/${payload.id_bibliotecario}`, {
          method: 'GET',
          headers: {
            'jwt_token': token, 'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        if (isMounted) {
          setUser({bibliotecario: data.bibliotecario, usuario: data.usuario});
          setIsLoading(false)
        }

      } catch (err) {
        console.error(err);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUser();

    return () => { isMounted = false; };
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, isAuthenticated: Boolean(token) && Boolean(user), user, login, logout, isLoading }),
    [token, user, login, logout, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
