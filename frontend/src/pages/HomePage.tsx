import { useAuth } from "../auth/useAuth";

// Página inicial: o ponto de partida das novas funcionalidades.
export function HomePage() {
  const { me } = useAuth();

  return (
    <section className="page">
      <div className="page-header">
        <h1 className="page-title">Bem-vindo, {me?.display_name}</h1>
        <p className="page-lead">
          Para criar a primeira funcionalidade, comece pelo <code>README.md</code> e pelo{" "}
          <code>CLAUDE.md</code>, na raiz do repositório.
        </p>
      </div>
    </section>
  );
}
