// Testes do hook. Correm com: node --test .claude/hooks/bloquear-env.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const SCRIPT = join(import.meta.dirname, "bloquear-env.mjs");

// Corre o hook como o Claude Code o corre: o JSON do evento chega pelo stdin.
function runHook(toolName, toolInput) {
  const event = { hook_event_name: "PreToolUse", tool_name: toolName, tool_input: toolInput };
  return spawnSync(process.execPath, [SCRIPT], { input: JSON.stringify(event), encoding: "utf8" });
}

const BLOCKED = [
  ["Read", { file_path: "/projeto/backend/.env" }],
  ["Read", { file_path: "C:\\projeto\\backend\\.env" }],
  ["Edit", { file_path: "backend/.env" }],
  ["Write", { file_path: ".env" }],
  ["Grep", { pattern: "SECRET", path: "backend/.env" }],
  ["Bash", { command: "cat backend/.env" }],
  ["Bash", { command: "grep DJANGO backend/.env | head" }],
  ["Bash", { command: "python -c \"print(open('.env').read())\"" }],
  ["PowerShell", { command: "Get-Content backend\\.env" }],
  ["PowerShell", { command: "type .env" }],
];

const ALLOWED = [
  ["Read", { file_path: "backend/.env.example" }],
  ["Read", { file_path: "backend/config/settings/base.py" }],
  ["Edit", { file_path: ".envrc" }],
  ["Bash", { command: "python manage.py test" }],
  ["Bash", { command: "cat backend/.env.example" }],
  ["Bash", { command: "git check-ignore backend/.env.example" }],
];

for (const [tool, input] of BLOCKED) {
  test(`bloqueia ${tool} ${JSON.stringify(input)}`, () => {
    const result = runHook(tool, input);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /\.env/);
  });
}

for (const [tool, input] of ALLOWED) {
  test(`deixa passar ${tool} ${JSON.stringify(input)}`, () => {
    assert.equal(runHook(tool, input).status, 0);
  });
}
