-- Product files must not remain readable after a product is archived.
update storage.buckets set public = false where id = 'catalogo-produtos';

drop policy if exists catalogo_produtos_admin_delete on storage.objects;
create policy catalogo_produtos_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'catalogo-produtos'
  and (storage.foldername(name))[1] = 'produtos'
  and (select private.usuario_e_admin())
  and not exists (
    select 1 from public.produto_imagens as imagem
    where imagem.storage_path = name
  )
);

create policy catalogo_produtos_public_select
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'catalogo-produtos'
  and exists (
    select 1 from public.produto_imagens as imagem
    join public.produtos as produto on produto.id = imagem.produto_id
    join public.categorias as categoria on categoria.id = produto.categoria_id
    where imagem.storage_path = name
      and produto.status = 'publicado'
      and categoria.ativa
  )
);

-- A direct API update must obey the same publication rule as the UI.
create function private.validar_imagem_produto()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'publicado' and not exists (
    select 1 from public.produto_imagens as imagem
    join storage.objects as objeto
      on objeto.bucket_id = 'catalogo-produtos'
      and objeto.name = imagem.storage_path
    where imagem.produto_id = new.id
  ) then
    raise exception using errcode = '23514',
      message = 'Publique somente produtos com uma imagem válida.';
  end if;
  return new;
end;
$$;
revoke all on function private.validar_imagem_produto() from public, anon, authenticated;
create trigger produtos_validar_imagem
before insert or update of status on public.produtos
for each row execute function private.validar_imagem_produto();

-- Prevent removing the final image while the product is published.
create function private.proteger_ultima_imagem()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from public.produtos
    where id = old.produto_id and status = 'publicado'
  ) and not exists (
    select 1 from public.produto_imagens
    where produto_id = old.produto_id and id <> old.id
  ) then
    raise exception using errcode = '23514',
      message = 'Arquive o produto antes de excluir a última imagem.';
  end if;
  return old;
end;
$$;
revoke all on function private.proteger_ultima_imagem() from public, anon, authenticated;
create trigger produto_imagens_proteger_ultima
before delete on public.produto_imagens
for each row execute function private.proteger_ultima_imagem();

-- Registration cannot point to a missing file or to another product.
create function private.validar_registro_imagem()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.storage_path not like 'produtos/' || new.produto_id::text || '/%'
    or not exists (
      select 1 from storage.objects
      where bucket_id = 'catalogo-produtos' and name = new.storage_path
    ) then
    raise exception using errcode = '23514', message = 'Arquivo de imagem inválido.';
  end if;
  return new;
end;
$$;
revoke all on function private.validar_registro_imagem() from public, anon, authenticated;
create trigger produto_imagens_validar_registro
before insert or update of storage_path, produto_id on public.produto_imagens
for each row execute function private.validar_registro_imagem();
