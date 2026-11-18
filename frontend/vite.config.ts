/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { APP_NAME } from "./src/appName.ts";

// Põe o nome da aplicação no <title> do index.html: o nome só se muda em src/appName.ts.
function appNameInTitle(): Plugin {
  return {
    name: "app-name-in-title",
    transformIndexHtml: (html) => html.replace("%APP_NAME%", APP_NAME),
  };
}

export default defineConfig({
  plugins: [react(), appNameInTitle()],
  server: {
    // Em desenvolvimento, o Vite reencaminha /api para o Django: mesma origem, sem CORS.
    // changeOrigin: false mantém o Host do browser (porta 5173), para a
    // verificação de origem do CSRF do Django aceitar os pedidos POST.
    proxy: { "/api": { target: "http://127.0.0.1:8000", changeOrigin: false } },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
