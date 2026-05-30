const sequelize = require('../db');
const { DataTypes } = require('sequelize');

async function addFotoPerfilColumn() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        // Verificar se a coluna já existe
        const [results] = await sequelize.query(`
            SHOW COLUMNS FROM usuarios LIKE 'foto_perfil'
        `);
        
        if (results.length === 0) {
            console.log('📸 Adicionando coluna foto_perfil à tabela usuarios...');
            await queryInterface.addColumn('usuarios', 'foto_perfil', {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                comment: 'Armazena a foto de perfil do usuário em formato Base64'
            });
            console.log('✅ Coluna foto_perfil adicionada com sucesso!');
        } else {
            console.log('ℹ️ Coluna foto_perfil já existe na tabela usuarios.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao adicionar coluna:', error);
        process.exit(1);
    }
}

// Executar a migration
addFotoPerfilColumn();