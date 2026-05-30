const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const router = express.Router();

// Definição do model Reclamacao
const Reclamacao = sequelize.define('Reclamacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  categoria: {
    type: DataTypes.ENUM('infraestrutura', 'saude', 'educacao', 'meio-ambiente', 'seguranca', 'saneamento', 'outro'),
    defaultValue: 'outro'
  },
  status: {
    type: DataTypes.ENUM('aberta', 'em_andamento', 'resolvida', 'fechada'),
    defaultValue: 'aberta'
  },
  data_ocorrencia: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  local: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  anexos: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('anexos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('anexos', JSON.stringify(value));
    }
  },
  anonimo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  protocolo: {
    type: DataTypes.STRING(50),
    unique: true,
    defaultValue: () => 'RCL-' + Date.now().toString(36).toUpperCase()
  }
}, {
  tableName: 'reclamacoes',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// ============================================
// ROTAS CRUD PARA RECLAMAÇÕES
// ============================================

// Listar todas as reclamações (ADMIN usa sem filtro)
router.get('/', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    
    let where = {};
    
    if (usuario_id) {
      where.usuario_id = usuario_id;
    }
    
    const reclamacoes = await Reclamacao.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(reclamacoes);
  } catch (error) {
    console.error('Erro ao listar reclamações:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA BUSCAR RECLAMAÇÕES POR USUÁRIO (ADMIN)
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const reclamacoes = await Reclamacao.findAll({
      where: { usuario_id: req.params.usuarioId },
      order: [['createdAt', 'DESC']]
    });
    res.json(reclamacoes);
  } catch (error) {
    console.error('Erro ao buscar reclamações por usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar reclamações do usuário logado
router.get('/minhas/:usuario_id', async (req, res) => {
  try {
    const reclamacoes = await Reclamacao.findAll({
      where: { usuario_id: req.params.usuario_id },
      order: [['createdAt', 'DESC']]
    });
    res.json(reclamacoes);
  } catch (error) {
    console.error('Erro ao buscar minhas reclamações:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar reclamação por ID
router.get('/:id', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const reclamacao = await Reclamacao.findByPk(req.params.id);
    
    if (!reclamacao) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }
    
    if (!reclamacao.anonimo && usuario_id && reclamacao.usuario_id != usuario_id) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta reclamação' });
    }
    
    res.json(reclamacao);
  } catch (error) {
    console.error('Erro ao buscar reclamação por ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar reclamação por protocolo
router.get('/protocolo/:protocolo', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const reclamacao = await Reclamacao.findOne({
      where: { protocolo: req.params.protocolo }
    });
    
    if (!reclamacao) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }
    
    if (!reclamacao.anonimo && usuario_id && reclamacao.usuario_id != usuario_id) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta reclamação' });
    }
    
    res.json(reclamacao);
  } catch (error) {
    console.error('Erro ao buscar reclamação por protocolo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar nova reclamação
router.post('/', async (req, res) => {
  try {
    console.log(' Dados recebidos para reclamação:', req.body);
    
    if (!req.body.titulo || !req.body.descricao) {
      return res.status(400).json({ 
        success: false,
        error: 'Título e descrição são obrigatórios' 
      });
    }
    
    const dadosReclamacao = {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      categoria: req.body.categoria || 'outro',
      data_ocorrencia: req.body.data_ocorrencia || new Date().toISOString().split('T')[0],
      local: req.body.local || 'Não informado',
      anexos: req.body.anexos || [],
      anonimo: req.body.anonimo || false,
      usuario_id: req.body.anonimo ? null : req.body.usuario_id,
      status: 'aberta'
    };
    
    console.log(' Dados preparados para inserção:', dadosReclamacao);
    
    const reclamacao = await Reclamacao.create(dadosReclamacao);
    
    console.log(' Reclamação criada com sucesso! Protocolo:', reclamacao.protocolo);
    
    res.status(201).json({
      success: true,
      message: 'Reclamação criada com sucesso',
      data: reclamacao,
      protocolo: reclamacao.protocolo
    });
  } catch (error) {
    console.error(' Erro ao criar reclamação:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ATUALIZAR RECLAMAÇÃO
router.put('/:id', async (req, res) => {
  try {
    const reclamacao = await Reclamacao.findByPk(req.params.id);
    
    if (!reclamacao) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }
    
    await reclamacao.update(req.body);
    
    console.log(' Reclamação atualizada com sucesso! ID:', reclamacao.id);
    
    res.json({
      success: true,
      message: 'Reclamação atualizada com sucesso',
      data: reclamacao
    });
  } catch (error) {
    console.error(' Erro ao atualizar reclamação:', error);
    res.status(400).json({ error: error.message });
  }
});

// ATUALIZAR APENAS O STATUS
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const reclamacao = await Reclamacao.findByPk(req.params.id);
    
    if (!reclamacao) {
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }
    
    const statusValidos = ['aberta', 'em_andamento', 'resolvida', 'fechada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    await reclamacao.update({ status });
    
    console.log(` Status da reclamação ${reclamacao.id} atualizado para: ${status}`);
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: reclamacao
    });
  } catch (error) {
    console.error(' Erro ao atualizar status:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETAR RECLAMAÇÃO (Melhorado com verificação de permissão)
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { usuario_id, is_admin } = req.query;
    const reclamacao = await Reclamacao.findByPk(req.params.id, { transaction });
    
    if (!reclamacao) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Reclamação não encontrada' });
    }
    
    // Verificar permissão: apenas dono ou admin pode excluir
    const isOwner = reclamacao.usuario_id && reclamacao.usuario_id == usuario_id;
    const isAdmin = is_admin === 'true';
    
    if (!isOwner && !isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'Você não tem permissão para excluir esta reclamação' 
      });
    }
    
    await reclamacao.destroy({ transaction });
    await transaction.commit();
    
    res.json({ 
      success: true,
      message: 'Reclamação removida com sucesso' 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao deletar reclamação:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROTAS PARA ESTATÍSTICAS (ADMIN)
// ============================================

// Obter estatísticas das reclamações
router.get('/estatisticas/resumo', async (req, res) => {
  try {
    const total = await Reclamacao.count();
    const aberta = await Reclamacao.count({ where: { status: 'aberta' } });
    const em_andamento = await Reclamacao.count({ where: { status: 'em_andamento' } });
    const resolvida = await Reclamacao.count({ where: { status: 'resolvida' } });
    const fechada = await Reclamacao.count({ where: { status: 'fechada' } });
    
    res.json({
      total,
      aberta,
      em_andamento,
      resolvida,
      fechada
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.Reclamacao = Reclamacao;