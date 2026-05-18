// login.js - Com modais interativos e estilizados

// ============================================
// MODAL DE NOTIFICAÇÃO ESTILIZADO
// ============================================
function showModal(type, title, message, onConfirm = null) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Configurações baseadas no tipo
    const config = {
        success: {
            icon: 'fa-check-circle',
            iconColor: 'text-green-500',
            bgGradient: 'from-green-500 to-green-600',
            buttonColor: 'bg-green-500 hover:bg-green-600'
        },
        error: {
            icon: 'fa-exclamation-circle',
            iconColor: 'text-red-500',
            bgGradient: 'from-red-500 to-red-600',
            buttonColor: 'bg-red-500 hover:bg-red-600'
        },
        info: {
            icon: 'fa-info-circle',
            iconColor: 'text-blue-500',
            bgGradient: 'from-blue-500 to-blue-600',
            buttonColor: 'bg-blue-500 hover:bg-blue-600'
        },
        warning: {
            icon: 'fa-exclamation-triangle',
            iconColor: 'text-yellow-500',
            bgGradient: 'from-yellow-500 to-yellow-600',
            buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        },
        confirm: {
            icon: 'fa-question-circle',
            iconColor: 'text-orange-500',
            bgGradient: 'from-orange-500 to-orange-600',
            buttonColor: 'bg-orange-500 hover:bg-orange-600'
        }
    };
    
    const currentConfig = config[type] || config.info;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-all duration-300';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Adicionar estilo de animação
    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .modal-content {
                animation: slideIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
            <!-- Cabeçalho -->
            <div class="bg-gradient-to-r ${currentConfig.bgGradient} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${currentConfig.icon} ${currentConfig.iconColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                </div>
            </div>
            
            <!-- Corpo -->
            <div class="px-6 py-6">
                <p class="text-gray-600 text-base">${message}</p>
            </div>
            
            <!-- Rodapé -->
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                ${type === 'confirm' ? `
                    <button id="modalCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                    <button id="modalConfirmBtn" class="px-5 py-2 ${currentConfig.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                        <i class="fas fa-check mr-2"></i>Confirmar
                    </button>
                ` : `
                    <button id="modalCloseBtn" class="px-6 py-2 ${currentConfig.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                        <i class="fas fa-check mr-2"></i>OK
                    </button>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adicionar eventos
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm && type !== 'confirm') onConfirm();
    };
    
    if (type === 'confirm') {
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        
        if (confirmBtn) {
            confirmBtn.onclick = () => {
                closeModal();
                if (onConfirm) onConfirm(true);
            };
        }
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                closeModal();
                if (onConfirm) onConfirm(false);
            };
        }
    } else {
        const closeBtn = document.getElementById('modalCloseBtn');
        if (closeBtn) closeBtn.onclick = closeModal;
    }
    
    // Clicar fora do modal fecha (apenas para info/success/error)
    if (type !== 'confirm') {
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    }
}

// ============================================
// TOAST DE NOTIFICAÇÃO (TEMPORÁRIO)
// ============================================
function showToast(type, message, duration = 3000) {
    const existingToast = document.getElementById('customToast');
    if (existingToast) existingToast.remove();
    
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-500' }
    };
    
    const current = config[type] || config.info;
    
    const toast = document.createElement('div');
    toast.id = 'customToast';
    toast.className = `fixed bottom-4 right-4 ${current.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3`;
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `
        <i class="fas ${current.icon} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================
// LOADING OVERLAY
// ============================================
function showLoading(show, message = 'Processando...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        if (overlay) overlay.remove();
        
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center';
        overlay.style.animation = 'fadeIn 0.3s ease';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl transform transition-all">
                <div class="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
                <p class="text-gray-700 font-medium">${message}</p>
                <p class="text-gray-400 text-sm mt-2">Aguarde...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }
}

// ============================================
// FUNÇÃO PRINCIPAL DE LOGIN
// ============================================
async function fazerLogin(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        const numero_processo = document.getElementById('processo').value;
        const senha = document.getElementById('password').value;
        
        console.log('📝 Dados do formulário:', { numero_processo, senha: '********' });
        
        // Validações com modal estilizado
        if (!numero_processo || !senha) {
            showModal('error', 'Campos Incompletos', 'Por favor, preencha todos os campos para continuar.');
            return;
        }
        
        if (numero_processo.length < 5) {
            showModal('error', 'Número de Processo Inválido', 'O número de processo deve ter no mínimo 5 caracteres. Verifique e tente novamente.');
            return;
        }
        
        if (senha.length < 6) {
            showModal('error', 'Senha Inválida', 'A senha deve ter no mínimo 6 caracteres. Por favor, digite uma senha válida.');
            return;
        }
        
        // Desabilitar botão e mostrar loading no botão
        const btnSubmit = document.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Autenticando...';
        
        // Mostrar loading overlay
        showLoading(true, 'Verificando credenciais...');
        
        const response = await fetch('http://localhost:3000/api/usuarios/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numero_processo: numero_processo,
                senha: senha
            })
        });
        
        const resultado = await response.json();
        console.log('📡 Resposta do servidor:', resultado);
        
        showLoading(false);
        
        if (response.ok && resultado.success) {
            console.log('✅ Login bem-sucedido:', resultado.usuario);
            
            sessionStorage.setItem('usuarioLogado', JSON.stringify(resultado.usuario));
            sessionStorage.setItem('token', Date.now().toString());
            
            // Mostrar modal de sucesso
            showModal('success', 'Bem-vindo(a)!', `Olá ${resultado.usuario.nome}! Você será redirecionado ao dashboard em instantes.`);
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                if (resultado.usuario.tipo === 'admin') {
                    console.log('👑 Redirecionando para painel administrativo...');
                    window.location.href = 'admin/dashboardAdmin.html';
                } else {
                    console.log('🎓 Redirecionando para painel do aluno...');
                    window.location.href = 'usuario/dashboard.html';
                }
            }, 2000);
            
        } else {
            let mensagemErro = resultado.error || 'Credenciais inválidas';
            
            if (mensagemErro.includes('Usuário não encontrado')) {
                mensagemErro = 'Nenhuma conta encontrada com este número de processo. Verifique e tente novamente.';
            } else if (mensagemErro.includes('Senha incorreta')) {
                mensagemErro = 'Senha incorreta. Por favor, verifique sua senha e tente novamente.';
            }
            
            showModal('error', 'Falha no Login', mensagemErro);
            console.error('❌ Erro no login:', resultado);
            
            // Remover foco do botão
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = textoOriginal;
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
        showLoading(false);
        showModal('error', 'Erro de Conexão', 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.');
        
        const btnSubmit = document.querySelector('button[type="submit"]');
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Entrar';
        }
    }
    
    return false;
}

