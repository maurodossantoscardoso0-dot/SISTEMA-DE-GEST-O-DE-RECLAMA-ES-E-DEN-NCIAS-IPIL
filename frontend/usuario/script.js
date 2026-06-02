// Modal de notificação estilizado
function showModal(type, title, message, onConfirm = null) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const config = {
        success: { icon: 'fa-check-circle', iconColor: 'text-green-500', bgGradient: 'from-green-500 to-green-600', buttonColor: 'bg-green-500 hover:bg-green-600' },
        error: { icon: 'fa-exclamation-circle', iconColor: 'text-red-500', bgGradient: 'from-red-500 to-red-600', buttonColor: 'bg-red-500 hover:bg-red-600' },
        info: { icon: 'fa-info-circle', iconColor: 'text-blue-500', bgGradient: 'from-blue-500 to-blue-600', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
        warning: { icon: 'fa-exclamation-triangle', iconColor: 'text-yellow-500', bgGradient: 'from-yellow-500 to-yellow-600', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
        confirm: { icon: 'fa-question-circle', iconColor: 'text-orange-500', bgGradient: 'from-orange-500 to-orange-600', buttonColor: 'bg-orange-500 hover:bg-orange-600' }
    };
    
    const current = config[type] || config.info;
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            .modal-content { animation: slideIn 0.3s ease; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .animate-spin-custom { animation: spin 1s linear infinite; }
        `;
        document.head.appendChild(style);
    }
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div class="bg-gradient-to-r ${current.bgGradient} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${current.icon} ${current.iconColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-600 text-base">${message}</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                ${type === 'confirm' ? `
                    <button id="modalCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                    <button id="modalConfirmBtn" class="px-5 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                        <i class="fas fa-check mr-2"></i>Confirmar
                    </button>
                ` : `
                    <button id="modalCloseBtn" class="px-6 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                        <i class="fas fa-check mr-2"></i>OK
                    </button>
                `}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm && type !== 'confirm') onConfirm();
    };
    
    if (type === 'confirm') {
        document.getElementById('modalConfirmBtn')?.addEventListener('click', () => { closeModal(); if (onConfirm) onConfirm(true); });
        document.getElementById('modalCancelBtn')?.addEventListener('click', () => { closeModal(); if (onConfirm) onConfirm(false); });
    } else {
        document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
        if (type !== 'confirm') modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    }
}

// Toast de notificações
function mostrarNotificacao(mensagem, tipo = 'success') {
    const existingToast = document.getElementById('customToast');
    if (existingToast) existingToast.remove();
    
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-500' }
    };
    
    const current = config[tipo] || config.info;
    
    const toast = document.createElement('div');
    toast.id = 'customToast';
    toast.className = `fixed bottom-4 right-4 ${current.bg} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-3`;
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `<i class="fas ${current.icon} text-xl"></i><span class="font-medium">${mensagem}</span>`;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading overlay
function showLoading(show, message = 'Processando...') {
    let overlay = document.getElementById('loadingOverlay');
    
    if (show) {
        if (overlay) overlay.remove();
        overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center';
        overlay.style.animation = 'fadeIn 0.3s ease';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
                <div class="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin-custom mb-4"></div>
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

// Funções de validações
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

// Validação de data de nascimento (1976 a 2010)
function validarDataNascimento(dataNascimento) {
    if (!dataNascimento) {
        return { valido: false, mensagem: '⚠️ A data de nascimento é obrigatória.' };
    }
    
    const data = new Date(dataNascimento);
    const hoje = new Date();
    const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    if (isNaN(data.getTime())) {
        return { valido: false, mensagem: '⚠️ Data de nascimento inválida. Use o formato DD/MM/AAAA.' };
    }
    
    if (data > dataAtual) {
        return { valido: false, mensagem: '⚠️ Data de nascimento não pode ser no futuro!' };
    }
    
    const anoNascimento = data.getFullYear();
    const ANO_MINIMO = 1976;
    const ANO_MAXIMO = 2010;
    
    if (anoNascimento < ANO_MINIMO) {
        return { 
            valido: false, 
            mensagem: `⚠️ Ano de nascimento inválido! Apenas pessoas nascidas a partir de ${ANO_MINIMO} podem se cadastrar. (Ano informado: ${anoNascimento})` 
        };
    }
    
    if (anoNascimento > ANO_MAXIMO) {
        let idade = hoje.getFullYear() - anoNascimento;
        const mesAtual = hoje.getMonth();
        const diaAtual = hoje.getDate();
        const mesNascimento = data.getMonth();
        const diaNascimento = data.getDate();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
            idade--;
        }
        
        return { 
            valido: false, 
            mensagem: `⚠️ Ano de nascimento inválido! Apenas pessoas com até ${ANO_MAXIMO + 1} anos podem se cadastrar. (Você aparenta ter ${idade} anos. Ano informado: ${anoNascimento})` 
        };
    }
    
    let idade = hoje.getFullYear() - anoNascimento;
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();
    const mesNascimento = data.getMonth();
    const diaNascimento = data.getDate();
    
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && diaAtual < diaNascimento)) {
        idade--;
    }
    
    let meses = mesAtual - mesNascimento;
    let dias = diaAtual - diaNascimento;
    
    if (dias < 0) {
        meses--;
        const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), mesAtual, 0).getDate();
        dias += ultimoDiaMesAnterior;
    }
    
    if (meses < 0) {
        meses += 12;
    }
    
    return { 
        valido: true, 
        mensagem: `✅ Cadastro permitido! Ano de nascimento: ${anoNascimento} (${idade} anos, ${meses} meses e ${dias} dias)`,
        idade: idade,
        meses: meses,
        dias: dias,
        anoNascimento: anoNascimento
    };
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

// Verificar a força da senha
function verificarForcaSenha(senha) {
    let forca = 0;
    let mensagem = '';
    
    if (senha.length >= 8) forca++;
    if (senha.match(/[a-z]/) && senha.match(/[A-Z]/)) forca++;
    if (senha.match(/[0-9]/)) forca++;
    if (senha.match(/[^a-zA-Z0-9]/)) forca++;
    
    if (forca >= 3) {
        mensagem = 'forte';
        return { forte: true, media: false, fraca: false, mensagem };
    } else if (forca === 2) {
        mensagem = 'média';
        return { forte: false, media: true, fraca: false, mensagem };
    } else {
        mensagem = 'fraca';
        return { forte: false, media: false, fraca: true, mensagem };
    }
}

// Validação do formulário completo (com modais)
async function validarFormulario(dados) {
    if (!dados.nome || !validarApenasLetrasEspacos(dados.nome)) {
        showModal('error', 'Nome Inválido', 'Use apenas letras e espaços no campo nome.');
        return false;
    }
    
    if (dados.nome.trim().split(' ').length < 2) {
        showModal('error', 'Nome Incompleto', 'Por favor, informe seu nome completo (nome e sobrenome).');
        return false;
    }
    
    const validacaoData = validarDataNascimento(dados.nascimento);
    if (!validacaoData.valido) {
        showModal('error', 'Data de Nascimento Inválida', validacaoData.mensagem);
        return false;
    }
    
    if (!dados.curso) {
        showModal('error', 'Curso não selecionado', 'Por favor, selecione um curso para continuar.');
        return false;
    }
    
    if (!dados.classe) {
        showModal('error', 'Classe não selecionada', 'Por favor, selecione a classe para continuar.');
        return false;
    }
    
    if (!dados.turma || !validarApenasLetrasNumeros(dados.turma)) {
        showModal('error', 'Turma Inválida', 'Use apenas letras e números no campo turma. Ex: IG12A');
        return false;
    }
    
    if (dados.turma.length < 3) {
        showModal('error', 'Turma Inválida', 'A turma deve ter pelo menos 3 caracteres. Ex: IG12A');
        return false;
    }
    
    if (!dados.sala || !validarApenasLetrasNumeros(dados.sala)) {
        showModal('error', 'Sala Inválida', 'Use apenas letras e números no campo sala. Ex: 101, A1, LAB2');
        return false;
    }
    
    if (dados.sala.length < 1) {
        showModal('error', 'Sala Inválida', 'Informe o número ou nome da sala.');
        return false;
    }
    
    if (!dados.email || !validarEmail(dados.email)) {
        showModal('error', 'Email Inválido', 'Digite um email válido. Exemplo: estudante@ipil.ao');
        return false;
    }
    
    if (!dados.telefone || !validarTelefone(dados.telefone)) {
        showModal('error', 'Telefone Inválido', 'O telefone deve conter exatamente 9 dígitos numéricos. Ex: 923456789');
        return false;
    }
    
    if (!dados.processo || dados.processo.length < 5) {
        showModal('error', 'Número de Processo Inválido', 'O número de processo deve ter no mínimo 5 caracteres.');
        return false;
    }
    
    if (!dados.senha || dados.senha.length < 6) {
        showModal('error', 'Senha Inválida', 'A senha deve ter no mínimo 6 caracteres para garantir a segurança da sua conta.');
        return false;
    }
    
    const forcaSenha = verificarForcaSenha(dados.senha);
    if (forcaSenha.fraca && dados.senha.length < 8) {
        return new Promise((resolve) => {
            showModal('warning', 'Senha Fraca', 
                `Sua senha é ${forcaSenha.mensagem}. Recomendamos uma senha mais forte com letras maiúsculas, números e símbolos. Deseja continuar mesmo assim?`,
                (confirmado) => {
                    if (confirmado) {
                        if (dados.senha !== dados.confirmarSenha) {
                            showModal('error', 'Senhas não coincidem', 'As senhas digitadas não são iguais. Verifique e tente novamente.');
                            resolve(false);
                        } else {
                            resolve(true);
                        }
                    } else {
                        resolve(false);
                    }
                }
            );
        });
    }
    
    if (dados.senha !== dados.confirmarSenha) {
        showModal('error', 'Senhas não coincidem', 'As senhas digitadas não são iguais. Verifique e tente novamente.');
        return false;
    }
    
    return true;
}

// Função de cadastro de usuários
async function cadastrarUsuario(dados) {
    try {
        let dataFormatada = dados.nascimento;
        if (dataFormatada && dataFormatada.includes('/')) {
            const partes = dataFormatada.split('/');
            dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        
        const payload = {
            nome: dados.nome,
            email: dados.email,
            ano_nascimento: dataFormatada,
            sexo: dados.sexo,
            senha: dados.senha,
            telefone: dados.telefone,
            curso: dados.curso,
            numero_processo: dados.processo ? dados.processo.toString() : undefined,
            classe: dados.classe,
            turma: dados.turma.toUpperCase(),
            sala: dados.sala.toUpperCase()
        };

        console.log('📤 Enviando dados para API:', payload);

        const API_URL = 'http://localhost:3000/api/usuarios';
        
        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const dadosResposta = await resposta.json();
        
        if (dadosResposta.success) {
            console.log('✅ Cadastro realizado:', dadosResposta.usuario);
            return dadosResposta;
        } else {
            throw new Error(dadosResposta.error || 'Erro ao realizar cadastro');
        }
    } catch (erro) {
        console.error('❌ Erro na requisição:', erro);
        throw erro;
    }
}

// Função para validar a idade em tempo real
function configurarValidacaoIdade() {
    const dataNascimentoInput = document.getElementById('anoNascimento');
    if (dataNascimentoInput) {
        const idadeIndicator = document.createElement('div');
        idadeIndicator.id = 'idadeIndicator';
        idadeIndicator.className = 'text-xs mt-1 hidden';
        dataNascimentoInput.parentNode.appendChild(idadeIndicator);
        
        const infoPeriodo = document.createElement('div');
        infoPeriodo.className = 'text-xs text-gray-400 mt-1 flex items-center';
        infoPeriodo.innerHTML = '<i class="fas fa-info-circle mr-1 text-orange-500"></i>Apenas nascidos entre 1976 e 2010';
        dataNascimentoInput.parentNode.appendChild(infoPeriodo);
        
        dataNascimentoInput.addEventListener('change', function() {
            const validacao = validarDataNascimento(this.value);
            const indicator = document.getElementById('idadeIndicator');
            
            if (this.value && validacao.valido) {
                indicator.textContent = validacao.mensagem;
                indicator.classList.remove('hidden', 'text-red-500');
                indicator.classList.add('text-green-500');
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500');
                mostrarNotificacao('Data de nascimento válida!', 'success');
                
                setTimeout(() => {
                    this.classList.remove('border-green-500');
                    this.classList.add('border-gray-300');
                }, 3000);
            } else if (this.value && !validacao.valido) {
                indicator.textContent = validacao.mensagem;
                indicator.classList.remove('hidden', 'text-green-500');
                indicator.classList.add('text-red-500');
                this.classList.add('border-red-500');
            } else {
                indicator.classList.add('hidden');
                this.classList.remove('border-red-500', 'border-green-500');
                this.classList.add('border-gray-300');
            }
        });
    }
}

// Bloqueio de teclas inválidas
function bloquearTeclasInvalidas(event, tipo) {
    const tecla = event.key;
    
    if (tipo === 'letrasEspacos') {
        const regex = /^[A-Za-zÀ-ÿ\s]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && tecla !== 'Delete' && tecla !== 'Tab' && 
            tecla !== 'Enter' && tecla !== 'ArrowLeft' && tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && tecla !== 'ArrowDown' && tecla !== 'Home' && tecla !== 'End' && tecla !== 'Escape') {
            event.preventDefault();
            mostrarNotificacao('Apenas letras e espaços são permitidos', 'warning');
            return false;
        }
    } else if (tipo === 'letrasNumeros') {
        const regex = /^[A-Za-z0-9]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && tecla !== 'Delete' && tecla !== 'Tab' && 
            tecla !== 'Enter' && tecla !== 'ArrowLeft' && tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && tecla !== 'ArrowDown' && tecla !== 'Home' && tecla !== 'End' && tecla !== 'Escape') {
            event.preventDefault();
            mostrarNotificacao('Apenas letras e números são permitidos', 'warning');
            return false;
        }
    }
    return true;
}

// Função para redirecionamento seguro
function redirecionarParaDashboard() {
    console.log('🔄 Iniciando redirecionamento...');
    console.log('📍 URL atual:', window.location.href);
    console.log('📁 Caminho atual:', window.location.pathname);
    
    // Caminhos possíveis para o dashboard
    const possiveisCaminhos = [
        './dashboard.html',
        '../dashboard.html',
        '../../dashboard.html',
        '/frontend/usuario/dashboard.html',
        '/frontend/dashboard.html',
        '/dashboard.html'
    ];
    
    // Encontrar o primeiro caminho que existe
    let caminhoEncontrado = null;
    
    // Verificar cada caminho (usando Promise.all para testar em paralelo)
    Promise.all(possiveisCaminhos.map(async (caminho) => {
        try {
            const response = await fetch(caminho, { method: 'HEAD' });
            if (response.ok) {
                console.log('✅ Dashboard encontrado em:', caminho);
                caminhoEncontrado = caminho;
            }
        } catch (e) {
            // Ignorar erros
        }
    })).then(() => {
        if (caminhoEncontrado) {
            console.log('🎯 Redirecionando para:', caminhoEncontrado);
            window.location.replace(caminhoEncontrado);
        } else {
            console.warn('⚠️ Nenhum dashboard encontrado, tentando caminho padrão');
            // Tentar redirecionar para o caminho mais provável
            const caminhoPadrao = './dashboard.html';
            console.log('🔄 Tentando caminho padrão:', caminhoPadrao);
            window.location.href = caminhoPadrao;
        }
    }).catch(() => {
        // Fallback
        console.log('🔄 Fallback: redirecionando para ./dashboard.html');
        window.location.href = './dashboard.html';
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página de registro carregada');
    
    // Verificar se o servidor está online
    async function verificarServidor() {
        try {
            const resposta = await fetch('http://localhost:3000/health');
            if (resposta.ok) {
                console.log('✅ Servidor backend está online na porta 3000');
            }
        } catch (error) {
            console.warn('⚠️ Servidor backend não está respondendo em http://localhost:3000');
            console.warn('Certifique-se de que o servidor Node.js está rodando com: node server.js');
        }
    }
    verificarServidor();
    
    configurarValidacaoIdade();
    
    // Elementos do formulário
    const nomeInput = document.getElementById('nome');
    const turmaInput = document.getElementById('turma');
    const salaInput = document.getElementById('sala');
    const form = document.getElementById('registerForm');
    
    const nomeWarning = document.getElementById('nomeWarning');
    const nomeError = document.getElementById('nomeError');
    const turmaWarning = document.getElementById('turmaWarning');
    const turmaError = document.getElementById('turmaError');
    const salaWarning = document.getElementById('salaWarning');
    const salaError = document.getElementById('salaError');
    
    if (nomeInput) {
        nomeInput.addEventListener('input', function() {
            validarCampo(nomeInput, 'letrasEspacos', nomeWarning, nomeError);
        });
        
        nomeInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasEspacos'));
        
        nomeInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasEspacos(pastedText)) {
                this.value = pastedText;
                validarCampo(this, 'letrasEspacos', nomeWarning, nomeError);
                mostrarNotificacao('Texto colado com sucesso!', 'success');
            } else {
                showModal('error', 'Caracteres Inválidos', 'Não é permitido colar caracteres especiais ou números no campo nome!');
            }
        });
    }
    
    if (turmaInput) {
        turmaInput.addEventListener('input', function() {
            validarCampo(turmaInput, 'letrasNumeros', turmaWarning, turmaError);
        });
        
        turmaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
        
        turmaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText.toUpperCase();
                validarCampo(this, 'letrasNumeros', turmaWarning, turmaError);
                mostrarNotificacao('Texto colado com sucesso!', 'success');
            } else {
                showModal('error', 'Caracteres Inválidos', 'Use apenas letras e números no campo turma!');
            }
        });
    }
    
    if (salaInput) {
        salaInput.addEventListener('input', function() {
            validarCampo(salaInput, 'letrasNumeros', salaWarning, salaError);
        });
        
        salaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
        
        salaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText.toUpperCase();
                validarCampo(this, 'letrasNumeros', salaWarning, salaError);
                mostrarNotificacao('Texto colado com sucesso!', 'success');
            } else {
                showModal('error', 'Caracteres Inválidos', 'Use apenas letras e números no campo sala!');
            }
        });
    }
    
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '').slice(0, 9);
            if (this.value.length === 9) {
                this.classList.remove('border-red-500');
                this.classList.add('border-green-500');
                setTimeout(() => {
                    this.classList.remove('border-green-500');
                    this.classList.add('border-gray-300');
                }, 2000);
            }
        });
        
        telefoneInput.addEventListener('blur', function() {
            if (this.value.length > 0 && this.value.length !== 9) {
                showModal('warning', 'Telefone Incompleto', 'O telefone deve ter exatamente 9 dígitos. Ex: 923456789');
                this.classList.add('border-red-500');
            }
        });
    }
    
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
    
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const forca = verificarForcaSenha(this.value);
            let forcaIndicator = document.getElementById('forcaSenhaIndicator');
            
            if (!forcaIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'forcaSenhaIndicator';
                indicator.className = 'text-xs mt-1';
                this.parentNode.appendChild(indicator);
                forcaIndicator = indicator;
            }
            
            if (this.value.length > 0) {
                if (forca.forte) {
                    forcaIndicator.innerHTML = '<i class="fas fa-shield-alt text-green-500 mr-1"></i><span class="text-green-500">✓ Senha forte - Muito bom!</span>';
                } else if (forca.media) {
                    forcaIndicator.innerHTML = '<i class="fas fa-shield-alt text-yellow-500 mr-1"></i><span class="text-yellow-500">⚠️ Senha média - Adicione números e símbolos</span>';
                } else {
                    forcaIndicator.innerHTML = '<i class="fas fa-shield-alt text-red-500 mr-1"></i><span class="text-red-500">❌ Senha fraca - Use letras maiúsculas, números e símbolos</span>';
                }
            } else {
                forcaIndicator.innerHTML = '';
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
            
            const termsCheckbox = document.getElementById('terms');
            if (!termsCheckbox.checked) {
                showModal('warning', 'Aceite os Termos', 'Você deve aceitar os termos e condições para realizar o cadastro.');
                return;
            }
            
            const valido = await validarFormulario(dados);
            if (!valido) return;
            
            const submitBtn = document.getElementById('submitBTN');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cadastrando...';
            
            showLoading(true, 'Criando sua conta...');
            
            try {
                const resultado = await cadastrarUsuario(dados);
                showLoading(false);
                showModal('success', 'Cadastro Realizado!', 'Sua conta foi criada com sucesso! Você será redirecionado para o dashboard.');
                
                // Aguardar o modal ser fechado ou usar setTimeout
                setTimeout(() => {
                    console.log('🔄 Redirecionando para o dashboard...');
                    redirecionarParaDashboard();
                }, 2000);
                
            } catch (erro) {
                showLoading(false);
                showModal('error', 'Erro no Cadastro', erro.message || 'Ocorreu um erro ao realizar o cadastro. Tente novamente.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});