// Funções de validação
function validarApenasLetrasEspacos(valor) {
    const regex = /^[A-Za-zÀ-ÿ\s]+$/;
    return regex.test(valor);
}

function validarApenasLetrasNumeros(valor) {
    const regex = /^[A-Za-z0-9]+$/;
    return regex.test(valor);
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefone(telefone) {
    const regex = /^[0-9]{9}$/;
    return regex.test(telefone);
}

// Função para validar campo em tempo real
function validarCampo(input, tipo, warningIcon, errorMsg) {
    let valor = input.value.trim();
    let valido = false;
    
    if (tipo === 'letrasEspacos') {
        valido = valor === '' || validarApenasLetrasEspacos(valor);
    } else if (tipo === 'letrasNumeros') {
        valido = valor === '' || validarApenasLetrasNumeros(valor);
    }
    
    if (valor !== '' && !valido) {
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
        if (warningIcon) warningIcon.classList.remove('hidden');
        if (errorMsg) errorMsg.classList.remove('hidden');
        return false;
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
        if (warningIcon) warningIcon.classList.add('hidden');
        if (errorMsg) errorMsg.classList.add('hidden');
        return true;
    }
}

// Função para validar o formulário completo
function validarFormulario(dados) {
    if (!validarApenasLetrasEspacos(dados.nome)) {
        alert('⚠️ Nome inválido! Use apenas letras e espaços.');
        return false;
    }
    
    if (!dados.curso) {
        alert('⚠️ Por favor, selecione um curso.');
        return false;
    }
    
    if (!validarApenasLetrasNumeros(dados.turma)) {
        alert('⚠️ Turma inválida! Use apenas letras e números.');
        return false;
    }
    
    if (!validarApenasLetrasNumeros(dados.sala)) {
        alert('⚠️ Sala inválida! Use apenas letras e números.');
        return false;
    }
    
    if (!validarEmail(dados.email)) {
        alert('⚠️ Email inválido! Digite um email válido (ex: usuario@dominio.com).');
        return false;
    }
    
    if (!validarTelefone(dados.telefone)) {
        alert('⚠️ Telefone inválido! O telefone deve conter exatamente 9 dígitos numéricos.');
        return false;
    }
    
    if (dados.senha.length < 6) {
        alert('⚠️ Senha inválida! A senha deve ter no mínimo 6 caracteres.');
        return false;
    }
    
    if (dados.senha !== dados.confirmarSenha) {
        alert('⚠️ As senhas não coincidem!');
        return false;
    }
    
    return true;
}

// Função de cadastro de usuário (CORRIGIDA)
async function cadastrarUsuario(dados) {
    try {
        const payload = {
            nome: dados.nome,
            email: dados.email,
            nascimento: dados.nascimento,
            sexo: dados.sexo,
            senha: dados.senha,
            telefone: dados.telefone,
            curso: dados.curso,
            numero_processo: dados.processo,
            classe: dados.classe,
            turma: dados.turma.toUpperCase(),
            sala: dados.sala.toUpperCase()
        };

        console.log('📤 Enviando dados para API:', payload);

        const resposta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const dadosResposta = await resposta.json();
        
        console.log('📥 Resposta da API:', dadosResposta);
        
        if (dadosResposta.success) {
            console.log('✅ Cadastro realizado com sucesso!');
            const usuarioCriado = dadosResposta.data || dadosResposta.usuario || {};
            
            // 🔥 SALVAR DADOS DO USUÁRIO NO SESSIONSTORAGE
            const usuarioData = {
                id: usuarioCriado.id || dadosResposta.id,
                nome: usuarioCriado.nome || dados.nome,
                email: usuarioCriado.email || dados.email,
                numero_processo: usuarioCriado.numero_processo || dados.processo,
                tipo: usuarioCriado.tipo || 'usuario',
                data_cadastro: new Date().toISOString()
            };
            
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioData));
            
            // Verificar se foi salvo corretamente
            const savedUser = sessionStorage.getItem('usuarioLogado');
            console.log('💾 Usuário salvo no sessionStorage:', savedUser);
            
            return { success: true, usuario: usuarioData };
        } else {
            throw new Error(dadosResposta.error || 'Erro ao realizar cadastro');
        }
    } catch (erro) {
        console.error('❌ Erro na requisição:', erro);
        throw erro;
    }
}

