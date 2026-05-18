const express = require('express');
const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const router = express.Router();

// Definição do modelo Denuncia
const Denuncia = sequelize.define('Denuncia', {
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
  tipo: {
    type: DataTypes.ENUM('infraestrutura', 'saude', 'educacao', 'meio-ambiente', 'seguranca', 'saneamento', 'outro'),
    defaultValue: 'outro'
  },
  status: {
    type: DataTypes.ENUM('pendente', 'em_andamento', 'concluida', 'arquivada'),
    defaultValue: 'pendente'
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
    defaultValue: () => 'DEN-' + Date.now().toString(36).toUpperCase()
  }
}, {
  tableName: 'denuncias',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// ============================================
// ROTAS CRUD PARA DENÚNCIAS
// ============================================

// Listar todas as denúncias (ADMIN usa sem filtro)
router.get('/', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    
    let where = {};
    
    if (usuario_id) {
      where.usuario_id = usuario_id;
    }
    
    const denuncias = await Denuncia.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    res.json(denuncias);
  } catch (error) {
    console.error('Erro ao listar denúncias:', error);
    res.status(500).json({ error: error.message });
  }
});

// ROTA PARA BUSCAR DENÚNCIAS POR USUÁRIO (ADMIN)
router.get('/usuario/:usuarioId', async (req, res) => {
  try {
    const denuncias = await Denuncia.findAll({
      where: { usuario_id: req.params.usuarioId },
      order: [['createdAt', 'DESC']]
    });
    res.json(denuncias);
  } catch (error) {
    console.error('Erro ao buscar denúncias por usuário:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar denúncias do usuário logado
router.get('/minhas/:usuario_id', async (req, res) => {
  try {
    const denuncias = await Denuncia.findAll({
      where: { usuario_id: req.params.usuario_id },
      order: [['createdAt', 'DESC']]
    });
    res.json(denuncias);
  } catch (error) {
    console.error('Erro ao buscar minhas denúncias:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar denúncia por ID
router.get('/:id', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const denuncia = await Denuncia.findByPk(req.params.id);
    
    if (!denuncia) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    if (!denuncia.anonimo && usuario_id && denuncia.usuario_id != usuario_id) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta denúncia' });
    }
    
    res.json(denuncia);
  } catch (error) {
    console.error('Erro ao buscar denúncia por ID:', error);
    res.status(500).json({ error: error.message });
  }
});

// Buscar denúncia por protocolo
router.get('/protocolo/:protocolo', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    const denuncia = await Denuncia.findOne({
      where: { protocolo: req.params.protocolo }
    });
    
    if (!denuncia) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    if (!denuncia.anonimo && usuario_id && denuncia.usuario_id != usuario_id) {
      return res.status(403).json({ error: 'Você não tem permissão para ver esta denúncia' });
    }
    
    res.json(denuncia);
  } catch (error) {
    console.error('Erro ao buscar denúncia por protocolo:', error);
    res.status(500).json({ error: error.message });
  }
});

// Criar nova denúncia
router.post('/', async (req, res) => {
  try {
    console.log('📝 Dados recebidos para denúncia:', req.body);
    
    if (!req.body.titulo || !req.body.descricao) {
      return res.status(400).json({ 
        success: false,
        error: 'Título e descrição são obrigatórios' 
      });
    }
    
    const dadosDenuncia = {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      tipo: req.body.tipo || 'outro',
      data_ocorrencia: req.body.data_ocorrencia || new Date().toISOString().split('T')[0],
      local: req.body.local || 'Não informado',
      anexos: req.body.anexos || [],
      anonimo: req.body.anonimo || false,
      usuario_id: req.body.anonimo ? null : req.body.usuario_id,
      status: 'pendente'
    };
    
    console.log('📦 Dados preparados para inserção:', dadosDenuncia);
    
    const denuncia = await Denuncia.create(dadosDenuncia);
    
    console.log('✅ Denúncia criada com sucesso! Protocolo:', denuncia.protocolo);
    
    res.status(201).json({
      success: true,
      message: 'Denúncia criada com sucesso',
      data: denuncia,
      protocolo: denuncia.protocolo
    });
  } catch (error) {
    console.error('❌ Erro ao criar denúncia:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ATUALIZAR DENÚNCIA
router.put('/:id', async (req, res) => {
  try {
    const denuncia = await Denuncia.findByPk(req.params.id);
    
    if (!denuncia) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    await denuncia.update(req.body);
    
    console.log('✅ Denúncia atualizada com sucesso! ID:', denuncia.id);
    
    res.json({
      success: true,
      message: 'Denúncia atualizada com sucesso',
      data: denuncia
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar denúncia:', error);
    res.status(400).json({ error: error.message });
  }
});

// ATUALIZAR APENAS O STATUS
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const denuncia = await Denuncia.findByPk(req.params.id);
    
    if (!denuncia) {
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    const statusValidos = ['pendente', 'em_andamento', 'concluida', 'arquivada'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }
    
    await denuncia.update({ status });
    
    console.log(`✅ Status da denúncia ${denuncia.id} atualizado para: ${status}`);
    
    res.json({
      success: true,
      message: 'Status atualizado com sucesso',
      data: denuncia
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETAR DENÚNCIA (Melhorado com verificação de permissão)
router.delete('/:id', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { usuario_id, is_admin } = req.query;
    const denuncia = await Denuncia.findByPk(req.params.id, { transaction });
    
    if (!denuncia) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Denúncia não encontrada' });
    }
    
    // Verificar permissão: apenas dono ou admin pode excluir
    const isOwner = denuncia.usuario_id && denuncia.usuario_id == usuario_id;
    const isAdmin = is_admin === 'true';
    
    if (!isOwner && !isAdmin) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'Você não tem permissão para excluir esta denúncia' 
      });
    }
    
    await denuncia.destroy({ transaction });
    await transaction.commit();
    
    res.json({ 
      success: true,
      message: 'Denúncia removida com sucesso' 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao deletar denúncia:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROTAS PARA ESTATÍSTICAS (ADMIN)
// ============================================

// Obter estatísticas das denúncias
router.get('/estatisticas/resumo', async (req, res) => {
  try {
    const total = await Denuncia.count();
    const pendente = await Denuncia.count({ where: { status: 'pendente' } });
    const em_andamento = await Denuncia.count({ where: { status: 'em_andamento' } });
    const concluida = await Denuncia.count({ where: { status: 'concluida' } });
    const arquivada = await Denuncia.count({ where: { status: 'arquivada' } });
    
    res.json({
      total,
      pendente,
      em_andamento,
      concluida,
      arquivada
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.Denuncia = Denuncia;