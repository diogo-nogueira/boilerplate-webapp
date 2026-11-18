import { createContext, useContext } from "react";

import type { Me } from "../api/types";

// Num ficheiro à parte do AuthProvider: um ficheiro .tsx só com componentes
// deixa o Vite atualizar a página sem a recarregar (fast refresh).

export type AuthValue = {
  me: Me | null;
  loading: boolean;
  // Aviso para a página de login (por exemplo, sessão terminada)
  notice: string | null;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
};

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth tem de ser usado dentro de <AuthProvider>.");
  }
  return value;
}