// Função para mostrar modal de sucesso
function showSuccessModal(message, redirectUrl) {
    // Criar modal personalizado
    const modal = document.createElement('div');
    modal.id = 'successModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" style="animation: slideIn 0.3s ease;">
            <div class="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-check-circle text-green-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Cadastro Realizado!</h3>
                </div>
            </div>
            <div class="px-6 py-6 text-center">
                <i class="fas fa-smile-wink text-green-500 text-5xl mb-4"></i>
                <p class="text-gray-700 text-base mb-2">${message}</p>
                <p class="text-gray-500 text-sm">Redirecionando para o dashboard...</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-center">
                <div class="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
            </div>
        </div>
    `;
    
    // Adicionar estilos se não existirem
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
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .animate-spin {
                animation: spin 1s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    
    // Redirecionar após 2 segundos
    setTimeout(() => {
        if (typeof redirecionarParaDashboard === 'function') {
            redirecionarParaDashboard();
        } else {
            window.location.href = redirectUrl || './dashboard.html';
        }
    }, 2000);
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar se já está logado, se sim redirecionar para dashboard
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
        try {
            const usuario = JSON.parse(usuarioLogado);
            if (usuario && usuario.nome) {
                console.log('✅ Usuário já está logado:', usuario.nome);
                window.location.href = './dashboard.html';
                return;
            }
        } catch(e) {
            console.log('Erro ao verificar usuário logado');
        }
    }
    
    // Elementos do formulário
    const nomeInput = document.getElementById('nome');
    const turmaInput = document.getElementById('turma');
    const salaInput = document.getElementById('sala');
    const form = document.getElementById('registerForm');
    
    // Elementos de validação visual
    const nomeWarning = document.getElementById('nomeWarning');
    const nomeError = document.getElementById('nomeError');
    const turmaWarning = document.getElementById('turmaWarning');
    const turmaError = document.getElementById('turmaError');
    const salaWarning = document.getElementById('salaWarning');
    const salaError = document.getElementById('salaError');
    
    // Validação em tempo real para o campo Nome
    if (nomeInput) {
        nomeInput.addEventListener('input', function() {
            validarCampo(nomeInput, 'letrasEspacos', nomeWarning, nomeError);
        });
        
        nomeInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasEspacos(pastedText)) {
                this.value = pastedText;
                validarCampo(this, 'letrasEspacos', nomeWarning, nomeError);
            } else {
                alert('⚠️ Não é permitido colar caracteres especiais ou números neste campo!');
            }
        });
    }
    
    // Validação em tempo real para o campo Turma
    if (turmaInput) {
        turmaInput.addEventListener('input', function() {
            validarCampo(turmaInput, 'letrasNumeros', turmaWarning, turmaError);
        });
        
        turmaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText.toUpperCase();
                validarCampo(this, 'letrasNumeros', turmaWarning, turmaError);
            } else {
                alert('⚠️ Não é permitido colar caracteres especiais neste campo! Use apenas letras e números.');
            }
        });
    }
    
    // Validação em tempo real para o campo Sala
    if (salaInput) {
        salaInput.addEventListener('input', function() {
            validarCampo(salaInput, 'letrasNumeros', salaWarning, salaError);
        });
        
        salaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText.toUpperCase();
                validarCampo(this, 'letrasNumeros', salaWarning, salaError);
            } else {
                alert('⚠️ Não é permitido colar caracteres especiais neste campo! Use apenas letras e números.');
            }
        });
    }
    
    // Validação do telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            if (this.value.length > 9) {
                this.value = this.value.slice(0, 9);
            }
        });
    }
    
    // Mostrar/Esconder senha
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // Envio do formulário (CORRIGIDO)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Coletar dados do formulário
            const dados = {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim(),
                nascimento: document.getElementById('anoNascimento').value,
                sexo: document.getElementById('sexo').value,
                senha: document.getElementById('password').value,
                confirmarSenha: document.getElementById('confirmPassword').value,
                telefone: document.getElementById('telefone').value.trim(),
                curso: document.getElementById('curso').value,
                processo: document.getElementById('processo').value,
                classe: document.getElementById('classe').value,
                turma: document.getElementById('turma').value.trim(),
                sala: document.getElementById('sala').value.trim(),
                foto: document.getElementById('foto')?.files[0]
            };
            
            // Validar termos
            const termsCheckbox = document.getElementById('terms');
            if (!termsCheckbox.checked) {
                alert('⚠️ Você deve aceitar os termos e condições para continuar!');
                return;
            }
            
            // Validar todos os campos
            if (!validarFormulario(dados)) {
                return;
            }
            
            // Desabilitar botão para evitar múltiplos envios
            const submitBtn = document.getElementById('submitBTN');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cadastrando...';
            
            try {
                const resultado = await cadastrarUsuario(dados);
                
                if (resultado.success) {
                    // Redirecionar imediatamente para o dashboard
                    window.location.href = './dashboard.html';
                    return;
                } else {
                    throw new Error('Erro ao criar conta');
                }
                
            } catch (erro) {
                alert('❌ Erro ao cadastrar: ' + erro.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// Bloquear teclas especiais nos campos
function bloquearTeclasInvalidas(event, tipo) {
    const tecla = event.key;
    
    if (tipo === 'letrasEspacos') {
        const regex = /^[A-Za-zÀ-ÿ\s]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && 
            tecla !== 'Delete' && 
            tecla !== 'Tab' && 
            tecla !== 'Enter' && 
            tecla !== 'ArrowLeft' && 
            tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && 
            tecla !== 'ArrowDown' &&
            tecla !== 'Home' &&
            tecla !== 'End') {
            event.preventDefault();
            return false;
        }
    } else if (tipo === 'letrasNumeros') {
        const regex = /^[A-Za-z0-9]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && 
            tecla !== 'Delete' && 
            tecla !== 'Tab' && 
            tecla !== 'Enter' && 
            tecla !== 'ArrowLeft' && 
            tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && 
            tecla !== 'ArrowDown' &&
            tecla !== 'Home' &&
            tecla !== 'End') {
            event.preventDefault();
            return false;
        }
    }
    return true;
}

// Adicionar bloqueio de teclas nos campos
document.addEventListener('DOMContentLoaded', function() {
    const nomeInput = document.getElementById('nome');
    const turmaInput = document.getElementById('turma');
    const salaInput = document.getElementById('sala');
    
    if (nomeInput) {
        nomeInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasEspacos'));
    }
    
    if (turmaInput) {
        turmaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
    }
    
    if (salaInput) {
        salaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
    }
});