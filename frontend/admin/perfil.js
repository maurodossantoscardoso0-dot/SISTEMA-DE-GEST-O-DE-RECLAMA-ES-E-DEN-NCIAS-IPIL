// meuperfil.js - Script da página de Perfil do Administrador

let usuarioAtual = null;

// Detectar backend local quando a página estiver sendo servida por Live Server
const API_BASE = (location.hostname === 'localhost' && location.port && location.port !== '3000') ? 'http://localhost:3000' : '';
function apiUrl(path) { return (API_BASE ? API_BASE : '') + path; }

function obterIniciaisNomeCompleto(nome) {
    if (!nome) return 'AD';
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'AD';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

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
        const response = await fetch(apiUrl(`/api/usuarios/${usuarioAtual.id}`));
        
        if (response.ok) {
            const body = await response.json();
            usuarioAtual = (body && body.data) ? body.data : body;
            // Atualizar sessionStorage
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        }
        
        // Preencher todos os campos do formulário
        preencherDadosPerfil();
        
        // Atualizar informações na navbar
        atualizarNavbar();
        
        console.log(' Perfil carregado com sucesso!');
        
    } catch (error) {
        console.error(' Erro ao carregar perfil:', error);
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
    const iniciais = obterIniciaisNomeCompleto(nome);
    
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
    const iniciais = obterIniciaisNomeCompleto(nome);
    
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
        ano_nascimento: document.getElementById('dataNascimento').value,
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
        
        const response = await fetch(apiUrl(`/api/usuarios/${usuarioAtual.id}`), {
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
        const loginResponse = await fetch(apiUrl('/api/usuarios/login'), {
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
        const response = await fetch(apiUrl(`/api/usuarios/${usuarioAtual.id}/senha`), {
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
    
    const MAX_MB = 5;

    // Verificar se já existe foto salva
    const fotoSalva = usuarioAtual?.foto_perfil || localStorage.getItem(`foto_admin_${usuarioAtual?.id}`);
    if (fotoSalva) {
        profilePreview.src = fotoSalva;
        profilePreview.classList.remove('hidden');
        profileImage.classList.add('hidden');
        if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
    }

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showToast('error', 'Por favor, selecione um arquivo de imagem válido');
                return;
            }

            if (file.size > MAX_MB * 1024 * 1024) {
                showToast('error', `A imagem é muito grande. Tamanho máximo: ${MAX_MB} MB`);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const imageUrl = event.target.result;

                // Redimensionar a imagem para evitar uploads muito grandes
                const img = new Image();
                img.onload = function() {
                    const maxDim = 1024;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxDim || h > maxDim) {
                        const ratio = Math.min(maxDim / w, maxDim / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

                    profilePreview.src = resizedDataUrl;
                    profilePreview.classList.remove('hidden');
                    profileImage.classList.add('hidden');

                    // Enviar para o backend e atualizar session/local
                    salvarFotoNoServidor(resizedDataUrl).then(result => {
                        if (result && result.success) {
                            if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
                            showToast('success', 'Foto atualizada com sucesso!');
                        } else {
                            // Fallback local
                            localStorage.setItem(`foto_admin_${usuarioAtual?.id}`, resizedDataUrl);
                            if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
                            const msg = result && result.error ? result.error : 'Foto atualizada localmente (servidor indisponível)';
                            showToast('warning', msg);
                        }
                    });
                };
                img.onerror = function() {
                    showToast('error', 'Não foi possível processar a imagem selecionada');
                };
                img.src = imageUrl;
            };
            reader.readAsDataURL(file);
        });
    }

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
            profilePreview.src = '#';
            profilePreview.classList.add('hidden');
            profileImage.classList.remove('hidden');
            photoInput.value = '';
            // Remover no servidor se possível
            fetch(apiUrl(`/api/usuarios/${usuarioAtual.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto_perfil: null })
            }).then(res => {
                if (res.ok) {
                    usuarioAtual.foto_perfil = null;
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
                    showToast('success', 'Foto removida com sucesso');
                } else {
                    localStorage.removeItem(`foto_admin_${usuarioAtual?.id}`);
                    showToast('warning', 'Foto removida localmente');
                }
            }).catch(() => {
                localStorage.removeItem(`foto_admin_${usuarioAtual?.id}`);
                showToast('warning', 'Foto removida localmente');
            });
            removePhotoBtn.classList.add('hidden');
        });
    }
}

// Função auxiliar para salvar foto no servidor
async function salvarFotoNoServidor(base64Image) {
    if (!usuarioAtual || !usuarioAtual.id) return false;
    try {
        // Função auxiliar para tentar enviar e retornar { ok, status, body }
        async function trySend(payload) {
            const r = await fetch(apiUrl(`/api/usuarios/${usuarioAtual.id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ foto_perfil: payload })
            });
            let json = null;
            try { json = await r.json(); } catch(e) { json = null; }
            return { ok: r.ok, status: r.status, body: json };
        }

        // Tenta enviar a imagem original
        console.debug('salvarFotoNoServidor: tentando enviar imagem original (comprimento:', base64Image.length, ')');
        let attempt = await trySend(base64Image);
        console.debug('salvarFotoNoServidor: resposta tentativa original', attempt);
        if (attempt.ok) {
            usuarioAtual = attempt.body?.data || attempt.body || usuarioAtual;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
            // remover fallback local caso exista
            try { localStorage.removeItem(`foto_admin_${usuarioAtual?.id}`); } catch(e){}
            return { success: true };
        }

        // Se o servidor rejeitou por tamanho, tentar recomprimir/reduzir e reenviar
        const serverMessage = attempt.body?.error || '';
        if (attempt.status === 400 && serverMessage && serverMessage.toLowerCase().includes('maximo')) {
            // tenta reduzir qualidade/dimensão progressivamente
            const compressOptions = [ {maxDim:800, quality:0.75}, {maxDim:600, quality:0.6}, {maxDim:400, quality:0.5} ];
            for (const opt of compressOptions) {
                const compressed = await compressDataUrl(base64Image, opt.maxDim, opt.quality);
                console.debug('salvarFotoNoServidor: tentando recomprimir para', opt, 'comprimento:', compressed.length);
                const retry = await trySend(compressed);
                console.debug('salvarFotoNoServidor: resposta retry', retry);
                if (retry.ok) {
                    usuarioAtual = retry.body?.data || retry.body || usuarioAtual;
                    sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
                    try { localStorage.removeItem(`foto_admin_${usuarioAtual?.id}`); } catch(e){}
                    return { success: true };
                }
            }
        }

        // Não foi possível salvar no servidor
        console.warn('salvarFotoNoServidor: falha final ao salvar foto no servidor:', attempt.status, attempt.body || serverMessage);
        return { success: false, error: attempt.body?.error || serverMessage || 'Falha ao salvar foto no servidor' };
    } catch (error) {
        console.error('Erro ao salvar foto no servidor:', error);
        return { success: false, error: error.message || 'Erro ao salvar foto no servidor' };
    }
}

