const bcrypt = require('bcryptjs');

const senha = process.argv[2] || 'sua-senha-aqui';

bcrypt.hash(senha, 10).then(hash => {
    console.log('\nSenha:', senha);
    console.log('Hash para .env:', hash);
    console.log('\nCopie o hash e cole em ADMIN_PASS_HASH no .env\n');
});