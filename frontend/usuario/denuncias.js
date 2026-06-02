const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let denuncias = [];
let denunciasFiltradas = [];

// MODAL DE NOTIFICAÇÃO ESTILIZADO
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

// ============================================
// TOAST DE NOTIFICAÇÃO
// ============================================
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

// ============================================
// LOADING OVERLAY
// ============================================
function showLoading(show, message = 'Carregando...') {
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

// ============================================
// VERIFICAR AUTENTICAÇÃO
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
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatDate(data) {
    if (!data) return 'Data não informada';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
}

function getStatusColor(status) {
    const cores = {
        'pendente': 'bg-yellow-100 text-yellow-800',
        'em_andamento': 'bg-blue-100 text-blue-800',
        'concluida': 'bg-green-100 text-green-800',
        'arquivada': 'bg-gray-100 text-gray-800'
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
}

function translateStatus(status) {
    const traducoes = {
        'pendente': 'Pendente',
        'em_andamento': 'Em Análise',
        'concluida': 'Concluída',
        'arquivada': 'Arquivada'
    };
    return traducoes[status] || status;
}

async function buscarAnexos(denunciaId, reclamacaoId) {
    try {
        let url;
        if (denunciaId) {
            url = `${API_URL}/anexos/denuncia/${denunciaId}?usuario_id=${usuarioLogado.id}`;
        } else if (reclamacaoId) {
            url = `${API_URL}/anexos/reclamacao/${reclamacaoId}?usuario_id=${usuarioLogado.id}`;
        } else {
            return [];
        }

        const response = await fetch(url);
        const data = await response.json();
        return data.success ? data.anexos : [];
    } catch (error) {
        console.error('Erro ao buscar anexos:', error);
        return [];
    }
}

function criarUrlAnexo(anexo) {
    if (!anexo) return '#';
    if (anexo.base64) {
        return anexo.base64.startsWith('data:')
            ? anexo.base64
            : `data:${anexo.tipo || 'application/octet-stream'};base64,${anexo.base64}`;
    }
    if (anexo.url) return anexo.url;
    if (anexo.caminho) return `http://localhost:3000${anexo.caminho}`;
    return '#';
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function renderAnexosHtml(anexos = []) {
    if (!anexos || anexos.length === 0) {
        return `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-500">
                <i class="fas fa-paperclip text-gray-400 text-lg mb-2 block"></i>
                Nenhum anexo enviado.
            </div>
        `;
    }

    return `
        <div class="mt-4">
            <div class="flex items-center space-x-2 mb-3">
                <i class="fas fa-paperclip text-orange-500"></i>
                <span class="font-semibold text-gray-700">Anexos (${anexos.length})</span>
            </div>
            <div class="grid grid-cols-1 gap-3">
                ${anexos.map(anexo => {
                    const fileName = anexo.nome || 'Arquivo';
                    const fileExt = fileName.split('.').pop().toLowerCase();
                    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExt);
                    const fileUrl = criarUrlAnexo(anexo);
                    const fileIcon = isImage ? 'fa-file-image' : fileExt === 'pdf' ? 'fa-file-pdf' : ['doc', 'docx'].includes(fileExt) ? 'fa-file-word' : ['xls', 'xlsx'].includes(fileExt) ? 'fa-file-excel' : ['zip', 'rar', '7z'].includes(fileExt) ? 'fa-file-archive' : 'fa-file-alt';

                    return `
                        <div class="bg-gray-50 rounded-xl border border-gray-200 p-3">
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                    <i class="fas ${fileIcon}"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-semibold text-gray-800 truncate" title="${fileName}">${escapeHtml(fileName)}</p>
                                    <p class="text-xs text-gray-500 mt-1">${isImage ? 'Imagem' : 'Documento'}${anexo.tamanho ? ` • ${formatFileSize(anexo.tamanho)}` : ''}</p>
                                    <div class="mt-3">
                                        ${isImage ? `<img src="${fileUrl}" alt="${escapeHtml(fileName)}" class="w-full max-h-52 object-contain rounded-lg border border-gray-200" />` : ''}
                                        <a href="${fileUrl}" download="${escapeHtml(fileName)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 mt-3 text-orange-600 text-sm font-medium hover:text-orange-800">
                                            <i class="fas fa-external-link-alt"></i> Abrir / Baixar anexo
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

// ============================================
// CARREGAR DENÚNCIAS
// ============================================
async function carregarDenuncias() {
    try {
        showLoading(true, 'Carregando suas denúncias...');
        
        const response = await fetch(`${API_URL}/denuncias?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            denuncias = await response.json();
            denunciasFiltradas = [...denuncias];
            console.log(`✅ ${denuncias.length} denúncias carregadas`);
            mostrarNotificacao(`${denuncias.length} denúncias encontradas`, 'success');
        } else {
            throw new Error('Erro ao carregar denúncias');
        }
        await atualizarInterface();
    } catch (error) {
        console.error('Erro:', error);
        denuncias = [];
        denunciasFiltradas = [];
        await atualizarInterface();
        mostrarNotificacao('Erro ao carregar denúncias. Verifique sua conexão.', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// ATUALIZAR INTERFACE
// ============================================
async function atualizarInterface() {
    document.getElementById('usuarioNome').textContent = usuarioLogado.nome;
    document.getElementById('usuarioProcesso').textContent = `Processo: ${usuarioLogado.numero_processo}`;
    document.getElementById('saudacaoNome').textContent = usuarioLogado.nome.split(' ')[0];
    
    const initials = getInitials(usuarioLogado.nome);
    document.getElementById('usuarioAvatar').textContent = initials;
    document.getElementById('avatarMobile').textContent = initials;
    document.getElementById('nomeMobile').textContent = usuarioLogado.nome;
    document.getElementById('processoMobile').textContent = `Processo: ${usuarioLogado.numero_processo}`;
    
    // Atualizar contador de denúncias localmente
    const denunciasEl = document.getElementById('denunciasCount');
    if (denunciasEl) {
        denunciasEl.textContent = denuncias.length;
        denunciasEl.style.display = denuncias.length > 0 ? 'inline-flex' : 'none';
    }

    // Buscar contador de reclamações via API (não inferir a partir de denúncias)
    try {
        const resp = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
        if (resp.ok) {
            const recData = await resp.json();
            const totalReclamacoes = Array.isArray(recData) ? recData.length : 0;
            const reclamacoesEl = document.getElementById('reclamacoesCount');
            if (reclamacoesEl) {
                reclamacoesEl.textContent = totalReclamacoes;
                reclamacoesEl.style.display = totalReclamacoes > 0 ? 'inline-flex' : 'none';
            }
        }
    } catch (err) {
        console.error('Erro ao buscar contadores de reclamações:', err);
    }

    // Atualizar badge de notificações baseado nas denúncias pendentes
    const pendentes = denuncias.filter(d => d.status === 'pendente').length;
    const notif = document.getElementById('notificationBadge');
    if (notif) {
        if (pendentes > 0) {
            notif.textContent = pendentes;
            notif.classList.remove('hidden');
        } else {
            notif.classList.add('hidden');
        }
    }
    
    renderizarDenuncias();
}

// ============================================
// RENDERIZAR LISTA DE DENÚNCIAS
// ============================================
function renderizarDenuncias() {
    const lista = document.getElementById('denunciasList');
    const emptyState = document.getElementById('emptyState');
    
    if (denunciasFiltradas.length === 0) {
        lista.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    lista.innerHTML = denunciasFiltradas.map(denuncia => `
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition transform hover:-translate-y-1 duration-300">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h2 class="text-xl font-bold text-gray-800">${escapeHtml(denuncia.titulo)}</h2>
                        <span class="lg:hidden inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(denuncia.status)}">${translateStatus(denuncia.status)}</span>
                    </div>
                    <p class="text-gray-600 mb-4">${escapeHtml(denuncia.descricao.substring(0, 200))}${denuncia.descricao.length > 200 ? '...' : ''}</p>
                    
                    <!-- Anexos -->
                    ${denuncia.anexos && denuncia.anexos.length > 0 ? `
                        <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-paperclip text-orange-500 mr-2"></i>
                                <span class="text-sm font-medium text-gray-700">Anexos (${denuncia.anexos.length})</span>
                            </div>
                            <div class="flex flex-wrap gap-2">
                                ${denuncia.anexos.map(anexo => `
                                    <span class="inline-flex items-center px-2 py-1 bg-white rounded-lg text-xs text-gray-600 border">
                                        <i class="fas fa-file-alt mr-1 text-orange-500"></i>
                                        ${escapeHtml(anexo.nome)}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-hashtag w-4 text-orange-400"></i>
                            <span><span class="font-medium">Protocolo:</span> ${denuncia.protocolo || 'N/A'}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-tag w-4 text-orange-400"></i>
                            <span><span class="font-medium">Categoria:</span> ${denuncia.tipo}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-calendar-alt w-4 text-orange-400"></i>
                            <span><span class="font-medium">Data:</span> ${formatDate(denuncia.data_ocorrencia)}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-gray-600">
                            <i class="fas fa-map-marker-alt w-4 text-orange-400"></i>
                            <span><span class="font-medium">Local:</span> ${escapeHtml(denuncia.local)}</span>
                        </div>
                    </div>
                </div>
                <div class="hidden lg:flex flex-col items-end gap-3">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(denuncia.status)}">
                        <span class="w-2 h-2 ${denuncia.status === 'pendente' ? 'bg-yellow-500' : denuncia.status === 'em_andamento' ? 'bg-blue-500' : denuncia.status === 'concluida' ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2"></span>
                        ${translateStatus(denuncia.status)}
                    </span>
                    <div class="flex space-x-2">
                        <button onclick="verDetalhes(${denuncia.id})" class="p-2 text-gray-500 hover:text-orange-600 transition transform hover:scale-110">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="lg:hidden flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                <button onclick="verDetalhes(${denuncia.id})" class="text-gray-500 hover:text-orange-600 transition px-3 py-1 rounded-lg bg-gray-50">
                    <i class="fas fa-eye mr-1"></i> Ver detalhes
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// ESCAPE HTML
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// FILTRAR POR STATUS
// ============================================
function filtrarPorStatus(status, event) {
    if (status === 'todos') {
        denunciasFiltradas = [...denuncias];
    } else {
        denunciasFiltradas = denuncias.filter(d => d.status === status);
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('bg-orange-500', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    if (event && event.target) {
        event.target.classList.remove('bg-gray-100', 'text-gray-700');
        event.target.classList.add('bg-orange-500', 'text-white');
    }
    
    renderizarDenuncias();
    mostrarNotificacao(`${denunciasFiltradas.length} denúncias encontradas`, 'info');
}

// ============================================
// FILTRAR POR PESQUISA
// ============================================
function filtrarDenuncias() {
    const termo = document.getElementById('searchInput').value.toLowerCase();
    if (!termo) {
        denunciasFiltradas = [...denuncias];
    } else {
        denunciasFiltradas = denuncias.filter(d => 
            d.titulo.toLowerCase().includes(termo) ||
            d.protocolo?.toLowerCase().includes(termo) ||
            d.local.toLowerCase().includes(termo) ||
            d.descricao.toLowerCase().includes(termo)
        );
    }
    renderizarDenuncias();
}

// ============================================
// VER DETALHES COM MODAL INTERATIVO
// ============================================
async function verDetalhes(id) {
    const denuncia = denuncias.find(d => d.id === id);
    if (!denuncia) return;

    const modalHtml = `
        <div class="space-y-3">
            <div class="flex items-center justify-between pb-3 border-b">
                <h3 class="text-lg font-bold text-gray-800"> Detalhes da Denúncia</h3>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(denuncia.status)}">
                    ${translateStatus(denuncia.status)}
                </span>
            </div>
            <div class="space-y-2">
                <p><strong class="text-orange-600">Protocolo:</strong> ${denuncia.protocolo || 'N/A'}</p>
                <p><strong class="text-orange-600">Título:</strong> ${escapeHtml(denuncia.titulo)}</p>
                <p><strong class="text-orange-600">Descrição:</strong> ${escapeHtml(denuncia.descricao)}</p>
                <p><strong class="text-orange-600">Categoria:</strong> ${denuncia.tipo}</p>
                <p><strong class="text-orange-600">Data:</strong> ${formatDate(denuncia.data_ocorrencia)}</p>
                <p><strong class="text-orange-600">Local:</strong> ${escapeHtml(denuncia.local)}</p>
                <p><strong class="text-orange-600">Criada em:</strong> ${formatDate(denuncia.createdAt)}</p>
                ${denuncia.updatedAt ? `<p><strong class="text-orange-600">Última atualização:</strong> ${formatDate(denuncia.updatedAt)}</p>` : ''}
            </div>
            ${anexosHtml}
        </div>
    `;
    
    // Criar modal customizado para detalhes
    const existingModal = document.getElementById('detalhesModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'detalhesModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn 0.3s ease';
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 sticky top-0">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                            <i class="fas fa-file-alt text-orange-600 text-xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-white">Detalhes da Denúncia</h3>
                    </div>
                    <button onclick="fecharModalDetalhes()" class="text-white hover:text-gray-200 transition">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
            </div>
            <div class="px-6 py-6">
                ${modalHtml}
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button onclick="fecharModalDetalhes()" class="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
                    <i class="fas fa-check mr-2"></i>Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function fecharModalDetalhes() {
    const modal = document.getElementById('detalhesModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

// ============================================
// LOGOUT COM CONFIRMAÇÃO
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
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    
    await carregarDenuncias();
    
    // Adicionar debounce na pesquisa
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(filtrarDenuncias, 300);
        });
    }
});

// Exportar funções globais
window.logout = logout;
window.verDetalhes = verDetalhes;
window.filtrarDenuncias = filtrarDenuncias;
window.filtrarPorStatus = filtrarPorStatus;
window.fecharModalDetalhes = fecharModalDetalhes;