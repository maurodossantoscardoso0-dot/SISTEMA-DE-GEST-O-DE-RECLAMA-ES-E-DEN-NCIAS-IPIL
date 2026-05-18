// Configuração de relacionamentos entre tabelas
const setupAssociations = (models) => {
  const { Usuario, Denuncia, Reclamacao } = models;
  
  // Usuario tem muitas Denuncias
  if (Usuario && Denuncia) {
    Usuario.hasMany(Denuncia, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
    Denuncia.belongsTo(Usuario, { foreignKey: 'usuario_id' });
  }
  
  // Usuario tem muitas Reclamacoes
  if (Usuario && Reclamacao) {
    Usuario.hasMany(Reclamacao, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
    Reclamacao.belongsTo(Usuario, { foreignKey: 'usuario_id' });
  }
  
  console.log(' Associações configuradas com sucesso!');
};

module.exports = setupAssociations;