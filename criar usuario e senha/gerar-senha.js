const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Digite a senha que deseja hashear: ', async (senha) => {
  const hash = await bcrypt.hash(senha, 10);
  console.log('\nHash gerado:', hash);
  rl.close();
});