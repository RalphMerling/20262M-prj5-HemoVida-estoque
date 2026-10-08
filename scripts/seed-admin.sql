-- Primeiro administrador
--
-- POST /user sempre cria com role = 'user', de proposito: a rota e publica e
-- nao pode ser porta de entrada para virar admin. Entao o primeiro admin
-- nasce por fora da API, com este script.
--
-- ANTES de rodar, gere o hash da senha:
--   node scripts/gerar-hash.js "SuaSenhaForte"
--
-- Depois substitua os tres valores marcados com <...> e execute no HeidiSQL.
--
-- Lembre-se: o banco e compartilhado pela turma e a coluna email e UNIQUE.
-- Use suas iniciais ou matricula para nao colidir com o colega do lado.

INSERT INTO usuarios (nome, email, senha, role, createdAt, updatedAt)
VALUES (
  'Admin <SUAS INICIAIS>',
  'admin.<suas-iniciais>@exemplo.com',
  '<COLE AQUI O HASH GERADO>',
  'admin',
  NOW(),
  NOW()
);

-- Conferindo (a senha aparece como hash, nunca em texto puro):
-- SELECT id, nome, email, role, LEFT(senha, 7) AS inicio_do_hash
-- FROM usuarios WHERE role = 'admin';
