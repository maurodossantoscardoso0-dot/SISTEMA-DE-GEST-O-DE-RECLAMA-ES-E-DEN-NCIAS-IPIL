// meuperfil.js - Script da página de Perfil do Administrador

let usuarioAtual = null;

// ============================================
// VERIFICAR ADMIN (NÃO PODE SER EXCLUÍDO)
// ============================================
function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    
    usuarioAtual = JSON.parse(usuarioLogado);
    
    if (usuarioAtual.tipo !== 'admin') {
        alert('⛔ Acesso negado! Esta página é apenas para administradores.');
        window.location.href = '../usuario/dashboard.html';
        return null;
    }
    
    return usuarioAtual;
}

// ============================================
// CARREGAR DADOS DO PERFIL
// ============================================
async function carregarPerfil() {
    if (!usuarioAtual) return;
    
    try {
        console.log('🔄 Carregando perfil do administrador...');
        
        // Buscar dados atualizados do usuário no servidor
        const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioAtual.id}`);
        
        if (response.ok) {
            const usuarioAtualizado = await response.json();
            usuarioAtual = usuarioAtualizado;
            // Atualizar sessionStorage
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        }
        
        // Preencher todos os campos do formulário
        preencherDadosPerfil();
        
        // Atualizar informações na navbar
        atualizarNavbar();
        
        console.log('✅ Perfil carregado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar perfil:', error);
        // Se falhar, usa os dados do sessionStorage
        preencherDadosPerfil();
        atualizarNavbar();
        showToast('error', 'Erro ao carregar dados do servidor. Mostrando dados locais.');
    }
}

// ============================================
// PREENCHER DADOS DO PERFIL NO FORMULÁRIO
// ============================================
function preencherDadosPerfil() {
    if (!usuarioAtual) return;
    
    // Preencher campos do formulário
    document.getElementById('nomeCompleto').value = usuarioAtual.nome || '';
    document.getElementById('email').value = usuarioAtual.email || '';
    document.getElementById('numeroProcesso').value = usuarioAtual.numeroProcesso || 'ADMIN-' + usuarioAtual.id;
    document.getElementById('telefone').value = usuarioAtual.telefone || '';
    document.getElementById('dataNascimento').value = usuarioAtual.dataNascimento || '';
    document.getElementById('sexo').value = usuarioAtual.sexo || '';
    document.getElementById('curso').value = usuarioAtual.curso || '';
    document.getElementById('classe').value = usuarioAtual.classe || '';
    document.getElementById('turma').value = usuarioAtual.turma || '';
    document.getElementById('sala').value = usuarioAtual.sala || '';
    
    // Status da conta (admin não pode ser alterado)
    const statusConta = document.getElementById('statusConta');
    if (statusConta) {
        statusConta.value = 'Administrador (Conta Protegida)';
        statusConta.classList.add('bg-orange-50', 'text-orange-700', 'font-medium');
    }
    
    // Atualizar saudações
    const saudacaoNome = document.getElementById('saudacaoNome');
    if (saudacaoNome) {
        const primeiroNome = usuarioAtual.nome?.split(' ')[0] || 'Administrador';
        saudacaoNome.innerText = primeiroNome;
    }
    
    // Atualizar avatar
    atualizarAvatar(usuarioAtual.nome);
}

// ============================================
// ATUALIZAR NAVBAR
// ============================================
function atualizarNavbar() {
    if (!usuarioAtual) return;
    
    const nome = usuarioAtual.nome || 'Administrador';
    const primeiroNome = nome.split(' ')[0];
    const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    // Nome do usuário na navbar
    const usuarioNomeSpan = document.getElementById('usuarioNome');
    if (usuarioNomeSpan) usuarioNomeSpan.innerText = nome;
    
    // Número do processo
    const processoNumero = document.getElementById('processoNumero');
    if (processoNumero) processoNumero.innerText = 'ADMIN-' + usuarioAtual.id;
    
    // Avatar
    const usuarioAvatar = document.getElementById('usuarioAvatar');
    if (usuarioAvatar) usuarioAvatar.innerText = iniciais;
    
    // Mobile
    const avatarMobile = document.getElementById('avatarMobile');
    if (avatarMobile) avatarMobile.innerText = iniciais;
    
    const nomeMobile = document.getElementById('nomeMobile');
    if (nomeMobile) nomeMobile.innerText = primeiroNome;
    
    const processoNumeroMobile = document.getElementById('processoNumeroMobile');
    if (processoNumeroMobile) processoNumeroMobile.innerText = 'ADMIN-' + usuarioAtual.id;
}

// ============================================
// ATUALIZAR AVATAR
// ============================================
function atualizarAvatar(nome) {
    const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.innerText = iniciais;
        profileImage.classList.remove('hidden');
    }
    
    const profilePreview = document.getElementById('profilePreview');
    if (profilePreview) {
        profilePreview.classList.add('hidden');
    }
}

// ============================================
// SALVAR ALTERAÇÕES DO PERFIL
// ============================================
async function salvarPerfil(event) {
    event.preventDefault();
    
    if (!usuarioAtual) return;
    
    // Validar campos obrigatórios
    const nome = document.getElementById('nomeCompleto').value.trim();
    if (!nome) {
        showToast('error', 'O nome completo é obrigatório');
        return;
    }
    
    // Coletar dados do formulário
    const dadosAtualizados = {
        id: usuarioAtual.id,
        nome: nome,
        telefone: document.getElementById('telefone').value,
        dataNascimento: document.getElementById('dataNascimento').value,
        sexo: document.getElementById('sexo').value,
        curso: document.getElementById('curso').value,
        classe: document.getElementById('classe').value,
        turma: document.getElementById('turma').value,
        sala: document.getElementById('sala').value,
        email: usuarioAtual.email, // Email não pode ser alterado
        tipo: 'admin' // Mantém como admin
    };
    
    try {
        showToast('info', 'Salvando alterações...');
        
        const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioAtual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizados)
        });
        
        if (response.ok) {
            const resultado = await response.json();
            usuarioAtual = resultado.data || resultado;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
            
            preencherDadosPerfil();
            atualizarNavbar();
            
            showToast('success', 'Perfil atualizado com sucesso!');
        } else {
            const erro = await response.json();
            showToast('error', erro.error || 'Erro ao atualizar perfil');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        showToast('error', 'Erro de conexão com o servidor');
    }
}

// ============================================
// ALTERAR SENHA
// ============================================
async function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        showToast('error', 'Preencha todos os campos de senha');
        return;
    }
    
    if (novaSenha.length < 6) {
        showToast('error', 'A nova senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        showToast('error', 'As senhas não coincidem');
        return;
    }
    
    try {
        showToast('info', 'Verificando senha atual...');
        
        // Verificar senha atual
        const loginResponse = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: usuarioAtual.email,
                senha: senhaAtual
            })
        });
        
        if (!loginResponse.ok) {
            showToast('error', 'Senha atual incorreta');
            return;
        }
        
        // Atualizar senha
        const response = await fetch(`http://localhost:3000/api/usuarios/${usuarioAtual.id}/senha`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha: novaSenha })
        });
        
        if (response.ok) {
            // Limpar campos
            document.getElementById('senhaAtual').value = '';
            document.getElementById('novaSenha').value = '';
            document.getElementById('confirmarSenha').value = '';
            
            showToast('success', 'Senha alterada com sucesso!');
            
            // Opcional: forçar logout após 3 segundos
            setTimeout(() => {
                if (confirm('Senha alterada com sucesso! Deseja fazer login novamente?')) {
                    logout();
                }
            }, 3000);
        } else {
            const erro = await response.json();
            showToast('error', erro.error || 'Erro ao alterar senha');
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        showToast('error', 'Erro de conexão com o servidor');
    }
}

