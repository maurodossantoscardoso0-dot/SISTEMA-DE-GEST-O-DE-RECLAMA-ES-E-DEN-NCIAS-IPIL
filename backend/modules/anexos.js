// modules/anexos.js
const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { Denuncia } = require('./denuncias');
const { Reclamacao } = require('./reclamacoes');

const router = express.Router();

// Modelo de Anexo
const Anexo = sequelize.define('anexo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    denuncia_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'denuncias',
            key: 'id'
        }
    },
    reclamacao_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'reclamacoes',
            key: 'id'
        }
    },
    nome: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tamanho: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    base64: {
        type: DataTypes.TEXT('long'),
        allowNull: false
    },
    data_upload: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'anexos',
    timestamps: false
});

// ============================================
// ROTA PARA SALVAR ANEXO
// ============================================
router.post('/', async (req, res) => {
    try {
        const { denuncia_id, reclamacao_id, nome, tipo, tamanho, base64 } = req.body;
        
        console.log('📎 Recebendo anexo:', { nome, tipo, tamanho, denuncia_id, reclamacao_id });
        
        // Validar se pelo menos um ID foi fornecido
        if (!denuncia_id && !reclamacao_id) {
            return res.status(400).json({ 
                success: false,
                error: 'É necessário informar denuncia_id ou reclamacao_id' 
            });
        }
        
        const anexo = await Anexo.create({
            denuncia_id: denuncia_id || null,
            reclamacao_id: reclamacao_id || null,
            nome,
            tipo,
            tamanho,
            base64
        });
        
        console.log(' Anexo salvo com sucesso! ID:', anexo.id);
        
        res.json({ 
            success: true, 
            message: 'Anexo salvo com sucesso',
            anexo: {
                id: anexo.id,
                nome: anexo.nome,
                tipo: anexo.tipo,
                tamanho: anexo.tamanho,
                data_upload: anexo.data_upload
            }
        });
        
    } catch (error) {
        console.error(' Erro ao salvar anexo:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================
// ROTA PARA BUSCAR ANEXOS DE UMA DENÚNCIA
// ============================================
router.get('/denuncia/:id', async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (usuario_id) {
            const denuncia = await Denuncia.findByPk(req.params.id);
            if (!denuncia) {
                return res.status(404).json({ success: false, error: 'Denúncia não encontrada' });
            }
            if (denuncia.usuario_id != usuario_id) {
                return res.status(403).json({ success: false, error: 'Você não tem permissão para ver estes anexos' });
            }
        }

        const anexos = await Anexo.findAll({ 
            where: { denuncia_id: req.params.id },
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'data_upload', 'base64']
        });
        
        res.json({ 
            success: true,
            anexos: anexos 
        });
        
    } catch (error) {
        console.error(' Erro ao buscar anexos da denúncia:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================
// ROTA PARA BUSCAR ANEXOS DE UMA RECLAMAÇÃO
// ============================================
router.get('/reclamacao/:id', async (req, res) => {
    try {
        const { usuario_id } = req.query;
        if (usuario_id) {
            const reclamacao = await Reclamacao.findByPk(req.params.id);
            if (!reclamacao) {
                return res.status(404).json({ success: false, error: 'Reclamação não encontrada' });
            }
            if (reclamacao.usuario_id != usuario_id) {
                return res.status(403).json({ success: false, error: 'Você não tem permissão para ver estes anexos' });
            }
        }

        const anexos = await Anexo.findAll({ 
            where: { reclamacao_id: req.params.id },
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'data_upload', 'base64']
        });
        
        res.json({ 
            success: true,
            anexos: anexos 
        });
        
    } catch (error) {
        console.error(' Erro ao buscar anexos da reclamação:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ============================================
// ROTA PARA BAIXAR ANEXO POR ID
// ============================================
router.get('/:id/download', async (req, res) => {
    try {
        const anexo = await Anexo.findByPk(req.params.id);

        if (!anexo) {
            return res.status(404).json({ success: false, error: 'Anexo não encontrado' });
        }

        const base64Data = anexo.base64;
        const buffer = Buffer.from(base64Data.replace(/^data:.+;base64,/, ''), 'base64');
        res.setHeader('Content-Type', anexo.tipo || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${anexo.nome}"`);
        res.send(buffer);
    } catch (error) {
        console.error(' Erro ao baixar anexo:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ROTA PARA BUSCAR ANEXO POR ID
// ============================================
router.get('/:id', async (req, res) => {
    try {
        const anexo = await Anexo.findByPk(req.params.id, {
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'data_upload', 'base64', 'denuncia_id', 'reclamacao_id']
        });

        if (!anexo) {
            return res.status(404).json({ success: false, error: 'Anexo não encontrado' });
        }

        res.json({ success: true, anexo });
    } catch (error) {
        console.error(' Erro ao buscar anexo por ID:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ROTA PARA DELETAR ANEXO
// ============================================
router.delete('/:id', async (req, res) => {
    try {
        const anexo = await Anexo.findByPk(req.params.id);
        
        if (!anexo) {
            return res.status(404).json({ 
                success: false,
                error: 'Anexo não encontrado' 
            });
        }
        
        await anexo.destroy();
        
        res.json({ 
            success: true,
            message: 'Anexo removido com sucesso' 
        });
        
    } catch (error) {
        console.error(' Erro ao deletar anexo:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
module.exports.Anexo = Anexo;