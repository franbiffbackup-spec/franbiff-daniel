require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-dev',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: 'lax'
    }
}));

// Verificar credenciais
async function verificarCredenciais(usuario, senha) {
    const usuarioCorreto = usuario === process.env.ADMIN_USER;
    const senhaCorreta = await bcrypt.compare(senha, process.env.ADMIN_PASS_HASH);
    return usuarioCorreto && senhaCorreta;
}

// Middleware de autenticação
function requireAuth(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }
    
    if (req.path.startsWith('/api/') && req.path !== '/api/login' && req.path !== '/api/session') {
        return res.status(401).json({ erro: 'Não autorizado' });
    }
    
    res.redirect('/login');
}

// ROTAS PÚBLICAS

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/login', async (req, res) => {
    console.log('LOGIN - Body:', req.body);
    
    const { usuario, senha } = req.body;
    
    if (!usuario || !senha) {
        return res.status(400).json({ erro: 'Usuário e senha obrigatórios' });
    }
    
    const valido = await verificarCredenciais(usuario, senha);
    
    if (valido) {
        req.session.authenticated = true;
        req.session.usuario = usuario;
        
        req.session.save((err) => {
            if (err) {
                console.error('ERRO ao salvar sessão:', err);
                return res.status(500).json({ erro: 'Erro ao criar sessão' });
            }
            
            console.log('SESSÃO SALVA - ID:', req.sessionID);
            res.json({ sucesso: true });
        });
    } else {
        res.status(401).json({ erro: 'Credenciais inválidas' });
    }
});

app.get('/api/session', (req, res) => {
    res.json({ 
        autenticado: !!req.session.authenticated,
        usuario: req.session.usuario || null
    });
});

// ROTAS PROTEGIDAS
app.use(requireAuth);
app.use(express.static('public'));

// Função para ler Excel
function getDadosComRotas(nomeArquivo) {
    const filePath = path.join(__dirname, 'dados', nomeArquivo);
    if (!fs.existsSync(filePath)) return { erro: 'Arquivo não encontrado' };

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const dataExcel = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const rotasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados', 'rotas.json'), 'utf-8'));

    const dadosFinais = dataExcel.map(linha => {
        const nomeVendedor = linha['Nome Vendedor'] ? linha['Nome Vendedor'].trim() : '';
        const codRota = rotasData.vendedores[nomeVendedor] || 'Sem Rota Definida';
        const nomeRota = rotasData.nomes_rotas[codRota] || codRota;

        return {
            ...linha,
            "Cod Rota": codRota,
            "Nome Rota": nomeRota
        };
    });

    return dadosFinais;
}

app.get('/api/venda-geral', (req, res) => res.json(getDadosComRotas('1.xlsx')));
app.get('/api/franbiff', (req, res) => res.json(getDadosComRotas('2.xlsx')));
app.get('/api/prats', (req, res) => res.json(getDadosComRotas('3.xlsx')));
app.get('/api/rotas', (req, res) => {
    const rotasData = JSON.parse(fs.readFileSync(path.join(__dirname, 'dados', 'rotas.json'), 'utf-8'));
    res.json(rotasData);
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ erro: 'Erro ao fazer logout' });
        res.json({ sucesso: true });
    });
});

app.get('/', (req, res) => {
    console.log('ACESSANDO / - Autenticado?', !!req.session.authenticated);
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor: http://localhost:${PORT}`);
});