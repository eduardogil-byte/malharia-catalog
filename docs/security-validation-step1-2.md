# Etapa 1.2: validação isolada

Estado desta sessão: o esquema-base existe em `20260718050951_create_catalog_core_schema.sql` e há 12 migrations ordenadas. O `seed.sql` configurado não existia; o seed foi desativado. A reconstrução real e os testes de RLS/Storage ainda dependem de um Supabase isolado. Nesta máquina, `supabase` e `docker` não estão no PATH e `node_modules/.bin` não contém o CLI. Nenhuma migration foi aplicada e nenhum dado remoto foi alterado.

## Opção local (preferida)

Instale e inicie o Docker Desktop; instale as dependências do repositório com `npm ci`. Em seguida, nesta pasta:

```powershell
npx supabase start
npx supabase db reset
npx supabase status
```

`db reset` reconstrói o banco local a partir das migrations. Use apenas a URL local `http://127.0.0.1:54321` e a chave anon indicada por `supabase status`.

## Projeto gratuito separado

Crie um projeto **novo e descartável** no [Dashboard do Supabase](https://supabase.com/dashboard). O [plano Free](https://supabase.com/docs/guides/platform/billing-on-supabase) permite projetos gratuitos, sujeito ao limite atual da conta. Copie **somente** a conexão de banco desse projeto para `$env:SUPABASE_TEST_DB_URL`. Confira o project ref da conexão e do endereço `https://<ref>.supabase.co` antes de executar:

```powershell
npx supabase db push --db-url $env:SUPABASE_TEST_DB_URL --dry-run
npx supabase db push --db-url $env:SUPABASE_TEST_DB_URL
```

O CLI pode ter vínculo salvo em `supabase/.temp`. Nunca execute `db push` sem `--db-url` nesta validação. A [referência do CLI](https://supabase.com/docs/reference/cli/v1/supabase-init) documenta `--db-url` e `--dry-run`. Não use um dump de produção nem dados reais.

## Contas e teste de integração

Depois de aplicar as migrations **no projeto isolado**, crie duas contas de teste em Authentication > Users: uma comum e uma administradora. No SQL Editor do projeto isolado, vincule apenas a segunda:

```sql
insert into private.administradores (user_id, nome)
select id, 'Administrador de testes'
from auth.users
where email = 'admin-teste@example.invalid';
```

Confirme que a consulta inseriu uma linha. Use as credenciais dessas contas e a chave anon do mesmo projeto. Configure `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`, `SUPABASE_TEST_USER_EMAIL`, `SUPABASE_TEST_USER_PASSWORD`, `SUPABASE_TEST_ADMIN_EMAIL` e `SUPABASE_TEST_ADMIN_PASSWORD` no terminal, sem gravá-las no Git. Para projeto remoto, configure também `SUPABASE_TEST_PROJECT_REF=<ref>` e `SUPABASE_TEST_CONFIRM_ISOLATED=PROJETO_DESCARTAVEL`. Execute:

```powershell
node tests/security.integration.mjs
```

O teste cria apenas dados com identificador aleatório, tenta limpá-los ao fim e verifica: RLS e RPC para anônimo/comum/admin, upload e MIME recusado, rascunho privado, publicação com imagem exibida por URL assinada, bloqueio de exclusão prematura, arquivamento e recusa de **novas** URLs assinadas, exclusão final e compensação de upload após falha de registro. Se houver falha, revise resíduos com `supabase/audits/security_audit.sql` no projeto de testes. URLs assinadas emitidas **antes** do arquivamento podem continuar válidas até expirar.

Pendência para produção: executar e registrar o `db reset` ou `db push` isolado, o teste de integração, e a auditoria SQL no ambiente isolado; revisar os resultados e qualquer arquivo órfão antes de planejar a implantação. Não avançar para a Etapa 2.
