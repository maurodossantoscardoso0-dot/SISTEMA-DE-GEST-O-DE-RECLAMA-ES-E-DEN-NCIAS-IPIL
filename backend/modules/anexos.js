// modules/anexos.js
const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

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
        
        console.log('✅ Anexo salvo com sucesso! ID:', anexo.id);
        
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
        console.error('❌ Erro ao salvar anexo:', error);
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
        const anexos = await Anexo.findAll({ 
            where: { denuncia_id: req.params.id },
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'data_upload', 'base64']
        });
        
        res.json({ 
            success: true,
            anexos: anexos 
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar anexos da denúncia:', error);
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
        const anexos = await Anexo.findAll({ 
            where: { reclamacao_id: req.params.id },
            attributes: ['id', 'nome', 'tipo', 'tamanho', 'data_upload', 'base64']
        });
        
        res.json({ 
            success: true,
            anexos: anexos 
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar anexos da reclamação:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
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
        console.error('❌ Erro ao deletar anexo:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

module.exports = router;
module.exports.Anexo = Anexo;