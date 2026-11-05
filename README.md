# Malharia Catalog

Catálogo de malhas e artesanato em React, TypeScript, Tailwind e Supabase. O atendimento é pelo WhatsApp; o site não processa pedidos nem pagamentos.

## Instalação local

1. Execute `npm ci`.
2. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do projeto Supabase correto. A chave publicável fica no navegador; **nunca** coloque a service role ou senha do banco em variáveis `VITE_*`.
3. Execute `npm run dev`. Para conferir: `npm run lint`, `npm run test:run` e `npm run build`. No PowerShell com execução de scripts bloqueada, use `npm.cmd`.

As tabelas, políticas RLS, RPCs e buckets estão em `supabase/migrations/`. Não aplique migrations em produção para experimentar. A migration `20261104000000_secure_product_images.sql` torna as imagens de produtos privadas; o frontend atual usa URLs assinadas. Siga [o plano de aplicação e recuperação](docs/deploy-step1.md) antes de alterar um banco existente.

## Publicação no Cloudflare Pages

Depois de validar a segurança em um projeto Supabase **isolado** e fazer backup:

1. Conecte o repositório ao Cloudflare Pages e escolha a branch de produção. Configure a raiz deste repositório, o comando `npm run build` e a saída `dist`.
2. Em **Settings > Environment variables**, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do projeto de destino. Não configure segredos do banco no Pages. Refaça o build se as variáveis mudarem: Vite as incorpora nos arquivos publicados.
3. Confira o endereço `*.pages.dev` por HTTPS. Abra diretamente e atualize `/catalogo`, `/produto/um-slug-valido` e `/admin/login`; o Pages serve `index.html` para rotas da SPA quando não existe `404.html` na raiz. Teste login, publicação e imagens com registros fictícios no projeto isolado antes de liberar a produção.
4. Se houver domínio próprio, adicione-o em **Pages > Custom domains**, ajuste DNS e confirme HTTPS e as mesmas rotas. Configure no Supabase Auth a URL pública final e os redirecionamentos permitidos, se o fluxo de autenticação exigir redirecionamento por email.

O compartilhamento de produtos envia a URL da página e o WhatsApp recebe essa URL na mensagem. A prévia de cada produto no WhatsApp pode mostrar apenas os metadados gerais: os robôs de prévia normalmente não executam React e o site é uma SPA estática. Prévia individual exigiria renderização no servidor ou páginas estáticas por produto, fora do escopo atual.

## Segurança, custos e recuperação

Estado em 05/11/2026: build, lint e 69 testes locais passaram. O Playwright CLI conferiu navegação, pesquisa e largura de desktop/mobile com API fictícia. Sem variáveis `SUPABASE_TEST_*` de projeto isolado, permanecem pendentes login administrativo completo, upload, exclusão, publicação, RLS, RPC, Storage, galeria e paginação com dados reais de teste. **A segurança remota não está aprovada.** `npm audit --omit=dev` encontrou zero vulnerabilidades; o audit completo encontrou 10 ocorrências moderadas em dependências de desenvolvimento ligadas a `minimatch`. A correção automática exigiria trocar a versão principal do ESLint, por isso não foi aplicada nesta etapa.

- [Roteiro de validação de RLS, RPC, Storage, upload e exclusão](docs/security-validation-step1-3.md). A segurança remota só pode ser considerada aprovada após executar o roteiro com contas e dados fictícios em projeto isolado.
- [Backup e restauração de PostgreSQL e Storage](docs/backup-restore.md). Faça backup antes de migrations e teste a restauração em projeto separado. O plano Free não inclui backup automático gerenciado.
- O plano Supabase Free inclui 2 projetos, 500 MB de banco por projeto, 1 GB de Storage e 5 GB de saída de dados, com mais 5 GB em cache. Projetos com pouca atividade podem pausar após 7 dias. Acompanhe o uso no painel; valores podem mudar. Fontes: [limites Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase), [saída de dados](https://supabase.com/docs/guides/storage/serving/bandwidth), [pausa](https://supabase.com/docs/guides/platform/free-project-pausing).
- O Cloudflare Pages Free oferece 500 builds por mês. Confira [limites](https://developers.cloudflare.com/pages/platform/limits/), [build e variáveis](https://developers.cloudflare.com/pages/configuration/build-configuration/) e [rotas da SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Rotina simples para a administradora

1. Abra `/admin/login` e entre somente com a conta administradora autorizada.
2. Cadastre uma categoria, crie o produto como rascunho, adicione fotos e revise título, descrição, disponibilidade e ordem das imagens.
3. Publique e confira o produto no catálogo pelo celular. Teste o botão do WhatsApp e o link de compartilhamento.
4. Para retirar um item, arquive-o. Exclua definitivamente somente se necessário e após conferir o backup.
5. Revise mensalmente o espaço usado no Supabase e mantenha cópias recentes do banco e do Storage em local protegido.
