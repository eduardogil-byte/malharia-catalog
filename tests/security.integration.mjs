// Run explicitly with `node tests/security.integration.mjs` against an isolated Supabase.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const required = [
  "SUPABASE_TEST_URL",
  "SUPABASE_TEST_ANON_KEY",
  "SUPABASE_TEST_USER_EMAIL",
  "SUPABASE_TEST_USER_PASSWORD",
  "SUPABASE_TEST_ADMIN_EMAIL",
  "SUPABASE_TEST_ADMIN_PASSWORD",
];
for (const name of required) {
  assert.ok(process.env[name], `Defina ${name} para o projeto isolado.`);
}

const base = new URL(process.env.SUPABASE_TEST_URL);
const local = ["localhost", "127.0.0.1"].includes(base.hostname);
if (local) {
  assert.equal(base.port, "54321", "Use a porta padrão do Supabase local.");
} else {
  assert.ok(process.env.SUPABASE_TEST_PROJECT_REF, "Defina o ref do projeto isolado.");
  assert.equal(base.protocol, "https:", "O projeto remoto precisa usar HTTPS.");
  assert.equal(
    base.hostname,
    `${process.env.SUPABASE_TEST_PROJECT_REF}.supabase.co`,
    "A URL deve corresponder ao ref do projeto de testes.",
  );
  assert.equal(
    process.env.SUPABASE_TEST_CONFIRM_ISOLATED,
    "PROJETO_DESCARTAVEL",
    "Confirme explicitamente que o projeto remoto é descartável.",
  );
}

const anonKey = process.env.SUPABASE_TEST_ANON_KEY;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=",
  "base64",
);
const id = randomUUID();
const slug = `seguranca-${id}`;
const bucket = "catalogo-produtos";
let adminToken;
let userToken;
let categoryId;
let productId;
let imageId;
const uploaded = new Set();

async function call(path, { token, method = "GET", body, headers = {} } = {}) {
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body && !Buffer.isBuffer(body) ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : Buffer.isBuffer(body) ? body : JSON.stringify(body),
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  return { status: response.status, data };
}

function ok(result, label) {
  assert.ok(result.status >= 200 && result.status < 300,
    `${label}: HTTP ${result.status} ${JSON.stringify(result.data)}`);
  return result.data;
}

function denied(result, label) {
  assert.ok(result.status >= 400 && result.status < 500,
    `${label}: esperava recusa, recebeu HTTP ${result.status}`);
}

function rest(table, token, options = {}) {
  return call(`/rest/v1/${table}${options.query ?? ""}`, {
    token,
    method: options.method,
    body: options.body,
    headers: options.headers,
  });
}

function rpc(name, token, args = {}) {
  return call(`/rest/v1/rpc/${name}`, { token, method: "POST", body: args });
}

function objectPath(path) {
  return `/storage/v1/object/${bucket}/${path}`;
}

function sign(path, token) {
  return call(`/storage/v1/object/sign/${bucket}/${path}`, {
    token, method: "POST", body: { expiresIn: 60 },
  });
}

function remove(path, token) {
  return call(`/storage/v1/object/${bucket}`, {
    token, method: "DELETE", body: { prefixes: [path] },
  });
}

async function login(email, password) {
  const data = ok(await call("/auth/v1/token?grant_type=password", {
    method: "POST", body: { email, password },
  }), `login ${email}`);
  assert.ok(data.access_token);
  return data.access_token;
}

async function upload(path, contentType = "image/png") {
  const result = await call(objectPath(path), {
    token: adminToken, method: "POST", body: png,
    headers: { "Content-Type": contentType, "x-upsert": "false" },
  });
  if (result.status < 300) uploaded.add(path);
  return result;
}