// ============================================
// ALTERNAR VISIBILIDADE DA SENHA
// ============================================
function setupTogglePassword() {
    const togglePassword = document.getElementById('togglePassword');
    const password = document.getElementById('password');
    
    if (togglePassword && password) {
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
}

// ============================================
// FUNÇÃO ESQUECI MINHA SENHA
// ============================================
function esqueciSenha() {
    showModal('info', 'Recuperação de Senha', 'Entre em contato com o administrador do sistema para redefinir sua senha.\n\nEmail: suporte@ipil.ao\nTelefone: (+244) 000-000-000');
}

// ============================================
// INICIALIZAR EVENTOS
// ============================================
function initializeEvents() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', fazerLogin);
        console.log('✅ Evento de submit adicionado ao formulário');
    } else {
        console.error('❌ Formulário não encontrado');
    }
    
    // Adicionar link "Esqueci minha senha"
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            esqueciSenha();
        });
    }
}

// ============================================
// VERIFICAR SESSÃO EXISTENTE
// ============================================
function verificarSessaoExistente() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        const usuario = JSON.parse(usuarioLogado);
        const destino = usuario.tipo === 'admin' ? 'admin/dashboardAdmin.html' : 'usuario/dashboard.html';
        
        showModal('confirm', 'Sessão Ativa', `Você já está logado como ${usuario.nome}. Deseja ir para o dashboard?`, (confirmado) => {
            if (confirmado) {
                window.location.href = destino;
            }
        });
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página de login carregada - Modo Premium');
    
    setupTogglePassword();
    initializeEvents();
    verificarSessaoExistente();
    
    // Adicionar efeitos de animação nos inputs
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('ring-2', 'ring-orange-300');
        });
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('ring-2', 'ring-orange-300');
        });
    });
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
window.fazerLogin = fazerLogin;
window.logout = logout;
window.getUsuarioLogado = getUsuarioLogado;
window.isAdmin = isAdmin;
window.isAluno = isAluno;
window.esqueciSenha = esqueciSenha;

// ============================================
// FUNÇÕES AUXILIARES
// ============================================
function logout() {
    showModal('confirm', 'Sair do Sistema', 'Tem certeza que deseja sair? Você será redirecionado para a página de login.', (confirmado) => {
        if (confirmado) {
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('token');
            showToast('success', 'Logout realizado com sucesso!');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1000);
        }
    });
}

function getUsuarioLogado() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    return usuario ? JSON.parse(usuario) : null;
}

function isAdmin() {
    const usuario = getUsuarioLogado();
    return usuario && usuario.tipo === 'admin';
}

function isAluno() {
    const usuario = getUsuarioLogado();
    return usuario && usuario.tipo === 'aluno';
}