import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getToken, setToken } from "../api/client";
import { login as loginRequest } from "../api/energia";

interface AuthState {
  isAuthenticated: boolean;
  usuario: string | null;
  signIn: (usuario: string, senha: string) => Promise<void>;
  signOut: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

const USER_KEY = "energia.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken);
  const [usuario, setUsuario] = useState<string | null>(() => localStorage.getItem(USER_KEY));

  const signIn = useCallback(async (user: string, senha: string) => {
    const { token: newToken } = await loginRequest(user, senha);
    setToken(newToken);
    localStorage.setItem(USER_KEY, user);
    setTokenState(newToken);
    setUsuario(user);
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    localStorage.removeItem(USER_KEY);
    setTokenState(null);
    setUsuario(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ isAuthenticated: Boolean(token), usuario, signIn, signOut }),
    [token, usuario, signIn, signOut],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return ctx;
}
