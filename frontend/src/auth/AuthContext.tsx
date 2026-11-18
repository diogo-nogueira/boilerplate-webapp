import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { apiGet, apiSend, setUnauthorizedHandler } from "../api/client";
import type { Me } from "../api/types";
import { AuthContext } from "./useAuth";

const SESSION_ENDED_NOTICE = "A sessão terminou. Entre outra vez.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  // Guardado aqui e não no estado da navegação: o Layout também redireciona
  // para /entrar quando a sessão desaparece e esse redirecionamento perdia o aviso.
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();
  // O handler da API precisa de saber se havia sessão sem ser recriado a cada mudança.
  const hadSession = useRef(false);

  function updateMe(next: Me | null) {
    hadSession.current = next !== null;
    setMe(next);
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Sem sessão aberta (por exemplo, no arranque) não há nada que tenha terminado.
      if (!hadSession.current) {
        return;
      }
      updateMe(null);
      setNotice(SESSION_ENDED_NOTICE);
      navigate("/entrar", { replace: true });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    apiGet<Me>("/api/auth/me/")
      .then((current) => {
        if (!cancelled) updateMe(current);
      })
      .catch(() => {
        // 403 quer dizer que ainda não entrou: fica sem sessão.
        if (!cancelled) updateMe(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(username: string, password: string) {
    const current = await apiSend<Me>("POST", "/api/auth/login/", { username, password });
    setNotice(null);
    updateMe(current);
  }

  async function logout() {
    await apiSend<void>("POST", "/api/auth/logout/");
    setNotice(null);
    updateMe(null);
  }

  return (
    <AuthContext.Provider value={{ me, loading, notice, login, logout }}>{children}</AuthContext.Provider>
  );
}
