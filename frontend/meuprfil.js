let usuarioLogado = null;
let dadosOriginais = {};

// ============================================
// FUNÇÕES DE UTILITÁRIO
// ============================================

// Função para verificar autenticação
function checkAuth() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = './login.html';
        return null;
    }
    return JSON.parse(usuario);
}

// Função para obter iniciais do nome (primeira letra do nome e sobrenome)
function getInitials(nome) {
    if (!nome || nome.trim() === '') return 'U';
    
    const partes = nome.trim().split(' ');
    const nomePartes = partes.filter(parte => parte.length > 0);
    
    if (nomePartes.length === 0) return 'U';
    if (nomePartes.length === 1) {
        return nomePartes[0].substring(0, 2).toUpperCase();
    }
    
    const primeiraLetra = nomePartes[0].charAt(0);
    const ultimoNome = nomePartes[nomePartes.length - 1];
    const primeiraLetraSobrenome = ultimoNome.charAt(0);
    
    return (primeiraLetra + primeiraLetraSobrenome).toUpperCase();
}

// Função para obter apenas o primeiro nome
function getPrimeiroNome(nome) {
    if (!nome) return 'Usuário';
    return nome.split(' ')[0];
}

// Função para formatar data
function formatDate(data) {
    if (!data) return 'Não informado';
    const date = new Date(data);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para formatar data apenas (sem hora)
function formatDateOnly(data) {
    if (!data) return '';
    const date = new Date(data);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// Função para validar nome (apenas letras e espaços)
function validarNome(nome) {
    const regex = /^[A-Za-zÀ-ÿ\s]+$/;
    return regex.test(nome);
}

// ============================================
// FUNÇÕES DE CARREGAMENTO E ATUALIZAÇÃO
// ============================================

// Função para carregar dados do perfil
function carregarPerfil() {
    if (!usuarioLogado) return;
    
    // Preencher campos com dados do usuário
    document.getElementById('nomeCompleto').value = usuarioLogado.nome || '';
    document.getElementById('email').value = usuarioLogado.email || '';
    document.getElementById('numeroProcesso').value = usuarioLogado.numero_processo || '';
    document.getElementById('telefone').value = usuarioLogado.telefone || '';
    
    // Formatar data de nascimento
    const dataNascimento = usuarioLogado.ano_nascimento || usuarioLogado.data_nascimento;
    document.getElementById('dataNascimento').value = formatDateOnly(dataNascimento);
    
    document.getElementById('sexo').value = usuarioLogado.sexo || '';
    document.getElementById('curso').value = usuarioLogado.curso || '';
    document.getElementById('classe').value = usuarioLogado.classe || '';
    document.getElementById('turma').value = usuarioLogado.turma || '';
    document.getElementById('sala').value = usuarioLogado.sala || '';
    document.getElementById('statusConta').value = usuarioLogado.status || 'ativo';
    document.getElementById('dataCadastro').value = formatDate(usuarioLogado.createdAt) || 'Não informado';
    document.getElementById('ultimoAcesso').value = formatDate(usuarioLogado.ultimo_acesso) || 'Primeiro acesso';
    
    // Guardar dados originais para reset
    dadosOriginais = { ...usuarioLogado };
}

// Função para atualizar interface (avatar e informações)
function atualizarInterface() {
    if (!usuarioLogado) return;
    
    // Atualizar nome do usuário na navbar
    const usuarioNome = document.getElementById('usuarioNome');
    if (usuarioNome) usuarioNome.textContent = usuarioLogado.nome || 'Usuário';
    
    // Atualizar número do processo na navbar
    const processoNumero = document.getElementById('processoNumero');
    if (processoNumero) processoNumero.textContent = usuarioLogado.numero_processo || 'Não informado';
    
    // Atualizar número do processo no mobile
    const processoNumeroMobile = document.getElementById('processoNumeroMobile');
    if (processoNumeroMobile) processoNumeroMobile.textContent = usuarioLogado.numero_processo || 'Não informado';
    
    // Atualizar saudação com o primeiro nome
    const saudacaoNome = document.getElementById('saudacaoNome');
    if (saudacaoNome) saudacaoNome.textContent = getPrimeiroNome(usuarioLogado.nome);
    
    // Calcular iniciais
    const initials = getInitials(usuarioLogado.nome);
    
    // Atualizar avatar desktop
    const usuarioAvatar = document.getElementById('usuarioAvatar');
    if (usuarioAvatar) usuarioAvatar.textContent = initials;
    
    // Atualizar avatar mobile
    const avatarMobile = document.getElementById('avatarMobile');
    if (avatarMobile) avatarMobile.textContent = initials;
    
    // Atualizar nome mobile
    const nomeMobile = document.getElementById('nomeMobile');
    if (nomeMobile) nomeMobile.textContent = usuarioLogado.nome || 'Usuário';
    
    // Atualizar imagem de perfil se houver foto salva
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    
    if (usuarioLogado.fotoPerfil && profilePreview) {
        if (profileImage) profileImage.classList.add('hidden');
        profilePreview.classList.remove('hidden');
        profilePreview.src = usuarioLogado.fotoPerfil;
        const removePhotoBtn = document.getElementById('removePhoto');
        if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
    } else if (profileImage) {
        profileImage.classList.remove('hidden');
        profileImage.textContent = initials;
        if (profilePreview) profilePreview.classList.add('hidden');
    }
    
    // Atualizar contadores (mock - depois substituir por dados reais)
    const reclamacoesCount = document.getElementById('reclamacoesCount');
    if (reclamacoesCount) reclamacoesCount.textContent = '12';
    
    const denunciasCount = document.getElementById('denunciasCount');
    if (denunciasCount) denunciasCount.textContent = '5';
    
    // Verificar notificações
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        notificationBadge.textContent = '3';
        notificationBadge.classList.remove('hidden');
    }
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE CAMPOS
// ============================================

function setupValidacaoCampos() {
    // Validar nome (apenas letras e espaços)
    const nomeInput = document.getElementById('nomeCompleto');
    if (nomeInput) {
        nomeInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
            valor = valor.replace(/\s+/g, ' ');
            this.value = valor;
            
            if (valor && !validarNome(valor)) {
                this.classList.add('border-red-500');
            } else {
                this.classList.remove('border-red-500');
            }
        });
    }
    
    // Validar turma (apenas letras e números, maiúsculo)
    const turmaInput = document.getElementById('turma');
    if (turmaInput) {
        turmaInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-z0-9]/g, '');
            valor = valor.toUpperCase();
            this.value = valor;
        });
    }
    
    // Validar sala (apenas letras e números, maiúsculo)
    const salaInput = document.getElementById('sala');
    if (salaInput) {
        salaInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-z0-9]/g, '');
            valor = valor.toUpperCase();
            this.value = valor;
        });
    }
    
    // Validar telefone (apenas números, máximo 9 dígitos)
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^0-9]/g, '');
            if (valor.length > 9) {
                valor = valor.slice(0, 9);
            }
            this.value = valor;
        });
    }
}

