// Hook PreToolUse: impede o Claude de ler ou alterar o .env, por qualquer ferramenta.
// As regras "deny" do settings.json só apanham os comandos que listam; este hook
// apanha também grep, python, Get-Content, etc. O .env.example continua acessível.
// Saída 2 = o Claude Code cancela a ação e mostra o stderr ao Claude.
import { readFileSync } from "node:fs";

// ".env" como nome de ficheiro: depois de início, separador de caminho, espaço ou aspa,
// e sem continuar (assim ".env.example" e ".envrc" passam).
const ENV_FILE = /(^|[\\/\s"'=(:])\.env(?![\w.-])/;

const event = JSON.parse(readFileSync(0, "utf8"));
const input = event.tool_input ?? {};
// Só os campos que apontam para ficheiros ou comandos, não o texto que o Claude escreve.
const targets = [input.file_path, input.path, input.glob, input.command].filter(Boolean);

if (targets.some((target) => ENV_FILE.test(target))) {
  console.error(
    "Bloqueado: o Claude não lê nem altera o .env (ver Segurança no CLAUDE.md). " +
      "Use o backend/.env.example para saber que variáveis existem.",
  );
  process.exit(2);
}
