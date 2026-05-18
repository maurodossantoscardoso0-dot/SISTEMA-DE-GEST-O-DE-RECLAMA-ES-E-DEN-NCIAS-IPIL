const express = require('express');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../db');
const router = express.Router();

// ============================================
// FUNÇÃO PARA CONVERTER DATA DD/MM/YYYY PARA YYYY-MM-DD
// ============================================
function converterDataParaMySQL(dataBrasil) {
    if (!dataBrasil) return null;
    if (dataBrasil.match(/^\d{4}-\d{2}-\d{2}$/)) return dataBrasil;
    
    const partes = dataBrasil.split('/');
    if (partes.length === 3) {
        const dia = partes[0].padStart(2, '0');
        const mes = partes[1].padStart(2, '0');
        const ano = partes[2];
        return `${ano}-${mes}-${dia}`;
    }
    return null;
}

// Definição do model Usuario
const Usuario = sequelize.define('usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  ano_nascimento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'ano_nascimento',
    get() {
      const rawValue = this.getDataValue('ano_nascimento');
      if (!rawValue) return null;
      const data = new Date(rawValue);
      const dia = data.getDate().toString().padStart(2, '0');
      const mes = (data.getMonth() + 1).toString().padStart(2, '0');
      const ano = data.getFullYear();
      return `${dia}/${mes}/${ano}`;
    },
    set(val) {
      const convertida = converterDataParaMySQL(val);
      this.setDataValue('ano_nascimento', convertida);
    }
  },
  sexo: {
    type: DataTypes.ENUM('masculino', 'feminino'),
    allowNull: true
  },
  curso: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  numero_processo: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
    field: 'numero_processo'
  },
  classe: {
    type: DataTypes.ENUM('decima', 'decima_primeira', 'decima_segunda', 'decima_terceira'),
    allowNull: true
  },
  turma: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  sala: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  cpf: {
    type: DataTypes.STRING(14),
    unique: true,
    allowNull: true
  },
  endereco: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('cidadao', 'funcionario', 'admin'),
    defaultValue: 'cidadao'
  },
  status: {
    type: DataTypes.ENUM('ativo', 'inativo', 'bloqueado'),
    defaultValue: 'ativo'
  },
  ultimo_acesso: {
    type: DataTypes.DATE,
    allowNull: true
  },
  motivo_bloqueio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bloqueado_por: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        const saltRounds = 10;
        const hash = await bcrypt.hash(usuario.senha, saltRounds);
        usuario.senha = hash;
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha') && usuario.senha) {
        const saltRounds = 10;
        const hash = await bcrypt.hash(usuario.senha, saltRounds);
        usuario.senha = hash;
      }
    }
  }
});

// ============================================
// MÉTODO PARA VERIFICAR SENHA
// ============================================
Usuario.prototype.verificarSenha = async function(senhaDigitada) {
  return await bcrypt.compare(senhaDigitada, this.senha);
};

