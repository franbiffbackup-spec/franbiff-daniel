const bcrypt = require('bcryptjs');

// Verifica se usuário está logado
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    
    // Se for requisição API, retorna 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ erro: 'Não autorizado' });
    }
    
    // Se for página, redireciona para login
    res.redirect('/login');
}

// Verifica credenciais
async function verificarCredenciais(usuario, senha) {
    const usuarioCorreto = usuario === process.env.ADMIN_USER;
    const senhaCorreta = await bcrypt.compare(senha, process.env.ADMIN_PASS_HASH);
    
    return usuarioCorreto && senhaCorreta;
}

module.exports = { requireAuth, verificarCredenciais };