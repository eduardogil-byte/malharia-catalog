# Aplicação e recuperação da migration de imagens

Migration: `20261104000000_secure_product_images.sql`. Aplique primeiro em um projeto Supabase isolado. Não use `supabase db push` com o projeto de produção vinculado durante a validação.

1. Faça os backups de PostgreSQL e Storage descritos em `backup-restore.md`; confira o manifesto e teste uma restauração isolada.
2. No projeto de testes, aplique as migrations versionadas na ordem do repositório e execute `security_audit.sql`. A seção 21 deve retornar zero linhas; a seção 22 deve retornar `false`.
3. Com contas de teste anônima, comum e administradora, execute o roteiro de `security-validation.md`. Valide a criação de URLs assinadas para imagens publicadas e a negação de novas URLs após arquivamento.
4. Faça o deploy do frontend atualizado junto com a migration, em janela controlada: o frontend antigo usa URLs públicas e deixará de mostrar imagens quando o bucket se tornar privado.
5. Verifique catálogo, página do produto, home, edição de imagens e novos acessos a rascunhos e arquivados. Monitore erros de Storage e arquivos órfãos.

## Recuperação

Se a aplicação falhar após a migration, mantenha o bucket privado. Corrija e publique o frontend compatível ou restaure o backup em um projeto Supabase isolado e verificado, depois direcione o tráfego para ele. Reverter apenas o frontend deixa as imagens indisponíveis; tornar o bucket público novamente reabre o acesso indevido a arquivos de rascunhos e arquivados. Não faça rollback SQL em produção sem um plano de recuperação aprovado.

URLs assinadas emitidas antes de um arquivamento podem funcionar até seu prazo de uma hora. O frontend renova as URLs a cada 45 minutos ou quando a aba volta a ficar visível e consulta novamente o status do produto.
