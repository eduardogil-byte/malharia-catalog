-- ============================================================
-- AUDITORIA DE SEGURANÇA
-- Site Malharia TypeScript
--
-- Este arquivo contém apenas consultas de diagnóstico.
-- Ele não altera o banco de dados.
-- ============================================================


-- ============================================================
-- 1. TABELAS DO SCHEMA PUBLIC SEM RLS
--
-- Resultado esperado: nenhuma linha.
-- ============================================================

select
  namespace.nspname as schema_name,
  relation.relname as table_name,
  relation.relrowsecurity as rls_enabled,
  relation.relforcerowsecurity as force_rls_enabled
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relkind in ('r', 'p')
  and relation.relrowsecurity = false
order by relation.relname;


-- ============================================================
-- 2. SITUAÇÃO DO RLS EM TODAS AS TABELAS DO PROJETO
-- ============================================================

select
  namespace.nspname as schema_name,
  relation.relname as table_name,
  relation.relrowsecurity as rls_enabled,
  relation.relforcerowsecurity as force_rls_enabled
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname in (
  'public',
  'private'
)
  and relation.relkind in ('r', 'p')
order by
  namespace.nspname,
  relation.relname;


-- ============================================================
-- 3. POLÍTICAS RLS DAS TABELAS PUBLIC E PRIVATE
-- ============================================================

select
  policy.schemaname as schema_name,
  policy.tablename as table_name,
  policy.policyname as policy_name,
  policy.permissive,
  policy.roles,
  policy.cmd as operation,
  policy.qual as using_expression,
  policy.with_check as with_check_expression
from pg_catalog.pg_policies as policy
where policy.schemaname in (
  'public',
  'private'
)
order by
  policy.schemaname,
  policy.tablename,
  policy.cmd,
  policy.policyname;


-- ============================================================
-- 4. TABELAS PUBLIC SEM NENHUMA POLÍTICA
--
-- Nem toda tabela precisa ser acessível pelo frontend.
-- Porém, cada resultado precisa ser revisado.
-- ============================================================

select
  namespace.nspname as schema_name,
  relation.relname as table_name
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relkind in ('r', 'p')
  and relation.relrowsecurity = true
  and not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = namespace.nspname
      and policy.tablename = relation.relname
  )
order by relation.relname;


-- ============================================================
-- 5. PERMISSÕES DE TABELAS PARA ANON E AUTHENTICATED
--
-- Revisar se cada permissão realmente é necessária.
-- ============================================================

select
  grant_info.grantee,
  grant_info.table_schema,
  grant_info.table_name,
  grant_info.privilege_type,
  grant_info.is_grantable
from information_schema.role_table_grants as grant_info
where grant_info.grantee in (
  'anon',
  'authenticated'
)
  and grant_info.table_schema in (
    'public',
    'private'
  )
order by
  grant_info.grantee,
  grant_info.table_schema,
  grant_info.table_name,
  grant_info.privilege_type;


-- ============================================================
-- 6. ACESSO DIRETO ÀS TABELAS PRIVATE
--
-- Resultado esperado: nenhuma linha.
--
-- Usuários anon e authenticated não devem consultar
-- diretamente tabelas administrativas privadas.
-- ============================================================

select
  grant_info.grantee,
  grant_info.table_schema,
  grant_info.table_name,
  grant_info.privilege_type
from information_schema.role_table_grants as grant_info
where grant_info.grantee in (
  'anon',
  'authenticated'
)
  and grant_info.table_schema = 'private'
order by
  grant_info.grantee,
  grant_info.table_name,
  grant_info.privilege_type;


-- ============================================================
-- 7. PERMISSÕES DE SCHEMA
-- ============================================================

select
  role_info.role_name,
  pg_catalog.has_schema_privilege(
    role_info.role_name,
    'public',
    'USAGE'
  ) as public_usage,
  pg_catalog.has_schema_privilege(
    role_info.role_name,
    'public',
    'CREATE'
  ) as public_create,
  pg_catalog.has_schema_privilege(
    role_info.role_name,
    'private',
    'USAGE'
  ) as private_usage,
  pg_catalog.has_schema_privilege(
    role_info.role_name,
    'private',
    'CREATE'
  ) as private_create
from (
  values
    ('anon'),
    ('authenticated')
) as role_info(role_name);


-- ============================================================
-- 8. FUNÇÕES DO PROJETO
--
-- security_mode:
--   invoker = executa com as permissões do usuário
--   definer = executa com as permissões do criador
-- ============================================================

