// esqueci-senha.js - Script de recuperação de senha

let emailTemp = '';
let codigoTemp = '';

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar toggles de senha
    document.querySelectorAll('.toggleSenha').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.closest('.relative').querySelector('input');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // Monitorar força da senha
    const novaSenha = document.getElementById('novaSenha');
    if (novaSenha) {
        novaSenha.addEventListener('input', function() {
            verificarForcaSenha(this.value);
        });
    }

    // Formulário passo 1
    const formSolicitar = document.getElementById('formSolicitar');
    if (formSolicitar) {
        formSolicitar.addEventListener('submit', solicitarRecuperacao);
    }

    // Formulário passo 2
    const formVerificar = document.getElementById('formVerificar');
    if (formVerificar) {
        formVerificar.addEventListener('submit', verificarCodigo);
    }

    // Formulário passo 3
    const formNovaSenha = document.getElementById('formNovaSenha');
    if (formNovaSenha) {
        formNovaSenha.addEventListener('submit', alterarSenha);
    }
});

// ============================================
// VERIFICAR FORÇA DA SENHA
// ============================================

function verificarForcaSenha(senha) {
    const container = document.getElementById('senhaForca');
    if (!container) return;
    
    const barras = container.querySelectorAll('.h-1');
    let forca = 0;
    let mensagem = '';
    
    if (senha.length >= 6) forca++;
    if (senha.length >= 8) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[^A-Za-z0-9]/.test(senha)) forca++;
    
    forca = Math.min(forca, 3);
    
    const cores = {
        0: 'bg-red-500',
        1: 'bg-orange-500',
        2: 'bg-yellow-500',
        3: 'bg-green-500'
    };
    
    const mensagens = {
        0: 'Senha muito fraca',
        1: 'Senha fraca',
        2: 'Senha média',
        3: 'Senha forte'
    };
    
    for (let i = 0; i < 3; i++) {
        if (barras[i]) {
            barras[i].className = `h-1 flex-1 rounded-full ${i < forca ? cores[forca] : 'bg-gray-200'}`;
        }
    }
    
    const msgElement = container.querySelector('p');
    if (msgElement) {
        msgElement.textContent = mensagens[forca] || 'Digite sua nova senha';
        msgElement.className = `text-xs mt-1 ${forca === 3 ? 'text-green-600' : forca === 2 ? 'text-yellow-600' : 'text-gray-500'}`;
    }
}

// ============================================
// SOLICITAR RECUPERAÇÃO (PASSO 1)
// ============================================

async function solicitarRecuperacao(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showToast('Por favor, digite seu email', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        showToast('Por favor, digite um email válido', 'error');
        return;
    }
    
    showLoading(true, 'Enviando código...');
    
    try {
        // Simular envio de código (substituir pela chamada real à API)
        // const response = await fetch('http://localhost:3000/api/usuarios/recuperar-senha', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ email: email })
        // });
        // const data = await response.json();
        
        // Simulação para demonstração
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Gerar código aleatório de 6 dígitos
        codigoTemp = Math.floor(100000 + Math.random() * 900000).toString();
        emailTemp = email;
        
        console.log('Código gerado (apenas para teste):', codigoTemp);
        
        // Em produção, enviar email real
        // Mostrar código no console para teste
        showToast(`Código de verificação: ${codigoTemp} (copie para teste)`, 'info');
        
        // Avançar para passo 2
        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        document.getElementById('emailEnviado').innerHTML = `Enviamos um código para <strong>${email}</strong>`;
        
        showToast('Código enviado! Verifique seu email.', 'success');
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao enviar código. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// REENVIAR CÓDIGO
// ============================================

async function reenviarCodigo() {
    if (!emailTemp) {
        showToast('Email não encontrado. Volte ao início.', 'error');
        return;
    }
    
    showLoading(true, 'Reenviando código...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Gerar novo código
        codigoTemp = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log('Novo código gerado:', codigoTemp);
        showToast(`Novo código: ${codigoTemp}`, 'info');
        showToast('Código reenviado!', 'success');
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao reenviar código', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// VERIFICAR CÓDIGO (PASSO 2)
// ============================================

async function verificarCodigo(event) {
    event.preventDefault();
    
    const codigo = document.getElementById('codigo').value.trim();
    
    if (!codigo || codigo.length !== 6) {
        showToast('Por favor, digite o código de 6 dígitos', 'error');
        return;
    }
    
    showLoading(true, 'Verificando código...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        if (codigo === codigoTemp) {
            // Avançar para passo 3
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            showToast('Código verificado! Crie sua nova senha.', 'success');
        } else {
            showToast('Código inválido. Tente novamente.', 'error');
        }
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao verificar código', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// ALTERAR SENHA (PASSO 3)
// ============================================

async function alterarSenha(event) {
    event.preventDefault();
    
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!novaSenha || novaSenha.length < 6) {
        showToast('A senha deve ter no mínimo 6 caracteres', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        showToast('As senhas não coincidem', 'error');
        return;
    }
    
    showLoading(true, 'Alterando senha...');
    
    try {
        // Chamar API para alterar senha
        // const response = await fetch('http://localhost:3000/api/usuarios/alterar-senha-recuperacao', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ 
        //         email: emailTemp,
        //         codigo: codigoTemp,
        //         novaSenha: novaSenha 
        //     })
        // });
        // const data = await response.json();
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showToast('Senha alterada com sucesso!', 'success');
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro:', error);
        showToast('Erro ao alterar senha. Tente novamente.', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// VALIDAR EMAIL
// ============================================

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
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
// TOAST DE NOTIFICAÇÃO
// ============================================

function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' }
    };
    
    const current = config[type] || config.success;
    
    const toast = document.createElement('div');
    toast.className = `custom-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${current.bg} text-white toast-slide-in`;
    toast.innerHTML = `<i class="fas ${current.icon} mr-2"></i>${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// AJUDA MODAL
// ============================================

function abrirAjuda() {
    const modal = document.getElementById('ajudaModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function fecharAjuda() {
    const modal = document.getElementById('ajudaModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// FUNÇÕES GLOBAIS
// ============================================

window.reenviarCodigo = reenviarCodigo;
window.abrirAjuda = abrirAjuda;
window.fecharAjuda = fecharAjuda;