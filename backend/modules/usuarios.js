const express = require('express');
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Definição do modelo Usuario
const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    senha: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo: {
        type: DataTypes.ENUM('admin', 'usuario'),
        defaultValue: 'usuario'
    },
    status: {
        type: DataTypes.ENUM('ativo', 'bloqueado', 'pendente'),
        defaultValue: 'ativo'
    },
    numero_processo: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    telefone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    ano_nascimento: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    sexo: {
        type: DataTypes.ENUM('masculino', 'feminino'),
        allowNull: true
    },
    curso: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    classe: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    turma: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    sala: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    foto_perfil: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        validate: {
            isValidBase64(value) {
                if (value && !value.startsWith('data:image/')) {
                    throw new Error('Formato de imagem inválido');
                }
            }
        }
    },
    ultimo_acesso: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'usuarios',
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.senha) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha = await bcrypt.hash(usuario.senha, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('senha')) {
                const salt = await bcrypt.genSalt(10);
                usuario.senha = await bcrypt.hash(usuario.senha, salt);
            }
        }
    }
});

// ==================== ROTAS DA API ====================

// Listar todos os usuários (GET /api/usuarios)
router.get('/', async (req, res) => {
    try {
        const { online } = req.query;
        const where = {};

        if (online === 'true') {
            const limite = new Date(Date.now() - 30 * 60 * 1000);
            where.ultimo_acesso = {
                [Op.gte]: limite
            };
        }

        const usuarios = await Usuario.findAll({
            where,
            attributes: { exclude: ['senha'] },
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Criar novo usuário (POST /api/usuarios)
router.post('/', async (req, res) => {
    try {
        const { nome, email, senha, numero_processo, telefone, tipo } = req.body;
        
        // Validações
        if (!nome || !email || !senha || !numero_processo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nome, email, senha e número de processo são obrigatórios' 
            });
        }
        
        // Verificar se email já existe
        const emailExiste = await Usuario.findOne({ where: { email } });
        if (emailExiste) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email já cadastrado' 
            });
        }
        
        // Verificar se número de processo já existe
        const processoExiste = await Usuario.findOne({ where: { numero_processo } });
        if (processoExiste) {
            return res.status(400).json({ 
                success: false, 
                error: 'Número de processo já cadastrado' 
            });
        }
        
        const usuario = await Usuario.create({
            nome,
            email,
            senha,
            numero_processo,
            telefone: telefone || null,
            tipo: tipo || 'usuario',
            status: 'ativo'
        });
        
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.senha;
        
        res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: usuarioResponse
        });
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Login (POST /api/usuarios/login)
router.post('/login', async (req, res) => {
    try {
        const { email, senha, numero_processo } = req.body;
        
        let usuario;
        
        if (numero_processo) {
            usuario = await Usuario.findOne({ 
                where: { numero_processo: numero_processo }
            });
        } else if (email) {
            usuario = await Usuario.findOne({ 
                where: { email: email }
            });
        } else {
            return res.status(400).json({ 
                success: false, 
                error: 'Email ou número de processo é obrigatório' 
            });
        }
        
        if (!usuario) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciais inválidas' 
            });
        }
        
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciais inválidas' 
            });
        }
        
        if (usuario.status === 'bloqueado') {
            return res.status(403).json({ 
                success: false, 
                error: 'Usuário bloqueado. Contate o administrador.' 
            });
        }
        
        // Atualizar último acesso
        usuario.ultimo_acesso = new Date();
        await usuario.save();
        
        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email, 
                tipo: usuario.tipo 
            },
            process.env.JWT_SECRET || 'seu-segredo-jwt',
            { expiresIn: '24h' }
        );
        
        // Retornar dados sem senha
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.senha;
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            usuario: usuarioResponse
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Buscar usuário por ID (GET /api/usuarios/:id)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id, {
            attributes: { exclude: ['senha'] }
        });
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: usuario
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Atualizar usuário (PUT /api/usuarios/:id)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            nome, 
            telefone, 
            ano_nascimento, 
            sexo, 
            curso, 
            classe, 
            turma, 
            sala,
            foto_perfil,
            senhaAtual,
            novaSenha
        } = req.body;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        // Caso seja alteração de senha
        if (senhaAtual && novaSenha) {
            const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Senha atual incorreta' 
                });
            }
            
            const salt = await bcrypt.genSalt(10);
            usuario.senha = await bcrypt.hash(novaSenha, salt);
        }
        
        // Atualizar campos permitidos
        if (nome) usuario.nome = nome;
        if (telefone) usuario.telefone = telefone;
        if (ano_nascimento) usuario.ano_nascimento = ano_nascimento;
        if (sexo) usuario.sexo = sexo;
        if (curso) usuario.curso = curso;
        if (classe) usuario.classe = classe;
        if (turma) usuario.turma = turma;
        if (sala) usuario.sala = sala;
        
        // Tratar foto de perfil
        if (foto_perfil !== undefined) {
            // Se for null ou string vazia, remove a foto
            if (foto_perfil === null || foto_perfil === '') {
                usuario.foto_perfil = null;
            } 
            // Se for uma string Base64 válida, salva
            else if (typeof foto_perfil === 'string' && foto_perfil.startsWith('data:image/')) {
                // Validar tamanho (máximo 5MB em Base64)
                const tamanhoAproximado = (foto_perfil.length * 3) / 4;
                if (tamanhoAproximado > 5 * 1024 * 1024) {
                    return res.status(400).json({
                        success: false,
                        error: 'A imagem deve ter no máximo 5MB'
                    });
                }
                usuario.foto_perfil = foto_perfil;
            }
        }
        
        await usuario.save();
        
        // Retornar usuário sem a senha
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.senha;
        
        res.json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: usuarioResponse
        });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Bloquear usuário (PUT /api/usuarios/:id/bloquear)
router.put('/:id/bloquear', async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        usuario.status = 'bloqueado';
        await usuario.save();
        
        res.json({
            success: true,
            message: 'Usuário bloqueado com sucesso',
            data: { id: usuario.id, status: usuario.status }
        });
        
    } catch (error) {
        console.error('Erro ao bloquear usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Ativar usuário (PUT /api/usuarios/:id/ativar)
router.put('/:id/ativar', async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        usuario.status = 'ativo';
        await usuario.save();
        
        res.json({
            success: true,
            message: 'Usuário ativado com sucesso',
            data: { id: usuario.id, status: usuario.status }
        });
        
    } catch (error) {
        console.error('Erro ao ativar usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Excluir usuário (DELETE /api/usuarios/:id)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        await usuario.destroy();
        
        res.json({
            success: true,
            message: 'Usuário excluído com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Excluir usuário completamente com todos os dados (DELETE /api/usuarios/:id/completo)
router.delete('/:id/completo', async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        
        if (!usuario) {
            return res.status(404).json({ 
                success: false, 
                error: 'Usuário não encontrado' 
            });
        }
        
        // O CASCADE do banco vai deletar denúncias e reclamações relacionadas
        await usuario.destroy();
        
        res.json({
            success: true,
            message: 'Usuário e todos os seus dados foram excluídos permanentemente'
        });
        
    } catch (error) {
        console.error('Erro ao excluir usuário completo:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = { Usuario, router };