// ============================================
// MÉTODO ESTÁTICO PARA LOGIN
// ============================================
Usuario.login = async function(numero_processo, senha) {
  try {
    const user = await Usuario.findOne({ 
      where: { numero_processo: numero_processo.toString() } 
    });
    
    if (!user) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    if (user.status !== 'ativo') {
      return { success: false, error: `Esta conta está ${user.status}` };
    }
    
    const senhaValida = await bcrypt.compare(senha, user.senha);
    
    if (!senhaValida) {
      return { success: false, error: 'Senha inválida' };
    }
    
    await user.update({ ultimo_acesso: new Date() });
    
    const usuarioData = user.toJSON();
    delete usuarioData.senha;
    
    return { success: true, usuario: usuarioData };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ROTA DE CADASTRO - ACEITA DATA DD/MM/YYYY
// ============================================
router.post('/', async (req, res) => {
  try {
    console.log('📝 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    // 🔥 IMPORTANTE: A data já será convertida automaticamente pelo getter/setter do modelo
    const usuario = await Usuario.create(req.body);
    
    const usuarioSemSenha = usuario.toJSON();
    delete usuarioSemSenha.senha;
    
    console.log('✅ Usuário cadastrado com sucesso! ID:', usuario.id);
    
    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      usuario: usuarioSemSenha
    });
    
  } catch (error) {
    console.error('❌ Erro no cadastro:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        error: 'Email ou número de processo já está cadastrado' 
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
  try {
    const { numero_processo, senha } = req.body;
    
    if (!numero_processo || !senha) {
      return res.status(400).json({ 
        success: false,
        error: 'Número de processo e senha são obrigatórios' 
      });
    }
    
    const resultado = await Usuario.login(numero_processo, senha);
    
    if (resultado.success) {
      res.json({
        success: true,
        message: 'Login realizado com sucesso!',
        usuario: resultado.usuario
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: resultado.error 
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro interno no servidor: ' + error.message 
    });
  }
});

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['senha'] },
      order: [['nome', 'ASC']]
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['senha'] }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar usuário por email
router.get('/email/:email', async (req, res) => {
  try {
    const user = await Usuario.findOne({
      where: { email: req.params.email },
      attributes: { exclude: ['senha'] }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar usuário por número de processo
router.get('/processo/:numero_processo', async (req, res) => {
  try {
    const user = await Usuario.findOne({
      where: { numero_processo: req.params.numero_processo },
      attributes: { exclude: ['senha'] }
    });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (user) {
      await user.update(req.body);
      
      const usuarioSemSenha = user.toJSON();
      delete usuarioSemSenha.senha;
      
      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso!',
        usuario: usuarioSemSenha
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.json({ 
        success: true,
        message: 'Usuário removido com sucesso' 
      });
    } else {
      res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }
  } catch (error) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// EXCLUSÃO COMPLETA
router.delete('/:id/completo', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const user = await Usuario.findByPk(req.params.id, { transaction });
    
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }
    
    if (user.tipo === 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        error: 'Não é possível excluir usuários administradores'
      });
    }
    
    let denunciasCount = 0;
    let reclamacoesCount = 0;
    
    try {
      const [denunciasResult] = await sequelize.query(
        'DELETE FROM denuncias WHERE usuario_id = :usuario_id',
        { replacements: { usuario_id: user.id }, transaction }
      );
      denunciasCount = denunciasResult.affectedRows || 0;
    } catch (err) {}
    
    try {
      const [reclamacoesResult] = await sequelize.query(
        'DELETE FROM reclamacoes WHERE usuario_id = :usuario_id',
        { replacements: { usuario_id: user.id }, transaction }
      );
      reclamacoesCount = reclamacoesResult.affectedRows || 0;
    } catch (err) {}
    
    const nomeUsuario = user.nome;
    await user.destroy({ transaction });
    await transaction.commit();
    
    res.json({ 
      success: true,
      message: `✅ Usuário "${nomeUsuario}" excluído completamente!`
    });
    
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ 
      success: false,
      error: 'Erro ao excluir usuário: ' + error.message 
    });
  }
});

// BLOQUEAR USUÁRIO
router.put('/:id/bloquear', async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }
    
    await user.update({
      status: 'bloqueado',
      motivo_bloqueio: req.body.motivo_bloqueio || 'Motivo não informado',
      bloqueado_por: req.body.bloqueado_por || 'Administrador'
    });
    
    const usuarioSemSenha = user.toJSON();
    delete usuarioSemSenha.senha;
    
    res.json({
      success: true,
      message: 'Usuário bloqueado com sucesso',
      usuario: usuarioSemSenha
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ATIVAR USUÁRIO
router.put('/:id/ativar', async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'Usuário não encontrado' 
      });
    }
    
    await user.update({
      status: 'ativo',
      motivo_bloqueio: null,
      bloqueado_por: null
    });
    
    const usuarioSemSenha = user.toJSON();
    delete usuarioSemSenha.senha;
    
    res.json({
      success: true,
      message: 'Usuário ativado com sucesso',
      usuario: usuarioSemSenha
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;
module.exports.Usuario = Usuario;