# Validação da Etapa 1 em projeto de testes

Não execute testes de escrita na produção. Aplique as migrations no projeto de testes e rode `supabase/audits/security_audit.sql` no SQL Editor. As consultas de RLS, privilégios, funções, buckets e órfãos devem ser revisadas. A seção 21 deve retornar zero linhas e a seção 22 deve retornar `false`.

Use contas separadas: visitante anônimo, usuário autenticado sem linha em `private.administradores` e administrador autorizado. Pela API REST/Storage, confirme:

| Identidade | Consulta pública | Rascunho/arquivado | Escrita/RPC administrativa | Arquivo não publicado |
| --- | --- | --- | --- | --- |
| Anônima | Permitida | Negada | Negada | Negado |
| Usuário comum | Permitida | Negada | Negada | Negado |
| Administrador | Permitida | Permitida | Permitida | Permitido |

Para cada tabela (`categorias`, `produtos`, `produto_imagens`, `secoes_home`, `home_secao_produtos`, `configuracoes_site`), teste `select`, `insert`, `update` e `delete` conforme a política esperada. Teste as RPCs `usuario_atual_e_admin`, `excluir_produto_arquivado`, `registrar_imagem_produto`, `excluir_imagem_produto`, `reordenar_imagens_produto` e as RPCs de categorias e seções. Não use apenas a proteção de rotas do navegador como evidência.

Fluxos de integridade no projeto de testes: crie rascunho, envie uma imagem válida, publique, consulte como visitante, arquive, confirme que o arquivo não pode receber uma nova URL assinada como visitante, exclua a imagem e depois o produto. Tente publicar sem imagem, registrar caminho inexistente, excluir a última imagem de produto publicado e enviar arquivo com MIME falso. Simule falha de upload/registro/remoção e rode as consultas de órfãos do arquivo de auditoria.

URLs assinadas já emitidas podem continuar válidas até expirar (uma hora). Aguarde a expiração para verificar revogação completa após arquivamento.
