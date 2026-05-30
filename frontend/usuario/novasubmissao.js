let usuarioLogado = null;
let filesArray = [];
const API_URL = 'http://localhost:3000/api';

// Verificar autenticação
function checkAuth() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = './login.html';
        return null;
    }
    return JSON.parse(usuario);
}

// Obter iniciais
function getInitials(nome) {
    if (!nome) return 'U';
    return nome.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Atualizar informações do usuário
function atualizarInterface() {
    document.getElementById('usuarioNome').textContent = usuarioLogado.nome;
    document.getElementById('usuarioProcesso').textContent = `Processo: ${usuarioLogado.numero_processo}`;
    document.getElementById('saudacaoNome').textContent = usuarioLogado.nome.split(' ')[0];
    
    const initials = getInitials(usuarioLogado.nome);
    document.getElementById('usuarioAvatar').textContent = initials;
    document.getElementById('avatarMobile').textContent = initials;
    document.getElementById('nomeMobile').textContent = usuarioLogado.nome;
    document.getElementById('processoMobile').textContent = `Processo: ${usuarioLogado.numero_processo}`;
}

// -----------------------------
// Contadores dinâmicos (reclamações/denúncias)
// -----------------------------
let intervaloAtualizacaoContadores = null;
async function carregarContadoresDinamicos() {
    if (!usuarioLogado) return { totalReclamacoes: 0, totalDenuncias: 0 };
    try {
        const [respRec, respDen] = await Promise.all([
            fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`),
            fetch(`${API_URL}/denuncias?usuario_id=${usuarioLogado.id}`)
        ]);

        const recData = respRec.ok ? await respRec.json() : [];
        const denData = respDen.ok ? await respDen.json() : [];

        const totalReclamacoes = Array.isArray(recData) ? recData.length : 0;
        const totalDenuncias = Array.isArray(denData) ? denData.length : 0;

        const reclamacoesEl = document.getElementById('reclamacoesCount');
        const denunciasEl = document.getElementById('denunciasCount');

        if (reclamacoesEl) {
            reclamacoesEl.textContent = totalReclamacoes;
            reclamacoesEl.style.display = totalReclamacoes > 0 ? 'inline-flex' : 'none';
        }

        if (denunciasEl) {
            denunciasEl.textContent = totalDenuncias;
            denunciasEl.style.display = totalDenuncias > 0 ? 'inline-flex' : 'none';
        }

        // notification badge: use number of reclamações abertas
        const reclamacoesAbertas = Array.isArray(recData) ? recData.filter(r => r.status === 'aberta' || r.status === 'em_andamento').length : 0;
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            if (reclamacoesAbertas > 0) {
                notificationBadge.textContent = reclamacoesAbertas;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }

        return { totalReclamacoes, totalDenuncias, reclamacoesAbertas };
    } catch (err) {
        console.error('Erro ao carregar contadores:', err);
        return { totalReclamacoes: 0, totalDenuncias: 0, reclamacoesAbertas: 0 };
    }
}

function iniciarAtualizacaoPeriodicaContadores() {
    if (intervaloAtualizacaoContadores) clearInterval(intervaloAtualizacaoContadores);
    intervaloAtualizacaoContadores = setInterval(async () => {
        await carregarContadoresDinamicos();
        console.log('🔄 Contadores atualizados (nova submissão)');
    }, 30000);
}

// FUNÇÃO PARA VALIDAR DATA (NÃO ULTRAPASSAR 2026 E NÃO SER FUTURA)
function validarDataLimite(dataString) {
    if (!dataString) return false;
    
    const dataSelecionada = new Date(dataString);
    const anoLimite = 2026;
    const dataLimite = new Date(`${anoLimite}-12-31`);
    const dataHoje = new Date();
    dataHoje.setHours(23, 59, 59, 999);
    
    if (isNaN(dataSelecionada.getTime())) return false;
    if (dataSelecionada > dataLimite) return false;
    if (dataSelecionada > dataHoje) return false;
    
    return true;
}

// Função para configurar a validação da data no input
function configurarValidacaoData() {
    const inputData = document.getElementById('dataOcorrido');
    if (!inputData) return;
    
    const hoje = new Date();
    const dataLimite = new Date('2026-12-31');
    const maxData = hoje <= dataLimite ? hoje : dataLimite;
    inputData.max = maxData.toISOString().split('T')[0];
    inputData.min = '2000-01-01';
    
    inputData.addEventListener('change', function() {
        if (this.value && !validarDataLimite(this.value)) {
            mostrarNotificacao('A data do ocorrido deve ser realista e não pode ser futura ou posterior a 2026.', 'error');
            this.value = '';
            this.classList.add('border-red-500', 'bg-red-50');
        } else if (this.value) {
            this.classList.remove('border-red-500', 'bg-red-50');
            this.classList.add('border-green-500', 'bg-green-50');
            setTimeout(() => {
                this.classList.remove('border-green-500', 'bg-green-50');
            }, 2000);
        }
    });
    
    inputData.addEventListener('input', function() {
        if (this.value && !validarDataLimite(this.value)) {
            this.setCustomValidity('A data deve ser realista e não pode ser futura ou superior a 2026.');
            this.classList.add('border-red-500', 'bg-red-50');
        } else {
            this.setCustomValidity('');
            this.classList.remove('border-red-500', 'bg-red-50');
        }
    });
}

// FUNÇÃO PARA CONVERTER ARQUIVOS PARA BASE64
async function converterArquivosParaBase64(files) {
    const arquivosConvertidos = [];
    
    for (const file of files) {
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            
            arquivosConvertidos.push({
                nome: file.name,
                tipo: file.type,
                tamanho: file.size,
                base64: base64,
                data: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao converter arquivo:', error);
        }
    }
    
    return arquivosConvertidos;
}

// FUNÇÃO PARA ENVIAR ARQUIVOS PARA O SERVIDOR
async function enviarAnexos(anexos, denunciaId = null, reclamacaoId = null) {
    if (!anexos || anexos.length === 0) return [];
    
    const anexosEnviados = [];
    
    for (const anexo of anexos) {
        try {
            const payload = {
                ...anexo,
                denuncia_id: denunciaId || null,
                reclamacao_id: reclamacaoId || null
            };
            
            const response = await fetch(`${API_URL}/anexos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                const resultado = await response.json();
                anexosEnviados.push(resultado);
            } else {
                const errorData = await response.json();
                console.error('Erro ao enviar anexo:', errorData);
            }
        } catch (error) {
            console.error('Erro ao enviar anexo:', error);
        }
    }
    
    return anexosEnviados;
}

// Alternar entre abas
function switchTab(type) {
    const denunciaContent = document.getElementById('denunciaContent');
    const reclamacaoContent = document.getElementById('reclamacaoContent');
    const tabDenuncia = document.getElementById('tabDenuncia');
    const tabReclamacao = document.getElementById('tabReclamacao');
    const submitType = document.getElementById('submitType');
    
    if (type === 'denuncia') {
        denunciaContent.classList.remove('hidden');
        reclamacaoContent.classList.add('hidden');
        tabDenuncia.classList.add('text-orange-600', 'border-orange-500');
        tabDenuncia.classList.remove('text-gray-500', 'border-transparent');
        tabReclamacao.classList.remove('text-orange-600', 'border-orange-500');
        tabReclamacao.classList.add('text-gray-500', 'border-transparent');
        submitType.textContent = 'Denúncia';
    } else {
        reclamacaoContent.classList.remove('hidden');
        denunciaContent.classList.add('hidden');
        tabReclamacao.classList.add('text-orange-600', 'border-orange-500');
        tabReclamacao.classList.remove('text-gray-500', 'border-transparent');
        tabDenuncia.classList.remove('text-orange-600', 'border-orange-500');
        tabDenuncia.classList.add('text-gray-500', 'border-transparent');
        submitType.textContent = 'Reclamação';
    }
}

// Função para enviar denúncia COM ANEXOS (sem anônimo)
async function enviarDenuncia(dados, anexos) {
    try {
        console.log(' Enviando denúncia:', dados);
        
        const response = await fetch(`${API_URL}/denuncias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.json();
        console.log('📡 Resposta do servidor:', resultado);
        
        if (!response.ok) {
            throw new Error(resultado.error || 'Erro ao enviar denúncia');
        }
        
        // Se tiver anexos e a denúncia foi criada com sucesso, enviar os anexos
        if (anexos && anexos.length > 0 && resultado.data && resultado.data.id) {
            console.log(`📎 Enviando ${anexos.length} anexos para denúncia ID: ${resultado.data.id}`);
            await enviarAnexos(anexos, resultado.data.id, null);
        }
        
        return { success: true, data: resultado };
    } catch (error) {
        console.error(' Erro ao enviar denúncia:', error);
        return { success: false, error: error.message };
    }
}

// Função para enviar reclamação COM ANEXOS (sem anônimo)
async function enviarReclamacao(dados, anexos) {
    try {
        console.log(' Enviando reclamação:', dados);
        
        const response = await fetch(`${API_URL}/reclamacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.json();
        console.log(' Resposta do servidor:', resultado);
        
        if (!response.ok) {
            throw new Error(resultado.error || 'Erro ao enviar reclamação');
        }
        
        // Se tiver anexos e a reclamação foi criada com sucesso, enviar os anexos
        if (anexos && anexos.length > 0 && resultado.data && resultado.data.id) {
            console.log(`📎 Enviando ${anexos.length} anexos para reclamação ID: ${resultado.data.id}`);
            await enviarAnexos(anexos, null, resultado.data.id);
        }
        
        return { success: true, data: resultado };
    } catch (error) {
        console.error(' Erro ao enviar reclamação:', error);
        return { success: false, error: error.message };
    }
}

// FUNÇÃO PARA MOSTRAR LOADING
function mostrarLoading(show, message = 'Processando...') {
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
        
        if (!document.getElementById('loadingStyles')) {
            const style = document.createElement('style');
            style.id = 'loadingStyles';
            style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }.animate-spin { animation: spin 1s linear infinite; }`;
            document.head.appendChild(style);
        }
    } else {
        if (overlay) overlay.remove();
    }
}

// Submissão do formulário (SEM OPÇÃO ANÔNIMA)
document.getElementById('submissionForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('submitType').textContent;
    const titulo = document.getElementById('titulo').value.trim();
    const categoria = document.getElementById('categoria').value;
    const local = document.getElementById('local').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const dataOcorrido = document.getElementById('dataOcorrido').value;
    
    // Validações
    if (!titulo) { mostrarNotificacao('Por favor, informe o título', 'error'); return; }
    if (!categoria) { mostrarNotificacao('Por favor, selecione uma categoria', 'error'); return; }
    if (!local) { mostrarNotificacao('Por favor, informe o local', 'error'); return; }
    if (!descricao) { mostrarNotificacao('Por favor, descreva a situação', 'error'); return; }
    if (!dataOcorrido) { mostrarNotificacao('Por favor, informe a data do ocorrido', 'error'); return; }
    
    // Validar data
    if (!validarDataLimite(dataOcorrido)) {
        mostrarNotificacao('A data do ocorrido não pode ultrapassar o ano de 2026!', 'error');
        const inputData = document.getElementById('dataOcorrido');
        inputData.classList.add('border-red-500', 'bg-red-50');
        inputData.focus();
        return;
    }
    
    // GERAR NÚMERO DE PROTOCOLO ÚNICO
    const protocolo = `${tipo === 'Denúncia' ? 'DEN' : 'REC'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Preparar dados base - SEM OPÇÃO ANÔNIMA, SEMPRE COM USUÁRIO ID
    const dadosBase = {
        titulo,
        descricao,
        local,
        data_ocorrencia: dataOcorrido,
        anonimo: 0, // SEMPRE FALSO (não anônimo)
        usuario_id: usuarioLogado.id, // SEMPRE O ID DO USUÁRIO LOGADO
        protocolo: protocolo,
        status: 'pendente',
        created_at: new Date().toISOString()
    };
    
    console.log(' Dados base:', dadosBase);
    console.log(' Usuário logado ID:', usuarioLogado.id);
    console.log(' Arquivos anexados:', filesArray.length);
    
    // Mostrar loading
    mostrarLoading(true, `Enviando ${tipo.toLowerCase()}...`);
    
    // Desabilitar botão
    const submitBtn = document.getElementById('submitBtn');
    const textoOriginal = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
    
    // Converter anexos para Base64 ANTES de enviar
    let anexosBase64 = [];
    if (filesArray.length > 0) {
        mostrarLoading(true, `Convertendo ${filesArray.length} arquivo(s)...`);
        anexosBase64 = await converterArquivosParaBase64(filesArray);
        console.log(` ${anexosBase64.length} arquivo(s) convertidos para Base64`);
    }
    
    let resultado;
    
    if (tipo === 'Denúncia') {
        const dadosDenuncia = { 
            ...dadosBase, 
            tipo: categoria,
            categoria: categoria
        };
        resultado = await enviarDenuncia(dadosDenuncia, anexosBase64);
    } else {
        const dadosReclamacao = { 
            ...dadosBase, 
            categoria: categoria 
        };
        resultado = await enviarReclamacao(dadosReclamacao, anexosBase64);
    }
    
    // Esconder loading
    mostrarLoading(false);
    
    // Reabilitar botão
    submitBtn.disabled = false;
    submitBtn.innerHTML = textoOriginal;
    
    if (resultado.success) {
        mostrarNotificacao(`${tipo} enviada com sucesso! Protocolo: ${protocolo}`, 'success');
        
        // Limpar formulário
        document.getElementById('submissionForm').reset();
        filesArray = [];
        updateFileList();
        
        // Limpar o campo de data
        const inputData = document.getElementById('dataOcorrido');
        if (inputData) inputData.value = '';
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } else {
        mostrarNotificacao(`Erro ao enviar ${tipo.toLowerCase()}: ${resultado.error}`, 'error');
    }
});

// Upload de arquivos
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover', 'border-orange-500', 'bg-orange-50'));
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover', 'border-orange-500', 'bg-orange-50'));
    });
    
    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
}