// ============================================
// FUNÇÕES DE UPLOAD DE FOTO
// ============================================

function setupUploadFoto() {
    const photoUpload = document.getElementById('photoUpload');
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const removePhotoBtn = document.getElementById('removePhoto');
    
    if (!photoUpload) return;
    
    // Upload de foto
    photoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            if (!file.type.match('image.*')) {
                mostrarNotificacao('Por favor, selecione apenas imagens!', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                mostrarNotificacao('A imagem deve ter no máximo 5MB!', 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(event) {
                if (profileImage) profileImage.classList.add('hidden');
                if (profilePreview) {
                    profilePreview.classList.remove('hidden');
                    profilePreview.src = event.target.result;
                }
                if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
                
                usuarioLogado.fotoPerfil = event.target.result;
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                
                mostrarNotificacao('Foto carregada com sucesso!', 'success');
            }
            
            reader.readAsDataURL(file);
        }
    });
    
    // Remover foto
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            if (photoUpload) photoUpload.value = '';
            if (profilePreview) {
                profilePreview.classList.add('hidden');
                profilePreview.src = '#';
            }
            if (profileImage) {
                profileImage.classList.remove('hidden');
                profileImage.textContent = getInitials(usuarioLogado.nome);
            }
            if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
            
            delete usuarioLogado.fotoPerfil;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            mostrarNotificacao('Foto removida com sucesso!', 'info');
        });
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS DO PERFIL
// ============================================

