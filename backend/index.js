const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./db');

// Importar os módulos de rotas
const denunciasRoutes = require('./modules/denuncias');
const reclamacoesRoutes = require('./modules/reclamacoes');
const { router: usuariosRoutes, Usuario } = require('./modules/usuarios');
const anexosRoutes = require('./modules/anexos');

// Importar os modelos
const { Denuncia } = require('./modules/denuncias');
const { Reclamacao } = require('./modules/reclamacoes');
const { Anexo } = require('./modules/anexos');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Middleware para log de requisições
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Servir arquivos estáticos (front-end)
app.use(express.static(path.join(__dirname, '../')));

// Rotas da API
app.use('/api/denuncias', denunciasRoutes);
app.use('/api/reclamacoes', reclamacoesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/anexos', anexosRoutes);

// Rota de teste
app.get('/', (req, res) => {
    res.json({ 
        message: 'API SGRD - Sistema de Gestão de Reclamações e Denúncias',
        status: 'online',
        version: '1.0.0',
        endpoints: {
            usuarios: '/api/usuarios',
            denuncias: '/api/denuncias',
            reclamacoes: '/api/reclamacoes',
            anexos: '/api/anexos',
            health: '/health'
        }
    });
});

// Rota de health check
app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ 
            status: 'OK',
            timestamp: new Date(),
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR',
            timestamp: new Date(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// Rota para estatísticas gerais
app.get('/api/estatisticas/gerais', async (req, res) => {
    try {
        const [usuariosCount, denunciasCount, reclamacoesCount, anexosCount] = await Promise.all([
            Usuario.count(),
            Denuncia.count(),
            Reclamacao.count(),
            Anexo.count()
        ]);
        
        const [denunciasPorStatus, reclamacoesPorStatus] = await Promise.all([
            Denuncia.findAll({
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
                group: ['status']
            }),
            Reclamacao.findAll({
                attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
                group: ['status']
            })
        ]);
        
        res.json({
            success: true,
            data: {
                total_usuarios: usuariosCount,
                total_denuncias: denunciasCount,
                total_reclamacoes: reclamacoesCount,
                total_anexos: anexosCount,
                denuncias_por_status: denunciasPorStatus,
                reclamacoes_por_status: reclamacoesPorStatus
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas gerais:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        error: 'Rota não encontrada',
        path: req.originalUrl
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('Erro no servidor:', err);
    res.status(500).json({ 
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Função para verificar e criar usuário admin padrão
async function ensureDefaultAdmin() {
    try {
        const adminExists = await Usuario.findOne({ 
            where: { 
                numero_processo: '00001',
                tipo: 'admin'
            } 
        });
        
        if (!adminExists) {
            console.log('Admin padrão não encontrado. Criando...');
            
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            const admin = await Usuario.create({
                nome: 'Administrador do Sistema',
                email: 'admin@sistema.com',
                senha: hashedPassword,
                tipo: 'admin',
                status: 'ativo',
                numero_processo: '00001',
                telefone: '(00) 00000-0000',
                curso: 'Administração',
                endereco: 'Sistema'
            });
            
            console.log('Usuário administrador padrão criado!');
            console.log('Número de processo: 00001');
            console.log('Senha: admin123');
            return admin;
        } else {
            console.log('Admin padrão já existe com número de processo: 00001');
            return adminExists;
        }
    } catch (error) {
        console.error('Erro ao verificar/criar administrador padrão:', error.message);
        return null;
    }
}

// Função para verificar e criar relacionamentos
async function setupAssociations() {
    try {
        // Importar os modelos novamente para garantir que estão atualizados
        const { Usuario } = require('./modules/usuarios');
        const { Denuncia } = require('./modules/denuncias');
        const { Reclamacao } = require('./modules/reclamacoes');
        const { Anexo } = require('./modules/anexos');
        
        // Relacionamentos Usuario -> Denuncia
        Usuario.hasMany(Denuncia, { 
            foreignKey: 'usuario_id', 
            onDelete: 'CASCADE',
            as: 'denuncias'  // Adicionar alias específico
        });
        Denuncia.belongsTo(Usuario, { 
            foreignKey: 'usuario_id',
            as: 'usuario'  // Adicionar alias específico
        });
        
        // Relacionamentos Usuario -> Reclamacao
        Usuario.hasMany(Reclamacao, { 
            foreignKey: 'usuario_id', 
            onDelete: 'CASCADE',
            as: 'reclamacoes'  // Adicionar alias específico
        });
        Reclamacao.belongsTo(Usuario, { 
            foreignKey: 'usuario_id',
            as: 'usuario'  // Adicionar alias específico
        });
        
        // Relacionamentos Denuncia -> Anexo (corrigido)
        Denuncia.hasMany(Anexo, { 
            foreignKey: 'denuncia_id', 
            onDelete: 'CASCADE',
            as: 'anexosDaDenuncia'  // Mudar o alias para evitar conflito
        });
        Anexo.belongsTo(Denuncia, { 
            foreignKey: 'denuncia_id',
            as: 'denuncia'  // Adicionar alias específico
        });
        
        // Relacionamentos Reclamacao -> Anexo (corrigido)
        Reclamacao.hasMany(Anexo, { 
            foreignKey: 'reclamacao_id', 
            onDelete: 'CASCADE',
            as: 'anexosDaReclamacao'  // Mudar o alias para evitar conflito
        });
        Anexo.belongsTo(Reclamacao, { 
            foreignKey: 'reclamacao_id',
            as: 'reclamacao'  // Adicionar alias específico
        });
        
        console.log('Relacionamentos entre tabelas configurados com sucesso!');
    } catch (error) {
        console.error('Erro ao configurar relacionamentos:', error);
        throw error;  // Lançar o erro para ser tratado
    }
}

// Função para sincronizar o banco de dados
async function syncDatabase() {
    try {
        console.log('Iniciando sincronização do banco de dados...');
        
        await setupAssociations();
        
        console.log('Criando/atualizando tabela: usuarios');
        await Usuario.sync({ alter: true });
        console.log('Tabela de usuários criada/atualizada com sucesso!');
        
        console.log('Criando/atualizando tabela: denuncias');
        await Denuncia.sync({ alter: true });
        console.log('Tabela de denúncias criada/atualizada com sucesso!');
        
        console.log('Criando/atualizando tabela: reclamacoes');
        await Reclamacao.sync({ alter: true });
        console.log('Tabela de reclamações criada/atualizada com sucesso!');
        
        console.log('Criando/atualizando tabela: anexos');
        await Anexo.sync({ alter: true });
        console.log('Tabela de anexos criada/atualizada com sucesso!');
        
        await ensureDefaultAdmin();
        
        console.log('Banco de dados sincronizado com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao sincronizar o banco de dados:', error);
        
        if (error.name === 'SequelizeDatabaseError' && error.parent && (error.parent.errno === 150 || error.parent.code === 'ER_NO_REFERENCED_ROW')) {
            console.log('Erro de chave estrangeira detectado. Tentando recriar as tabelas...');
            
            try {
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
                
                await Usuario.sync({ force: true });
                console.log('Tabela de usuários recriada com sucesso!');
                
                await Denuncia.sync({ force: true });
                console.log('Tabela de denúncias recriada com sucesso!');
                
                await Reclamacao.sync({ force: true });
                console.log('Tabela de reclamações recriada com sucesso!');
                
                await Anexo.sync({ force: true });
                console.log('Tabela de anexos recriada com sucesso!');
                
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
                
                await ensureDefaultAdmin();
                
                console.log('Banco de dados recriado com sucesso!');
                return true;
            } catch (recreateError) {
                console.error('Erro ao recriar as tabelas:', recreateError);
                await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
                return false;
            }
        }
        
        return false;
    }
}

// Função para iniciar o servidor
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
        
        const dbSynced = await syncDatabase();
        
        if (!dbSynced) {
            console.warn('Banco de dados sincronizado com avisos. O servidor continuará, mas algumas funcionalidades podem não funcionar corretamente.');
        }
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\nServidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
            console.log(`API disponível em: http://localhost:${PORT}/api`);
            console.log(`\nDocumentação da API:`);
            console.log(`   ┌─────────────────────────────────────────┐`);
            console.log(`   │ GET  /                                    │`);
            console.log(`   │ GET  /health                              │`);
            console.log(`   │ GET  /api/estatisticas/gerais            │`);
            console.log(`   │                                           │`);
            console.log(`   │ USUÁRIOS:                                 │`);
            console.log(`   │ GET    /api/usuarios                      │`);
            console.log(`   │ POST   /api/usuarios                      │`);
            console.log(`   │ POST   /api/usuarios/login                │`);
            console.log(`   │ GET    /api/usuarios/:id                  │`);
            console.log(`   │ PUT    /api/usuarios/:id                  │`);
            console.log(`   │ DELETE /api/usuarios/:id                  │`);
            console.log(`   │ DELETE /api/usuarios/:id/completo        │`);
            console.log(`   │ PUT    /api/usuarios/:id/bloquear        │`);
            console.log(`   │ PUT    /api/usuarios/:id/ativar          │`);
            console.log(`   │                                           │`);
            console.log(`   │ DENÚNCIAS:                                │`);
            console.log(`   │ GET    /api/denuncias                     │`);
            console.log(`   │ POST   /api/denuncias                     │`);
            console.log(`   │ GET    /api/denuncias/usuario/:usuarioId │`);
            console.log(`   │ GET    /api/denuncias/minhas/:usuario_id │`);
            console.log(`   │ GET    /api/denuncias/:id                 │`);
            console.log(`   │ PUT    /api/denuncias/:id                 │`);
            console.log(`   │ PATCH  /api/denuncias/:id/status         │`);
            console.log(`   │ DELETE /api/denuncias/:id                 │`);
            console.log(`   │                                           │`);
            console.log(`   │ RECLAMAÇÕES:                              │`);
            console.log(`   │ GET    /api/reclamacoes                   │`);
            console.log(`   │ POST   /api/reclamacoes                   │`);
            console.log(`   │ GET    /api/reclamacoes/usuario/:usuarioId│`);
            console.log(`   │ GET    /api/reclamacoes/minhas/:usuario_id│`);
            console.log(`   │ GET    /api/reclamacoes/:id               │`);
            console.log(`   │ PUT    /api/reclamacoes/:id               │`);
            console.log(`   │ PATCH  /api/reclamacoes/:id/status       │`);
            console.log(`   │ DELETE /api/reclamacoes/:id               │`);
            console.log(`   │                                           │`);
            console.log(`   │ ANEXOS:                                   │`);
            console.log(`   │ POST   /api/anexos                        │`);
            console.log(`   │ GET    /api/anexos/denuncia/:id           │`);
            console.log(`   │ GET    /api/anexos/reclamacao/:id         │`);
            console.log(`   └─────────────────────────────────────────┘`);
            
            console.log(`\nDADOS DE ACESSO DO ADMIN:`);
            console.log(`   ┌─────────────────────────────────────────┐`);
            console.log(`   │ Nº Processo: 00001                       │`);
            console.log(`   │ Senha: admin123                          │`);
            console.log(`   │ Email: admin@sistema.com                 │`);
            console.log(`   └─────────────────────────────────────────┘`);
        });
        
    } catch (error) {
        console.error('Erro fatal ao iniciar o servidor:', error);
        process.exit(1);
    }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
    console.error('Stack trace:', error.stack);
});

process.on('unhandledRejection', (error) => {
    console.error('Promessa rejeitada não tratada:', error);
    console.error('Stack trace:', error.stack);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Recebido sinal SIGTERM. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Recebido sinal SIGINT. Encerrando servidor...');
    process.exit(0);
});

// Iniciar o servidor
startServer();

module.exports = app;