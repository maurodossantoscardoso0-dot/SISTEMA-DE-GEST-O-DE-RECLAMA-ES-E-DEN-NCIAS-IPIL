const { Sequelize } = require('sequelize');

// Configuração do banco de dados
const sequelize = new Sequelize('sgrd', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port: 3306,
  logging: true, // Mude para true se quiser ver as queries SQL no console
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
    underscored: true, // Usa snake_case para nomes de colunas
    freezeTableName: false // Permite que o Sequelize pluralize os nomes das tabelas
  }
});

// Testar a conexão
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
  }
}

testConnection();

module.exports = sequelize;