const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let reclamacoes = [];
let reclamacoesFiltradas = [];

// ============================================
// MODAIS E NOTIFICAÇÕES MODERNOS
// ============================================

// Função para mostrar modal personalizado (substitui o alert)
function showModal(title, message, type = 'info', onConfirm = null, onCancel = null) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    const config = {
        success: { icon: 'fa-check-circle', color: 'from-green-500 to-green-600', textColor: 'text-green-600' },
        error: { icon: 'fa-exclamation-circle', color: 'from-red-500 to-red-600', textColor: 'text-red-600' },
        warning: { icon: 'fa-exclamation-triangle', color: 'from-yellow-500 to-yellow-600', textColor: 'text-yellow-600' },
        info: { icon: 'fa-info-circle', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600' },
        question: { icon: 'fa-question-circle', color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600' }
    };
    
    const currentConfig = config[type] || config.info;
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden modal-slide-in">
            <div class="bg-gradient-to-r ${currentConfig.color} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${currentConfig.icon} ${currentConfig.textColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${escapeHtml(title)}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">${escapeHtml(message)}</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                ${onCancel ? `
                    <button id="modalCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                        <i class="fas fa-times mr-2"></i>Cancelar
                    </button>
                ` : ''}
                <button id="modalConfirmBtn" class="px-5 py-2 bg-gradient-to-r ${currentConfig.color} text-white rounded-lg transition transform hover:scale-105 font-medium shadow-md">
                    <i class="fas ${type === 'question' ? 'fa-check' : 'fa-check-circle'} mr-2"></i>${onCancel ? 'Confirmar' : 'OK'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    
    document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
        closeModal();
        if (onConfirm) onConfirm();
    });
    
    if (onCancel) {
        document.getElementById('modalCancelBtn')?.addEventListener('click', () => {
            closeModal();
            if (onCancel) onCancel();
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
            if (onCancel) onCancel();
        }
    });
}

// Função para mostrar toast de notificação
function showToast(type, message, duration = 3000) {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' }
    };
    
    const currentConfig = config[type] || config.info;
    
    const toast = document.createElement('div');
    toast.className = `custom-toast fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 ${currentConfig.bg} text-white toast-slide-in`;
    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${currentConfig.icon} text-lg"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Mostrar detalhes da reclamação em modal (substitui o alert)