if (fileInput) {
    fileInput.addEventListener('change', () => handleFiles(fileInput.files));
}

function handleFiles(files) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    for (let file of files) {
        if (file.size > MAX_SIZE) {
            mostrarNotificacao(`Arquivo ${file.name} excede 10MB!`, 'error');
            continue;
        }
        filesArray.push(file);
    }
    updateFileList();
}

function updateFileList() {
    if (!fileList) return;
    
    if (filesArray.length === 0) { 
        fileList.innerHTML = ''; 
        return;
    }
    
    fileList.innerHTML = filesArray.map((file, index) => `
        <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg mb-2">
            <div class="flex items-center space-x-3">
                <i class="fas ${getFileIcon(file.type)} text-orange-500"></i>
                <div>
                    <p class="text-sm font-medium text-gray-700">${file.name}</p>
                    <p class="text-xs text-gray-500">${formatFileSize(file.size)}</p>
                </div>
            </div>
            <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function getFileIcon(type) {
    if (type.startsWith('image/')) return 'fa-file-image';
    if (type.startsWith('video/')) return 'fa-file-video';
    if (type.startsWith('audio/')) return 'fa-file-audio';
    if (type.includes('pdf')) return 'fa-file-pdf';
    return 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

window.removeFile = function(index) {
    filesArray.splice(index, 1);
    updateFileList();
    if (fileInput) fileInput.value = '';
};

function mostrarNotificacao(mensagem, tipo) {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        tipo === 'success' ? 'bg-green-500' : tipo === 'error' ? 'bg-red-500' : 'bg-orange-500'
    } text-white`;
    notification.style.animation = 'slideInRight 0.3s ease';
    notification.innerHTML = `<div class="flex items-center space-x-2"><i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${mensagem}</span></div>`;
    document.body.appendChild(notification);
    
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }
    
    setTimeout(() => notification.remove(), 3000);
}

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

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    atualizarInterface();
    // carregar contadores e iniciar atualização periódica
    await carregarContadoresDinamicos();
    iniciarAtualizacaoPeriodicaContadores();
    switchTab('denuncia');
    configurarValidacaoData();
});

window.logout = logout;
window.switchTab = switchTab;
window.removeFile = removeFile;