// ============================================
// RESETAR FORMULÁRIO
// ============================================
function resetForm() {
    if (confirm('Tem certeza que deseja cancelar as alterações? Todas as modificações não salvas serão perdidas.')) {
        preencherDadosPerfil();
        showToast('info', 'Alterações canceladas');
    }
}

// ============================================
// CONFIRMAR EXCLUSÃO DE CONTA (NÃO PERMITIDO PARA ADMIN)
// ============================================
function confirmarExclusao() {
    // ADMIN NUNCA PODE EXCLUIR A CONTA
    showToast('error', '⛔ Acesso Negado! Contas de administrador não podem ser excluídas por motivos de segurança.');
    
    // Feedback visual no botão
    const btnExcluir = document.querySelector('.bg-red-600');
    if (btnExcluir) {
        btnExcluir.style.opacity = '0.5';
        btnExcluir.style.cursor = 'not-allowed';
        setTimeout(() => {
            btnExcluir.style.opacity = '1';
            btnExcluir.style.cursor = 'pointer';
        }, 2000);
    }
}

// ============================================
// FUNÇÃO PARA FOTO DE PERFIL (ADMIN PODE TER FOTO)
// ============================================
function setupPhotoUpload() {
    const photoInput = document.getElementById('photoUpload');
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const removePhotoBtn = document.getElementById('removePhoto');
    
    // Verificar se já existe foto salva
    const fotoSalva = localStorage.getItem(`foto_admin_${usuarioAtual?.id}`);
    if (fotoSalva) {
        profilePreview.src = fotoSalva;
        profilePreview.classList.remove('hidden');
        profileImage.classList.add('hidden');
        if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
    }
    
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const imageUrl = event.target.result;
                    profilePreview.src = imageUrl;
                    profilePreview.classList.remove('hidden');
                    profileImage.classList.add('hidden');
                    
                    // Salvar no localStorage
                    localStorage.setItem(`foto_admin_${usuarioAtual?.id}`, imageUrl);
                    
                    if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
                    showToast('success', 'Foto atualizada com sucesso!');
                };
                reader.readAsDataURL(file);
            } else {
                showToast('error', 'Por favor, selecione um arquivo de imagem válido');
            }
        });
    }
    
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            profilePreview.src = '#';
            profilePreview.classList.add('hidden');
            profileImage.classList.remove('hidden');
            photoInput.value = '';
            localStorage.removeItem(`foto_admin_${usuarioAtual?.id}`);
            removePhotoBtn.classList.add('hidden');
            showToast('info', 'Foto removida com sucesso');
        });
    }
}