function showDetailsModal(reclamacao) {
    const statusCores = {
        aberta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        em_andamento: 'bg-blue-100 text-blue-800 border-blue-300',
        resolvida: 'bg-green-100 text-green-800 border-green-300',
        fechada: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    const categoriaLabels = {
        infraestrutura: '🏗️ Infraestrutura',
        saude: '🏥 Saúde',
        educacao: '📚 Educação',
        'meio-ambiente': '🌱 Meio Ambiente',
        seguranca: '🔒 Segurança',
        saneamento: '🚰 Saneamento',
        outro: '📌 Outro'
    };
    
    const statusColor = statusCores[reclamacao.status] || statusCores.aberta;
    const dataCriacao = new Date(reclamacao.createdAt).toLocaleString('pt-PT');
    const dataOcorrencia = new Date(reclamacao.data_ocorrencia).toLocaleDateString('pt-PT');
    
    const modalContent = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-gray-800">${escapeHtml(reclamacao.titulo)}</h3>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                    ${translateStatus(reclamacao.status)}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-tag text-orange-500 w-4"></i>
                    <span class="text-gray-600">Categoria:</span>
                    <span class="font-medium">${categoriaLabels[reclamacao.categoria] || reclamacao.categoria}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-map-marker-alt text-orange-500 w-4"></i>
                    <span class="text-gray-600">Local:</span>
                    <span class="font-medium">${escapeHtml(reclamacao.local || 'Não informado')}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-hashtag text-orange-500 w-4"></i>
                    <span class="text-gray-600">Protocolo:</span>
                    <span class="font-medium">${reclamacao.protocolo || 'N/A'}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-calendar-alt text-orange-500 w-4"></i>
                    <span class="text-gray-600">Data ocorrência:</span>
                    <span class="font-medium">${dataOcorrencia}</span>
                </div>
                <div class="flex items-center space-x-2 col-span-2">
                    <i class="fas fa-clock text-orange-500 w-4"></i>
                    <span class="text-gray-600">Registrada em:</span>
                    <span class="font-medium">${dataCriacao}</span>
                </div>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-align-left text-orange-500 mr-2"></i>Descrição
                </label>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(reclamacao.descricao)}</p>
                </div>
            </div>
            
            ${reclamacao.resposta ? `
            <div class="border-t border-gray-200 pt-4">
                <label class="block text-sm font-semibold text-green-700 mb-2">
                    <i class="fas fa-reply text-green-500 mr-2"></i>Resposta do IPIL
                </label>
                <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p class="text-gray-700 leading-relaxed">${escapeHtml(reclamacao.resposta)}</p>
                    <p class="text-xs text-gray-500 mt-2">Respondido em: ${new Date(reclamacao.updatedAt).toLocaleString('pt-PT')}</p>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    const existingModal = document.getElementById('detailsModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'detailsModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden modal-slide-in">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-file-alt text-white text-xl"></i>
                    <h3 class="text-xl font-bold text-white">Detalhes da Reclamação</h3>
                </div>
                <button onclick="closeDetailsModal()" class="text-white hover:text-gray-200 transition">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                ${modalContent}
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button onclick="closeDetailsModal()" class="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    <i class="fas fa-times mr-2"></i>Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================
// FUNÇÕES DE CONTADORES DINÂMICOS
// ============================================

// Carregar contadores de reclamações e denúncias
async function carregarContadoresDinamicos() {
    if (!usuarioLogado) return;
    
    try {
        // Buscar reclamações do usuário
        const responseReclamacoes = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
        let totalReclamacoes = 0;
        let reclamacoesAbertas = 0;
        
        if (responseReclamacoes.ok) {
            const data = await responseReclamacoes.json();
            totalReclamacoes = Array.isArray(data) ? data.length : 0;
            reclamacoesAbertas = Array.isArray(data) ? data.filter(r => r.status === 'aberta' || r.status === 'em_andamento').length : 0;
        }
        
        // Buscar denúncias do usuário
        const responseDenuncias = await fetch(`${API_URL}/denuncias?usuario_id=${usuarioLogado.id}`);
        let totalDenuncias = 0;
        
        if (responseDenuncias.ok) {
            const data = await responseDenuncias.json();
            totalDenuncias = Array.isArray(data) ? data.length : 0;
        }
        
        // Atualizar badges no menu
        const reclamacoesCount = document.getElementById('reclamacoesCount');
        const denunciasCount = document.getElementById('denunciasCount');
        const notificationBadge = document.getElementById('notificationBadge');
        
        if (reclamacoesCount) {
            reclamacoesCount.textContent = totalReclamacoes;
            reclamacoesCount.style.display = totalReclamacoes > 0 ? 'inline-flex' : 'none';
        }
        
        if (denunciasCount) {
            denunciasCount.textContent = totalDenuncias;
            denunciasCount.style.display = totalDenuncias > 0 ? 'inline-flex' : 'none';
        }
        
        // Atualizar badge de notificação (reclamações abertas/em andamento)
        if (notificationBadge) {
            if (reclamacoesAbertas > 0) {
                notificationBadge.textContent = reclamacoesAbertas;
                notificationBadge.classList.remove('hidden');
                // Adicionar tooltip
                notificationBadge.title = `${reclamacoesAbertas} reclamação(ões) pendente(s)`;
            } else {
                notificationBadge.classList.add('hidden');
            }
        }
        
        return { totalReclamacoes, totalDenuncias, reclamacoesAbertas };
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
        return { totalReclamacoes: 0, totalDenuncias: 0, reclamacoesAbertas: 0 };
    }
}

// Atualização periódica dos contadores
let intervaloAtualizacao = null;

function iniciarAtualizacaoPeriodica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    
    // Atualizar contadores a cada 30 segundos
    intervaloAtualizacao = setInterval(async () => {
        await carregarContadoresDinamicos();
        console.log('🔄 Contadores atualizados automaticamente');
    }, 30000);
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

function checkAuth() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    if (!usuario) { 
        window.location.href = './login.html'; 
        return null; 
    }
    return JSON.parse(usuario);
}

function getInitials(nome) {
    if (!nome) return 'U';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function formatDate(data) {
    if (!data) return 'Data não informada';
    const date = new Date(data);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR');
}

function getStatusColor(status) {
    const cores = {
        'aberta': 'bg-yellow-100 text-yellow-800',
        'em_andamento': 'bg-blue-100 text-blue-800',
        'resolvida': 'bg-green-100 text-green-800',
        'fechada': 'bg-gray-100 text-gray-800'
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
}

function translateStatus(status) {
    const traducoes = {
        'aberta': 'Aberta',
        'em_andamento': 'Em Análise',
        'resolvida': 'Resolvida',
        'fechada': 'Fechada'
    };
    return traducoes[status] || status;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function carregarReclamacoes() {
    try {
        const response = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            reclamacoes = await response.json();
            reclamacoesFiltradas = [...reclamacoes];
            console.log(`✅ ${reclamacoes.length} reclamações carregadas`);
            
            // Mostrar notificação de boas-vindas
            const abertas = reclamacoes.filter(r => r.status === 'aberta' || r.status === 'em_andamento').length;
            if (abertas > 0) {
                showToast('info', `Você tem ${abertas} reclamação(ões) em andamento`);
            } else {
                showToast('success', `Bem-vindo, ${usuarioLogado.nome.split(' ')[0]}!`);
            }
        } else {
            throw new Error('Erro ao carregar reclamações');
        }
        await atualizarInterface();
    } catch (error) {
        console.error('Erro:', error);
        reclamacoes = [];
        reclamacoesFiltradas = [];
        await atualizarInterface();
        showToast('error', 'Erro ao carregar reclamações');
    }
}

async function atualizarInterface() {
    // Atualizar informações do usuário
    const usuarioNome = document.getElementById('usuarioNome');
    const usuarioProcesso = document.getElementById('usuarioProcesso');
    const saudacaoNome = document.getElementById('saudacaoNome');
    const nomeMobile = document.getElementById('nomeMobile');
    const processoMobile = document.getElementById('processoMobile');
    
    if (usuarioNome) usuarioNome.textContent = usuarioLogado.nome;
    if (usuarioProcesso) usuarioProcesso.textContent = `Processo: ${usuarioLogado.numero_processo}`;
    if (saudacaoNome) saudacaoNome.textContent = usuarioLogado.nome.split(' ')[0];
    if (nomeMobile) nomeMobile.textContent = usuarioLogado.nome;
    if (processoMobile) processoMobile.textContent = `Processo: ${usuarioLogado.numero_processo}`;
    
    // Atualizar avatar
    const initials = getInitials(usuarioLogado.nome);
    const usuarioAvatar = document.getElementById('usuarioAvatar');
    const avatarMobile = document.getElementById('avatarMobile');
    if (usuarioAvatar) usuarioAvatar.textContent = initials;
    if (avatarMobile) avatarMobile.textContent = initials;
    
    // Atualizar contadores dinâmicos
    await carregarContadoresDinamicos();
    
    // Renderizar reclamações
    renderizarReclamacoes();
}

function renderizarReclamacoes() {
    const lista = document.getElementById('reclamacoesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!lista) return;
    
    if (reclamacoesFiltradas.length === 0) {
        lista.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    const categoriaLabels = {
        infraestrutura: '🏗️ Infraestrutura',
        saude: '🏥 Saúde',
        educacao: '📚 Educação',
        'meio-ambiente': '🌱 Meio Ambiente',
        seguranca: '🔒 Segurança',
        saneamento: '🚰 Saneamento',
        outro: '📌 Outro'
    };
    
    lista.innerHTML = reclamacoesFiltradas.map(reclamacao => `
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h2 class="text-xl font-bold text-gray-800">${escapeHtml(reclamacao.titulo)}</h2>
                        <span class="lg:hidden inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reclamacao.status)}">${translateStatus(reclamacao.status)}</span>
                    </div>
                    <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(reclamacao.descricao.substring(0, 150))}${reclamacao.descricao.length > 150 ? '...' : ''}</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-hashtag w-4 text-orange-400"></i>
                            <span><span class="font-medium">Protocolo:</span> ${reclamacao.protocolo || 'N/A'}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-tag w-4 text-orange-400"></i>
                            <span><span class="font-medium">Categoria:</span> ${categoriaLabels[reclamacao.categoria] || reclamacao.categoria}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-calendar-alt w-4 text-orange-400"></i>
                            <span><span class="font-medium">Data:</span> ${formatDate(reclamacao.data_ocorrencia)}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-map-marker-alt w-4 text-orange-400"></i>
                            <span><span class="font-medium">Local:</span> ${escapeHtml(reclamacao.local || 'Não informado')}</span>
                        </div>
                    </div>
                </div>
                <div class="hidden lg:flex flex-col items-end gap-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(reclamacao.status)}">
                        <span class="w-2 h-2 ${reclamacao.status === 'aberta' ? 'bg-yellow-500' : reclamacao.status === 'em_andamento' ? 'bg-blue-500' : 'bg-green-500'} rounded-full mr-2"></span>
                        ${translateStatus(reclamacao.status)}
                    </span>
                    <button onclick="verDetalhes(${reclamacao.id})" class="p-2 text-gray-500 hover:text-orange-600 transition">
                        <i class="fas fa-eye"></i> Ver detalhes
                    </button>
                </div>
            </div>
            <div class="lg:hidden flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button onclick="verDetalhes(${reclamacao.id})" class="text-gray-500 hover:text-orange-600 transition">
                    <i class="fas fa-eye mr-1"></i> Ver detalhes
                </button>
            </div>
        </div>
    `).join('');
}

function filtrarPorStatus(status) {
    if (status === 'todos') {
        reclamacoesFiltradas = [...reclamacoes];
    } else {
        reclamacoesFiltradas = reclamacoes.filter(r => r.status === status);
    }
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    if (event && event.target) {
        event.target.classList.remove('bg-gray-100', 'text-gray-700');
        event.target.classList.add('bg-orange-500', 'text-white');
    }
    
    renderizarReclamacoes();
    
    const count = reclamacoesFiltradas.length;
    showToast('info', `${count} reclamação(ões) encontrada(s)`);
}

function filtrarReclamacoes() {
    const termo = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (!termo) {
        reclamacoesFiltradas = [...reclamacoes];
    } else {
        reclamacoesFiltradas = reclamacoes.filter(r => 
            r.titulo.toLowerCase().includes(termo) ||
            r.protocolo?.toLowerCase().includes(termo) ||
            (r.local && r.local.toLowerCase().includes(termo)) ||
            r.descricao.toLowerCase().includes(termo)
        );
    }
    renderizarReclamacoes();
}

// Ver detalhes da reclamação (agora com modal moderno)
function verDetalhes(id) {
    const reclamacao = reclamacoes.find(r => r.id === id);
    if (reclamacao) {
        showDetailsModal(reclamacao);
    } else {
        showToast('error', 'Reclamação não encontrada');
    }
}

// ============================================
// LOGOUT COM CONFIRMAÇÃO MODERNA
// ============================================

function logout() {
    showModal('Sair do Sistema', 'Tem certeza que deseja encerrar sua sessão?', 'question', () => {
        showToast('success', 'Sessão encerrada com sucesso!');
        setTimeout(() => {
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('token');
            window.location.href = '../login.html';
        }, 500);
    });
}

// ============================================
// ESTILOS CSS DINÂMICOS
// ============================================

function adicionarEstilos() {
    if (document.getElementById('dynamicStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'dynamicStyles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-50px) scale(0.9); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes bounce {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-5px); }
        }
        .modal-slide-in {
            animation: slideIn 0.3s ease;
        }
        .toast-slide-in {
            animation: slideInRight 0.3s ease;
        }
        .custom-toast {
            animation: slideInRight 0.3s ease;
        }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .status-badge {
            transition: all 0.3s ease;
        }
        .status-badge:hover {
            transform: scale(1.05);
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    adicionarEstilos();
    
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    
    await carregarReclamacoes();
    iniciarAtualizacaoPeriodica();
    
    console.log('✅ Página de reclamações inicializada');
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.logout = logout;
window.verDetalhes = verDetalhes;
window.filtrarReclamacoes = filtrarReclamacoes;
window.filtrarPorStatus = filtrarPorStatus;
window.closeDetailsModal = closeDetailsModal;