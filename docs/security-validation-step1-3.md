# Etapa 1.3: projeto Supabase Free de testes

O CLI `supabase@2.109.1` executou via `npx.cmd`. No PowerShell desta máquina, `npx.ps1` é bloqueado pela política de execução; use `npx.cmd`. Não há variáveis `SUPABASE_TEST_*` configuradas nesta sessão. O vínculo em `supabase/.temp` não será usado.

## Preparação sem acesso remoto

Configure apenas as variáveis do projeto **descartável**: `SUPABASE_TEST_PROJECT_REF`, `SUPABASE_TEST_URL`, `SUPABASE_TEST_DB_URL` (conexão PostgreSQL desse mesmo projeto) e `SUPABASE_TEST_CONFIRM_ISOLATED=PROJETO_DESCARTAVEL`. Não copie `.env.local` nem use credenciais de produção. A senha da URL de banco deve estar percent-encoded. O script aceita conexão direta `db.<ref>.supabase.co` ou pooler com usuário `postgres.<ref>`.

```powershell
node scripts/preflight-supabase-test.mjs
```

Essa pré-checagem não acessa a rede: exige que os identificadores da API e do banco correspondam ao ref informado e imprime a lista ordenada das migrations. Confirme visualmente o ref e a lista antes de prosseguir. Com o destino confirmado, o CLI pode mostrar o plano sem alterar o banco:

```powershell
npx.cmd --yes --package=supabase@2.109.1 supabase db push --db-url $env:SUPABASE_TEST_DB_URL --dry-run
```

**Somente após autorização explícita para esse ref**, aplicar as migrations com o mesmo `--db-url`, sem `--linked`, `--include-seed` ou `--include-roles`. A sequência planejada contém os 12 arquivos de `supabase/migrations/`, de `20260718041147_create_health_check.sql` até `20261104000000_secure_product_images.sql`.

Depois, criar duas contas fictícias no Auth do projeto de testes, inserir apenas a conta administradora em `private.administradores` e definir `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_USER_EMAIL`, `SUPABASE_TEST_USER_PASSWORD`, `SUPABASE_TEST_ADMIN_EMAIL` e `SUPABASE_TEST_ADMIN_PASSWORD` do mesmo projeto. Executar:

```powershell
node tests/security.integration.mjs
npx.cmd --yes --package=supabase@2.109.1 supabase db query --db-url $env:SUPABASE_TEST_DB_URL --file supabase/audits/security_audit.sql
```

Os comandos de escrita e a auditoria remota estão **pendentes de autorização** e das credenciais exclusivas do projeto de testes. O teste cria fixtures aleatórias e tenta limpá-las; após falhas, revisar resíduos no projeto descartável.