// Salvar perfil
function setupSalvarPerfil() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validar nome
        const nome = document.getElementById('nomeCompleto').value.trim();
        if (!nome) {
            mostrarNotificacao('O nome completo é obrigatório!', 'error');
            return;
        }
        
        if (!validarNome(nome)) {
            mostrarNotificacao('Nome inválido! Use apenas letras e espaços.', 'error');
            return;
        }
        
        // Coletar dados atualizados
        const dadosAtualizados = {
            ...usuarioLogado,
            nome: nome,
            telefone: document.getElementById('telefone').value.trim(),
            ano_nascimento: document.getElementById('dataNascimento').value,
            sexo: document.getElementById('sexo').value,
            curso: document.getElementById('curso').value,
            classe: document.getElementById('classe').value,
            turma: document.getElementById('turma').value.trim().toUpperCase(),
            sala: document.getElementById('sala').value.trim().toUpperCase()
        };
        
        // Simular requisição PUT para a API
        try {
            mostrarNotificacao('Salvando alterações...', 'info');
            
            // Descomente quando tiver a API pronta
            // const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioLogado.id}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(dadosAtualizados)
            // });
            // const resultado = await response.json();
            
            // Simular sucesso
            setTimeout(() => {
                usuarioLogado = dadosAtualizados;
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                atualizarInterface();
                carregarPerfil();
                mostrarNotificacao('Perfil atualizado com sucesso!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            mostrarNotificacao('Erro ao salvar alterações!', 'error');
        }
    });
}

// Resetar formulário
function resetForm() {
    if (!dadosOriginais) return;
    
    document.getElementById('nomeCompleto').value = dadosOriginais.nome || '';
    document.getElementById('telefone').value = dadosOriginais.telefone || '';
    document.getElementById('dataNascimento').value = formatDateOnly(dadosOriginais.ano_nascimento || dadosOriginais.data_nascimento);
    document.getElementById('sexo').value = dadosOriginais.sexo || '';
    document.getElementById('curso').value = dadosOriginais.curso || '';
    document.getElementById('classe').value = dadosOriginais.classe || '';
    document.getElementById('turma').value = dadosOriginais.turma || '';
    document.getElementById('sala').value = dadosOriginais.sala || '';
    
    mostrarNotificacao('Alterações descartadas', 'info');
}

// ============================================
// FUNÇÕES DE SEGURANÇA
// ============================================

// Alterar senha
function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarNotificacao('Preencha todos os campos de senha!', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarNotificacao('As senhas não coincidem!', 'error');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarNotificacao('A nova senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (novaSenha === senhaAtual) {
        mostrarNotificacao('A nova senha deve ser diferente da atual!', 'error');
        return;
    }
    
    mostrarNotificacao('Senha alterada com sucesso!', 'success');
    
    // Limpar campos
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarSenha').value = '';
}

// Confirmar exclusão de conta
function confirmarExclusao() {
    if (confirm('⚠️ Tem certeza que deseja excluir sua conta? Esta ação é irreversível!')) {
        if (confirm('❌ Todos os seus dados serão permanentemente removidos. Deseja continuar?')) {
            sessionStorage.removeItem('usuarioLogado');
            mostrarNotificacao('Conta excluída com sucesso!', 'success');
            
            setTimeout(() => {
                window.location.href = './login.html';
            }, 2000);
        }
    }
}

// ============================================
// FUNÇÕES DE NOTIFICAÇÃO
// ============================================

function mostrarNotificacao(mensagem, tipo) {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 ${
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'error' ? 'bg-red-500' : 
        'bg-orange-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-spinner fa-spin'}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// FUNÇÃO DE LOGOUT
// ============================================

function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = './login.html';
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    
    carregarPerfil();
    atualizarInterface();
    setupValidacaoCampos();
    setupUploadFoto();
    setupSalvarPerfil();
    
    console.log(' Perfil carregado com sucesso!');
    console.log('Nº do Processo:', usuarioLogado.numero_processo);
    console.log('Curso:', usuarioLogado.curso);
    console.log('Classe:', usuarioLogado.classe);
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.logout = logout;
window.resetForm = resetForm;
window.alterarSenha = alterarSenha;
window.confirmarExclusao = confirmarExclusao;