select
  namespace.nspname as schema_name,
  procedure.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(
    procedure.oid
  ) as arguments,
  case
    when procedure.prosecdef then 'definer'
    else 'invoker'
  end as security_mode,
  case procedure.provolatile
    when 'i' then 'immutable'
    when 's' then 'stable'
    when 'v' then 'volatile'
  end as volatility,
  procedure.proconfig as function_settings,
  pg_catalog.has_function_privilege(
    'anon',
    procedure.oid,
    'EXECUTE'
  ) as anon_can_execute,
  pg_catalog.has_function_privilege(
    'authenticated',
    procedure.oid,
    'EXECUTE'
  ) as authenticated_can_execute
from pg_catalog.pg_proc as procedure
join pg_catalog.pg_namespace as namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname in (
  'public',
  'private'
)
order by
  namespace.nspname,
  procedure.proname,
  arguments;


-- ============================================================
-- 9. FUNÇÕES SECURITY DEFINER SEM SEARCH_PATH EXPLÍCITO
--
-- Resultado esperado: nenhuma linha.
--
-- Toda função security definer precisa controlar o search_path.
-- ============================================================

select
  namespace.nspname as schema_name,
  procedure.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(
    procedure.oid
  ) as arguments,
  procedure.proconfig as function_settings
from pg_catalog.pg_proc as procedure
join pg_catalog.pg_namespace as namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname in (
  'public',
  'private'
)
  and procedure.prosecdef = true
  and not exists (
    select 1
    from pg_catalog.unnest(
      coalesce(
        procedure.proconfig,
        array[]::text[]
      )
    ) as setting(value)
    where setting.value like 'search_path=%'
  )
order by
  namespace.nspname,
  procedure.proname;


-- ============================================================
-- 10. FUNÇÕES PUBLIC EXECUTÁVEIS POR ANON
--
-- Cada resultado precisa ser revisado.
--
-- As RPCs administrativas normalmente não devem ser
-- executáveis por usuários deslogados.
-- ============================================================

select
  procedure.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(
    procedure.oid
  ) as arguments,
  case
    when procedure.prosecdef then 'definer'
    else 'invoker'
  end as security_mode
from pg_catalog.pg_proc as procedure
join pg_catalog.pg_namespace as namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname = 'public'
  and pg_catalog.has_function_privilege(
    'anon',
    procedure.oid,
    'EXECUTE'
  )
order by
  procedure.proname,
  arguments;


-- ============================================================
-- 11. FUNÇÕES ADMINISTRATIVAS ESPERADAS
--
-- Esta consulta facilita a conferência das RPCs do projeto.
-- ============================================================

select
  namespace.nspname as schema_name,
  procedure.proname as function_name,
  pg_catalog.pg_get_function_identity_arguments(
    procedure.oid
  ) as arguments,
  case
    when procedure.prosecdef then 'definer'
    else 'invoker'
  end as security_mode,
  procedure.proconfig as function_settings,
  pg_catalog.has_function_privilege(
    'anon',
    procedure.oid,
    'EXECUTE'
  ) as anon_can_execute,
  pg_catalog.has_function_privilege(
    'authenticated',
    procedure.oid,
    'EXECUTE'
  ) as authenticated_can_execute
from pg_catalog.pg_proc as procedure
join pg_catalog.pg_namespace as namespace
  on namespace.oid = procedure.pronamespace
where namespace.nspname in (
  'public',
  'private'
)
  and (
    procedure.proname ilike '%categoria%'
    or procedure.proname ilike '%produto%'
    or procedure.proname ilike '%imagem%'
    or procedure.proname ilike '%secao%'
    or procedure.proname ilike '%admin%'
  )
order by
  namespace.nspname,
  procedure.proname;


-- ============================================================
-- 12. VIEWS DO SCHEMA PUBLIC
--
-- Views podem ignorar RLS quando não usam security_invoker.
-- Cada resultado precisa ser revisado.
-- ============================================================

select
  namespace.nspname as schema_name,
  relation.relname as view_name,
  relation.reloptions as view_options
from pg_catalog.pg_class as relation
join pg_catalog.pg_namespace as namespace
  on namespace.oid = relation.relnamespace
where namespace.nspname = 'public'
  and relation.relkind = 'v'
order by relation.relname;


-- ============================================================
-- 13. BUCKETS DO STORAGE
-- ============================================================

select
  bucket.id,
  bucket.name,
  bucket.public,
  bucket.file_size_limit,
  bucket.allowed_mime_types
from storage.buckets as bucket
order by bucket.id;


-- ============================================================
-- 14. POLÍTICAS DO STORAGE
-- ============================================================

