# Backup e restauração

Faça uma cópia consistente antes de aplicar migrations. Execute estes comandos apenas em um terminal protegido, com acesso ao projeto correto. Não salve senhas ou chaves no repositório.

## PostgreSQL

Obtenha a connection string do banco no painel do Supabase e disponibilize-a como `PGDATABASE_URL` no terminal. Use uma versão do `pg_dump` compatível com a versão do servidor.

```powershell
pg_dump --dbname=$env:PGDATABASE_URL --format=custom --no-owner --no-acl --file=backup-postgres.dump
pg_restore --list backup-postgres.dump
```

O dump inclui o esquema e os dados do PostgreSQL. Confirme também o número de arquivos no manifesto do Storage e mantenha os dois arquivos de backup juntos. Guarde cópias criptografadas com acesso restrito e teste a restauração em um projeto separado.

## Storage

Disponibilize `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas no terminal protegido e execute:

```powershell
node scripts/backup-storage.mjs backup-storage
```

O script baixa `catalogo-produtos` e `site-assets` sem modificar o projeto. Confira `backup-storage/storage-manifest.json` e compare a quantidade e os tamanhos dos arquivos. A service role contorna RLS: não inclua a chave nem o diretório de backup no Git.

## Restauração em projeto separado

1. Crie um projeto de recuperação isolado. Configure o bucket `catalogo-produtos` como privado e `site-assets` conforme as migrations.
2. Restaure o dump primeiro em um PostgreSQL **isolado e vazio** com `pg_restore --dbname=$env:PG_RESTORE_URL --no-owner --no-acl backup-postgres.dump`. Um projeto Supabase novo já contém esquemas gerenciados; planeje a migração desses esquemas e das identidades `auth.users` antes de importar nele. Se houver objetos no destino, resolva os conflitos antes de repetir; não use `--clean` sem planejar a perda de dados.
3. Envie os arquivos do manifesto aos mesmos buckets e caminhos pelo painel do Storage ou por um script de importação controlado. Preserve os nomes e tipos MIME originais.
4. Rode `supabase/audits/security_audit.sql` no destino e compare arquivos órfãos, registros sem arquivo e permissões. Teste o catálogo e a área administrativa antes de considerar a recuperação concluída.

Nunca restaure por cima da produção sem um plano de indisponibilidade e uma cópia recente verificada.
