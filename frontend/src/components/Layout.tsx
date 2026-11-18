import { useState } from "react";
import { Link, Navigate, NavLink, Outlet } from "react-router";

import { ApiError } from "../api/client";
import { APP_NAME } from "../appName";
import { useAuth } from "../auth/useAuth";
import { HOME_PATH, NAV_ITEMS } from "../navigation";
import { BrandMark } from "./BrandMark";

// Moldura das páginas com sessão: barra de topo com o nome da aplicação, o menu,
// o utilizador e o botão de sair; o conteúdo fica num contentor ao centro.
export function Layout() {
  const { me, loading, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (loading) {
    return (
      <p className="app-loading" role="status">
        A abrir a sessão
      </p>
    );
  }
  if (me === null) {
    return <Navigate to="/entrar" replace />;
  }

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (error) {
      setLogoutError(error instanceof ApiError ? error.detail : "Não foi possível sair.");
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo">
        Saltar para o conteúdo
      </a>
      <header className="topbar">
        <div className="topbar-inner container">
          <Link to={HOME_PATH} className="brand">
            <BrandMark />
            <span className="brand-name">{APP_NAME}</span>
          </Link>

          <nav className="topbar-nav" aria-label="Navegação principal">
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} end>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="topbar-user">
            <span className="topbar-user-name">{me.display_name}</span>
            <button type="button" className="button button-small" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main id="conteudo" className="app-main container" tabIndex={-1}>
        {logoutError && (
          <p className="banner banner-error" role="alert">
            {logoutError}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
