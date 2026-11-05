// Local only. Validates the explicitly supplied test target and lists migrations.
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";

const ref = process.env.SUPABASE_TEST_PROJECT_REF;
assert.match(ref ?? "", /^[a-z0-9]{10,30}$/, "Defina SUPABASE_TEST_PROJECT_REF.");
assert.equal(
  process.env.SUPABASE_TEST_CONFIRM_ISOLATED,
  "PROJETO_DESCARTAVEL",
  "Confirme que este ref pertence a um projeto de testes descartável.",
);

const api = new URL(process.env.SUPABASE_TEST_URL ?? "");
assert.equal(api.protocol, "https:");
assert.equal(api.hostname, `${ref}.supabase.co`, "A API não corresponde ao ref de testes.");
assert.equal(api.pathname, "/", "Use apenas a URL raiz da API.");

const db = new URL(process.env.SUPABASE_TEST_DB_URL ?? "");
assert.ok(["postgres:", "postgresql:"].includes(db.protocol));
assert.equal(db.pathname, "/postgres", "A conexão deve apontar para o banco postgres.");
assert.ok(db.password, "A conexão de testes precisa incluir a senha do banco.");
const dbUser = decodeURIComponent(db.username);
const direct = db.hostname === `db.${ref}.supabase.co` && dbUser === "postgres";
const pooler = db.hostname.endsWith(".pooler.supabase.com") && dbUser === `postgres.${ref}`;
assert.ok(direct || pooler, "O host e o usuário do banco não correspondem ao ref de testes.");

const migrations = (await readdir(new URL("../supabase/migrations/", import.meta.url)))
  .filter((name) => /^\d{14}_.+\.sql$/.test(name))
  .sort();
assert.ok(migrations.length, "Nenhuma migration encontrada.");

console.log(`Projeto de testes: ${ref}`);
console.log(`API: ${api.origin}`);
console.log(`Banco: ${db.hostname} (${direct ? "direto" : "pooler"})`);
console.log("Migrations em ordem:");
for (const name of migrations) console.log(`  ${name}`);
console.log("Pré-checagem local concluída. Nenhuma conexão ou alteração remota foi feita.");
