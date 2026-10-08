/**
 * Gera o hash bcrypt de uma senha, para uso no script SQL do primeiro admin.
 *
 * Uso:
 *   node scripts/gerar-hash.js "MinhaSenhaForte123"
 *
 * Por que isso e necessario: o MySQL nao tem funcao bcrypt. O hash precisa ser
 * calculado fora do banco e colado no INSERT. E tambem a demonstracao mais
 * direta de que a senha nunca e gravada em texto puro.
 */
const bcrypt = require('bcrypt');

const senha = process.argv[2];

if (!senha) {
  console.error('Informe a senha: node scripts/gerar-hash.js "SuaSenha"');
  process.exit(1);
}

if (senha.length < 8) {
  console.error('A senha deve ter no minimo 8 caracteres.');
  process.exit(1);
}

console.log(bcrypt.hashSync(senha, 12));
