// associations.js
const { Usuario } = require('./modules/usuarios');
const { Denuncia } = require('./modules/denuncias');
const { Reclamacao } = require('./modules/reclamacoes');

// Definir as associações
Usuario.hasMany(Denuncia, { foreignKey: 'usuario_id' });
Denuncia.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasMany(Reclamacao, { foreignKey: 'usuario_id' });
Reclamacao.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
  Usuario,
  Denuncia,
  Reclamacao
};