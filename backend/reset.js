// reset-admin-password.js
const sequelize = require('./db');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    try {
        // Conectar ao banco
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        // Nova senha desejada
        const novaSenha = 'admin123'; // ALTERE AQUI PARA A SENHA QUE VOCÊ QUER
        
        // Gerar o hash da nova senha
        const hashedPassword = await bcrypt.hash(novaSenha, 10);
        
        // Atualizar a senha do admin
        const [updatedCount] = await sequelize.query(`
            UPDATE usuarios 
            SET senha = :hashedPassword 
            WHERE numero_processo = '00001' AND tipo = 'admin'
        `, {
            replacements: { hashedPassword },
            type: sequelize.QueryTypes.UPDATE
        });
        
        if (updatedCount > 0) {
            console.log(`✅ Senha do administrador alterada com sucesso!`);
            console.log(`📧 Email: admin@sistema.com`);
            console.log(`🔑 Nova senha: ${novaSenha}`);
            console.log(`📋 Nº Processo: 00001`);
        } else {
            console.log('❌ Admin não encontrado. Verifique se existe um usuário com numero_processo = 00001');
            
            // Listar admins existentes
            const admins = await sequelize.query(`
                SELECT id, nome, email, numero_processo, tipo FROM usuarios WHERE tipo = 'admin'
            `, { type: sequelize.QueryTypes.SELECT });
            
            if (admins.length > 0) {
                console.log('📋 Admins encontrados:');
                admins.forEach(admin => {
                    console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Nº Processo: ${admin.numero_processo}`);
                });
            }
        }
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao trocar senha:', error);
        await sequelize.close();
        process.exit(1);
    }
}

resetAdminPassword();