select
  policy.policyname as policy_name,
  policy.roles,
  policy.cmd as operation,
  policy.qual as using_expression,
  policy.with_check as with_check_expression
from pg_catalog.pg_policies as policy
where policy.schemaname = 'storage'
  and policy.tablename = 'objects'
order by
  policy.cmd,
  policy.policyname;


-- ============================================================
-- 15. POLÍTICAS DE ESCRITA DO STORAGE PARA ANON
--
-- Resultado esperado: nenhuma linha.
-- ============================================================

select
  policy.policyname as policy_name,
  policy.roles,
  policy.cmd as operation,
  policy.qual as using_expression,
  policy.with_check as with_check_expression
from pg_catalog.pg_policies as policy
where policy.schemaname = 'storage'
  and policy.tablename = 'objects'
  and policy.cmd in (
    'ALL',
    'INSERT',
    'UPDATE',
    'DELETE'
  )
  and 'anon' = any(policy.roles)
order by
  policy.cmd,
  policy.policyname;


-- ============================================================
-- 16. OBJETOS DO STORAGE FORA DOS CAMINHOS ESPERADOS
--
-- Resultado esperado: nenhuma linha.
-- ============================================================

select
  storage_object.bucket_id,
  storage_object.name,
  storage_object.created_at
from storage.objects as storage_object
where (
  storage_object.bucket_id = 'catalogo-produtos'
  and storage_object.name not like 'produtos/%'
)
or (
  storage_object.bucket_id = 'site-assets'
  and storage_object.name not like 'marca/%'
)
order by
  storage_object.bucket_id,
  storage_object.name;


-- ============================================================
-- 17. ARQUIVOS DO STORAGE SEM REFERÊNCIA NO BANCO
--
-- Possíveis arquivos órfãos de produtos.
-- ============================================================

select
  storage_object.bucket_id,
  storage_object.name,
  storage_object.created_at
from storage.objects as storage_object
where storage_object.bucket_id = 'catalogo-produtos'
  and not exists (
    select 1
    from public.produto_imagens as product_image
    where product_image.storage_path =
      storage_object.name
  )
order by storage_object.created_at;


-- ============================================================
-- 18. REGISTROS DE IMAGEM SEM ARQUIVO NO STORAGE
--
-- Resultado esperado: nenhuma linha.
-- ============================================================

select
  product_image.id,
  product_image.produto_id,
  product_image.storage_path,
  product_image.posicao
from public.produto_imagens as product_image
where not exists (
  select 1
  from storage.objects as storage_object
  where storage_object.bucket_id =
    'catalogo-produtos'
    and storage_object.name =
      product_image.storage_path
)
order by
  product_image.produto_id,
  product_image.posicao;


-- ============================================================
-- 19. LOGO OU BANNER SEM ARQUIVO NO STORAGE
--
-- Resultado esperado: nenhuma linha.
-- ============================================================

select
  site_settings.id,
  site_settings.logo_path,
  site_settings.banner_path
from public.configuracoes_site as site_settings
where (
  site_settings.logo_path is not null
  and not exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id =
      'site-assets'
      and storage_object.name =
        site_settings.logo_path
  )
)
or (
  site_settings.banner_path is not null
  and not exists (
    select 1
    from storage.objects as storage_object
    where storage_object.bucket_id =
      'site-assets'
      and storage_object.name =
        site_settings.banner_path
  )
);


-- ============================================================
-- 20. RESUMO DAS POLÍTICAS POR TABELA
-- ============================================================

select
  policy.schemaname as schema_name,
  policy.tablename as table_name,
  pg_catalog.count(*) as policy_count,
  pg_catalog.string_agg(
    distinct policy.cmd,
    ', '
    order by policy.cmd
  ) as operations
from pg_catalog.pg_policies as policy
where policy.schemaname in (
  'public',
  'private',
  'storage'
)
group by
  policy.schemaname,
  policy.tablename
order by
  policy.schemaname,
  policy.tablename;


-- 21. PRODUTOS PUBLICADOS SEM IMAGEM VÁLIDA
-- Resultado esperado: nenhuma linha.
select produto.id, produto.slug
from public.produtos as produto
where produto.status = 'publicado'
  and not exists (
    select 1 from public.produto_imagens as imagem
    join storage.objects as objeto
      on objeto.bucket_id = 'catalogo-produtos'
      and objeto.name = imagem.storage_path
    where imagem.produto_id = produto.id
  );


-- 22. BUCKET DE PRODUTOS NÃO PODE SER PÚBLICO
-- Resultado esperado: false.
select public from storage.buckets where id = 'catalogo-produtos';