async function cleanup() {
  if (productId) {
    await rest("produtos", adminToken, {
      query: `?id=eq.${productId}`, method: "PATCH", body: { status: "arquivado" },
    });
    if (imageId) await rpc("excluir_imagem_produto", adminToken, { p_imagem_id: imageId });
    for (const path of uploaded) {
      await remove(path, adminToken);
    }
    await rpc("excluir_produto_arquivado", adminToken, { p_produto_id: productId });
  }
  if (categoryId) {
    await rest("categorias", adminToken, {
      query: `?id=eq.${categoryId}`, method: "DELETE",
    });
  }
}

async function main() {
  userToken = await login(process.env.SUPABASE_TEST_USER_EMAIL, process.env.SUPABASE_TEST_USER_PASSWORD);
  adminToken = await login(process.env.SUPABASE_TEST_ADMIN_EMAIL, process.env.SUPABASE_TEST_ADMIN_PASSWORD);
  assert.equal(ok(await rpc("usuario_atual_e_admin", userToken), "RPC usuário comum"), false);
  assert.equal(ok(await rpc("usuario_atual_e_admin", adminToken), "RPC admin"), true);
  denied(await rpc("usuario_atual_e_admin"), "RPC anônimo");

  for (const [label, token] of [["anônimo", undefined], ["comum", userToken]]) {
    denied(await rest("categorias", token, {
      method: "POST", body: { nome: "Negada", slug: `${slug}-${label}`, posicao: 987654 },
    }), `categoria insert ${label}`);
    denied(await rpc("registrar_imagem_produto", token, {
      p_produto_id: randomUUID(), p_storage_path: "produtos/inexistente.png",
    }), `RPC registro ${label}`);
    denied(await rpc("excluir_produto_arquivado", token, {
      p_produto_id: randomUUID(),
    }), `RPC exclusão ${label}`);
    denied(await call(objectPath(`produtos/${randomUUID()}/negada.png`), {
      token, method: "POST", body: png, headers: { "Content-Type": "image/png" },
    }), `upload ${label}`);
  }
  console.log("OK: identidades, RPC e escrita administrativa");

  const category = ok(await rest("categorias", adminToken, {
    method: "POST", body: { nome: `Teste ${id.slice(0, 8)}`, slug, posicao: 987654 },
    headers: { Prefer: "return=representation" },
  }), "criar categoria");
  categoryId = category[0].id;
  const product = ok(await rest("produtos", adminToken, {
    method: "POST", body: { categoria_id: categoryId, nome: "Produto Teste", slug, status: "rascunho" },
    headers: { Prefer: "return=representation" },
  }), "criar rascunho");
  productId = product[0].id;

  for (const token of [undefined, userToken]) {
    assert.deepEqual(ok(await rest("produtos", token, {
      query: `?id=eq.${productId}&select=id`,
    }), "RLS rascunho"), []);
    const attempt = await rest("produtos", token, {
      query: `?id=eq.${productId}`, method: "PATCH", body: { status: "publicado" },
      headers: { Prefer: "return=representation" },
    });
    assert.ok(attempt.status >= 400 || (Array.isArray(attempt.data) && attempt.data.length === 0),
      "A publicação por não admin deve ser recusada ou afetar zero linhas.");
  }
  denied(await rest("produtos", adminToken, {
    query: `?id=eq.${productId}`, method: "PATCH", body: { status: "publicado" },
  }), "publicar sem imagem");
  denied(await rpc("registrar_imagem_produto", adminToken, {
    p_produto_id: productId,
    p_storage_path: `produtos/${productId}/inexistente.png`,
  }), "registrar arquivo inexistente");

  const path = `produtos/${productId}/${id}.png`;
  denied(await upload(path, "text/plain"), "upload MIME não permitido");
  ok(await upload(path), "upload PNG");
  denied(await sign(path), "assinar arquivo ainda sem registro");
  const orphanPath = `produtos/${productId}/${randomUUID()}.png`;
  ok(await upload(orphanPath), "upload para simular falha de registro");
  denied(await rpc("registrar_imagem_produto", adminToken, {
    p_produto_id: randomUUID(), p_storage_path: orphanPath,
  }), "registro com produto inexistente");
  ok(await remove(orphanPath, adminToken),
    "compensar upload após falha de registro");
  uploaded.delete(orphanPath);
  denied(await sign(orphanPath, adminToken), "arquivo compensado não deve existir");
  imageId = ok(await rpc("registrar_imagem_produto", adminToken, {
    p_produto_id: productId, p_storage_path: path, p_alt_text: "Teste de segurança",
  }), "registrar imagem");
  ok(await sign(path, adminToken), "admin pode assinar imagem de rascunho");
  for (const token of [undefined, userToken]) {
    assert.deepEqual(ok(await rest("produto_imagens", token, {
      query: `?produto_id=eq.${productId}&select=id`,
    }), "RLS imagem de rascunho"), []);
    denied(await sign(path, token), "assinar imagem de rascunho");
    denied(await rpc("excluir_imagem_produto", token, { p_imagem_id: imageId }),
      "excluir imagem sem ser admin");
    await remove(path, token);
    ok(await sign(path, adminToken), "exclusão por não admin não pode remover arquivo");
  }
  denied(await call(`/storage/v1/object/public/${bucket}/${path}`), "URL pública de bucket privado");
  console.log("OK: rascunho privado e falhas de publicação, registro e MIME");

  ok(await rest("produtos", adminToken, {
    query: `?id=eq.${productId}`, method: "PATCH", body: { status: "publicado" },
  }), "publicar");
  for (const token of [undefined, userToken]) {
    assert.equal(ok(await rest("produtos", token, {
      query: `?id=eq.${productId}&select=id`,
    }), "produto publicado").length, 1);
    assert.equal(ok(await rest("produto_imagens", token, {
      query: `?produto_id=eq.${productId}&select=id`,
    }), "imagem publicada").length, 1);
    const signed = ok(await sign(path, token), "URL assinada publicada");
    assert.ok(signed.signedURL || signed.signedUrl);
    const signedPath = signed.signedURL?.startsWith("/object/")
      ? `/storage/v1${signed.signedURL}`
      : signed.signedURL || signed.signedUrl;
    const image = await fetch(new URL(signedPath, base));
    assert.equal(image.status, 200, "Imagem publicada deve ser exibida.");
    assert.ok((await image.arrayBuffer()).byteLength > 0);
  }
  denied(await rpc("excluir_imagem_produto", adminToken, { p_imagem_id: imageId }),
    "excluir última imagem publicada");
  await remove(path, adminToken);
  ok(await sign(path, adminToken), "arquivo registrado deve resistir à exclusão direta");
  denied(await rpc("excluir_produto_arquivado", adminToken, { p_produto_id: productId }),
    "excluir produto publicado");
  console.log("OK: imagem publicada e proteção contra exclusão prematura");

  ok(await rest("produtos", adminToken, {
    query: `?id=eq.${productId}`, method: "PATCH", body: { status: "arquivado" },
  }), "arquivar");
  for (const token of [undefined, userToken]) {
    assert.deepEqual(ok(await rest("produtos", token, {
      query: `?id=eq.${productId}&select=id`,
    }), "RLS arquivado"), []);
    denied(await sign(path, token), "nova URL assinada após arquivamento");
  }
  ok(await sign(path, adminToken), "admin mantém acesso ao arquivo arquivado");
  ok(await rpc("excluir_imagem_produto", adminToken, { p_imagem_id: imageId }),
    "excluir registro de imagem arquivada");
  imageId = undefined;
  ok(await remove(path, adminToken),
    "excluir arquivo arquivado");
  uploaded.delete(path);
  ok(await rpc("excluir_produto_arquivado", adminToken, { p_produto_id: productId }),
    "excluir produto arquivado");
  productId = undefined;
  console.log("OK: arquivamento, recusa de novas assinaturas e exclusão");
}

try {
  await main();
} finally {
  if (adminToken) await cleanup();
}
