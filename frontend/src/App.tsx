import { Navigate, Route, Routes } from "react-router";

import { Layout } from "./components/Layout";
import { HOME_PATH } from "./navigation";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

// As páginas dentro do Layout pedem sessão: sem ela, o Layout leva ao Entrar.
export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path={HOME_PATH} element={<HomePage />} />
        <Route path="*" element={<Navigate to={HOME_PATH} replace />} />
      </Route>
    </Routes>
  );
}
