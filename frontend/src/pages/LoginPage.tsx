import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";

import { ApiError } from "../api/client";
import { APP_NAME } from "../appName";
import { useAuth } from "../auth/useAuth";
import { BrandMark } from "../components/BrandMark";
import { HOME_PATH } from "../navigation";

export function LoginPage() {
  const { me, loading, notice, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return null;
  }
  // Quem já tem sessão vai direto para o Início.
  if (me !== null) {
    return <Navigate to={HOME_PATH} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (caught) {
      // A mensagem do servidor é mostrada tal como vem.
      setError(caught instanceof ApiError ? caught.detail : "Não foi possível entrar.");
      setSubmitting(false);
    }
  }

  return (
    <div className="login">
      <main className="login-panel">
        <div className="brand">
          <BrandMark size={28} />
          <span className="brand-name">{APP_NAME}</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-heading">
            <h1 className="login-title">Entrar</h1>
            <p className="login-hint">Use o seu utilizador e a palavra-passe.</p>
          </div>

          {notice && !error && (
            <p className="banner banner-notice" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="banner banner-error" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor="username">Utilizador</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Palavra-passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button type="submit" className="button button-primary button-block" disabled={submitting}>
            {submitting ? "A entrar" : "Entrar"}
          </button>
        </form>
      </main>
      <p className="login-help">Não consegue entrar? Fale com o administrador da aplicação.</p>
    </div>
  );
}