// Compress a dataURL by drawing into canvas with given max dimension and quality
async function compressDataUrl(dataUrl, maxDim, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const out = canvas.toDataURL('image/jpeg', quality);
            resolve(out);
        };
        img.onerror = function(e) { reject(e); };
        img.src = dataUrl;
    });
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
        const denunciasResponse = await fetch(apiUrl('/api/denuncias'));
        const denunciasBody = await denunciasResponse.json();
        const denuncias = Array.isArray(denunciasBody) ? denunciasBody : (denunciasBody.data || []);
        
        // Buscar reclamações do admin (todas)
        const reclamacoesResponse = await fetch(apiUrl('/api/reclamacoes'));
        const reclamacoesBody = await reclamacoesResponse.json();
        const reclamacoes = Array.isArray(reclamacoesBody) ? reclamacoesBody : (reclamacoesBody.data || []);
        
        // Buscar usuários
        const usuariosResponse = await fetch(apiUrl('/api/usuarios'));
        const usuariosBody = await usuariosResponse.json();
        const usuarios = Array.isArray(usuariosBody) ? usuariosBody : (usuariosBody.data || []);
        
        // Atualizar badges
        const denunciasCount = document.getElementById('denunciasCount');
        if (denunciasCount) denunciasCount.innerText = Array.isArray(denuncias) ? denuncias.length : 0;
        
        const reclamacoesCount = document.getElementById('reclamacoesCount');
        if (reclamacoesCount) reclamacoesCount.innerText = Array.isArray(reclamacoes) ? reclamacoes.length : 0;
        
        const badgeDenuncias = document.getElementById('badgeDenuncias');
        const badgeReclamacoes = document.getElementById('badgeReclamacoes');
        const badgeUsuarios = document.getElementById('badgeUsuarios');

        if (badgeDenuncias) badgeDenuncias.innerText = denuncias.length;
        if (badgeReclamacoes) badgeReclamacoes.innerText = reclamacoes.length;
        if (badgeUsuarios) badgeUsuarios.innerText = usuarios.length;
        
        // Atualizar notificações (exemplo)
        const totalPendentes = denuncias.filter(d => d.status === 'pendente').length +
                               reclamacoes.filter(r => r.status === 'aberta').length;
        
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
    
    atualizarMenuAtivo();
    console.log(' Página de perfil do administrador inicializada com sucesso!');
    console.log(' Lembrete: Contas de administrador NÃO podem ser excluídas por segurança.');
}

function atualizarMenuAtivo() {
    const path = window.location.pathname.toLowerCase();
    document.querySelectorAll('aside a.nav-link').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (path.endsWith(href.toLowerCase())) {
            link.classList.add('menu-active');
        } else {
            link.classList.remove('menu-active');
        }
    });
}

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);