// ============================================
// TOAST DE NOTIFICAÇÃO
// ============================================
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-orange-500'
    }`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============================================
// CONFIGURAR TEMA/AUTENTICAÇÃO 2FA
// ============================================
function setupTwoFactor() {
    const twoFactorCheckbox = document.getElementById('twoFactor');
    if (twoFactorCheckbox) {
        // Verificar se 2FA está ativado
        const twoFactorAtivo = localStorage.getItem(`2fa_admin_${usuarioAtual?.id}`) === 'true';
        twoFactorCheckbox.checked = twoFactorAtivo;
        
        twoFactorCheckbox.addEventListener('change', function(e) {
            if (e.target.checked) {
                showToast('info', 'Autenticação em duas etapas ativada! Para maior segurança, recomenda-se usar um aplicativo autenticador.');
                localStorage.setItem(`2fa_admin_${usuarioAtual?.id}`, 'true');
            } else {
                showToast('info', 'Autenticação em duas etapas desativada');
                localStorage.setItem(`2fa_admin_${usuarioAtual?.id}`, 'false');
            }
        });
    }
}

// ============================================
// LOGOUT
// ============================================
function logout() {
    // Criar modal de confirmação
    const existingModal = document.getElementById('logoutConfirmModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Adicionar estilos
    if (!document.getElementById('logoutStyles')) {
        const style = document.createElement('style');
        style.id = 'logoutStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .modal-slide-in { animation: slideIn 0.3s ease; }
            .toast-slide-in { animation: slideInRight 0.3s ease; }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden modal-slide-in">
            <!-- Cabeçalho -->
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-sign-out-alt text-orange-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Sair do Sistema</h3>
                </div>
            </div>
            
            <!-- Corpo -->
            <div class="px-6 py-6 text-center">
                <i class="fas fa-question-circle text-orange-500 text-5xl mb-4"></i>
                <p class="text-gray-700 text-base mb-2">Tem certeza que deseja sair?</p>
                <p class="text-gray-500 text-sm">Você será redirecionado para a página de login.</p>
            </div>
            
            <!-- Botões -->
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button id="logoutCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button id="logoutConfirmBtn" class="px-5 py-2 bg-orange-500 text-white rounded-lg transition transform hover:scale-105 font-medium shadow-md">
                    <i class="fas fa-check mr-2"></i>Sair
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    
    // Confirmar logout
    document.getElementById('logoutConfirmBtn')?.addEventListener('click', () => {
        closeModal();
        
        // Mostrar toast de sucesso
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 bg-green-500 text-white toast-slide-in';
        toast.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Sessão encerrada com sucesso!';
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 1500);
        
        // Limpar sessão e REDIRECIONAR PARA O LOGIN
        setTimeout(() => {
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('token');
            window.location.href = '../login.html';
        }, 500);
    });
    
    // Cancelar logout
    document.getElementById('logoutCancelBtn')?.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// CARREGAR ESTATÍSTICAS DO USUÁRIO
// ============================================
async function carregarEstatisticas() {
    try {
        // Buscar denúncias do admin (todas)
        const denunciasResponse = await fetch('http://localhost:3000/api/denuncias');
        const denuncias = await denunciasResponse.json();
        
        // Buscar reclamações do admin (todas)
        const reclamacoesResponse = await fetch('http://localhost:3000/api/reclamacoes');
        const reclamacoes = await reclamacoesResponse.json();
        
        // Atualizar badges
        const denunciasCount = document.getElementById('denunciasCount');
        if (denunciasCount) denunciasCount.innerText = Array.isArray(denuncias) ? denuncias.length : 0;
        
        const reclamacoesCount = document.getElementById('reclamacoesCount');
        if (reclamacoesCount) reclamacoesCount.innerText = Array.isArray(reclamacoes) ? reclamacoes.length : 0;
        
        // Atualizar notificações (exemplo)
        const totalPendentes = (Array.isArray(denuncias) ? denuncias.filter(d => d.status === 'pendente').length : 0) +
                               (Array.isArray(reclamacoes) ? reclamacoes.filter(r => r.status === 'aberta').length : 0);
        
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            if (totalPendentes > 0) {
                notificationBadge.innerText = totalPendentes;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Inicialização
async function init() {
    // Verificar se é admin
    const admin = verificarAdmin();
    if (!admin) return;
    
    // Carregar perfil
    await carregarPerfil();
    
    // Carregar estatísticas
    await carregarEstatisticas();
    
    // Configurar upload de foto
    setupPhotoUpload();
    
    // Configurar 2FA
    setupTwoFactor();
    
    // Event listener do formulário
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', salvarPerfil);
    }
    
    console.log(' Página de perfil do administrador inicializada com sucesso!');
    console.log(' Lembrete: Contas de administrador NÃO podem ser excluídas por segurança.');
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);