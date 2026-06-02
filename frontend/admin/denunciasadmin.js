
let denunciasData = [];
let usuariosData = [];

// ============================================
// MODAIS E NOTIFICAÇÕES MODERNOS
// ============================================

// Função para mostrar modal personalizado
function showModal(title, message, type = 'info', onConfirm = null, onCancel = null) {
    // Remover modal existente
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Configurar ícones e cores baseado no tipo
    const config = {
        success: { icon: 'fa-check-circle', color: 'from-green-500 to-green-600', bgIcon: 'bg-green-100', textColor: 'text-green-600' },
        error: { icon: 'fa-exclamation-circle', color: 'from-red-500 to-red-600', bgIcon: 'bg-red-100', textColor: 'text-red-600' },
        warning: { icon: 'fa-exclamation-triangle', color: 'from-yellow-500 to-yellow-600', bgIcon: 'bg-yellow-100', textColor: 'text-yellow-600' },
        info: { icon: 'fa-info-circle', color: 'from-blue-500 to-blue-600', bgIcon: 'bg-blue-100', textColor: 'text-blue-600' },
        question: { icon: 'fa-question-circle', color: 'from-orange-500 to-orange-600', bgIcon: 'bg-orange-100', textColor: 'text-orange-600' }
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
                <p class="text-gray-700 text-base leading-relaxed">${escapeHtml(message)}</p>
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

async function buscarAnexos(denunciaId, reclamacaoId) {
    try {
        let url;
        if (denunciaId) {
            url = `http://localhost:3000/api/anexos/denuncia/${denunciaId}`;
        } else if (reclamacaoId) {
            url = `http://localhost:3000/api/anexos/reclamacao/${reclamacaoId}`;
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
                Nenhum anexo disponível.
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

// Função para mostrar detalhes em modal
async function showDetailsModal(denuncia) {
    const nomeUsuario = getUsuarioNome(denuncia.usuario_id);
    const statusCores = {
        pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        em_andamento: 'bg-blue-100 text-blue-800 border-blue-300',
        concluida: 'bg-green-100 text-green-800 border-green-300',
        arquivada: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    
    const statusColor = statusCores[denuncia.status] || statusCores.pendente;
    const dataCriacao = new Date(denuncia.createdAt).toLocaleString('pt-PT');
    const dataAtualizacao = new Date(denuncia.updatedAt).toLocaleString('pt-PT');
    // Não incluir anexos no modal de detalhes conforme solicitado.
    
    const categoriaLabels = {
        infraestrutura: '🏗️ Infraestrutura',
        saude: '🏥 Saúde',
        educacao: '📚 Educação',
        'meio-ambiente': '🌱 Meio Ambiente',
        seguranca: '🔒 Segurança',
        saneamento: '🚰 Saneamento',
        outro: '📌 Outro'
    };
    
    const modalContent = `
        <div class="space-y-4">
            <div class="flex justify-between items-start">
                <h3 class="text-xl font-bold text-gray-800">${escapeHtml(denuncia.titulo)}</h3>
                <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColor}">
                    ${denuncia.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-tag text-orange-500 w-4"></i>
                    <span class="text-gray-600">Tipo:</span>
                    <span class="font-medium">${categoriaLabels[denuncia.tipo] || denuncia.tipo}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-map-marker-alt text-orange-500 w-4"></i>
                    <span class="text-gray-600">Local:</span>
                    <span class="font-medium">${escapeHtml(denuncia.local || 'Não informado')}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-user text-orange-500 w-4"></i>
                    <span class="text-gray-600">Usuário:</span>
                    <span class="font-medium">${escapeHtml(nomeUsuario)}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <i class="fas fa-hashtag text-orange-500 w-4"></i>
                    <span class="text-gray-600">Protocolo:</span>
                    <span class="font-medium">${denuncia.protocolo || 'N/A'}</span>
                </div>
                <div class="flex items-center space-x-2 col-span-2">
                    <i class="fas fa-calendar-alt text-orange-500 w-4"></i>
                    <span class="text-gray-600">Criada em:</span>
                    <span class="font-medium">${dataCriacao}</span>
                </div>
                <div class="flex items-center space-x-2 col-span-2">
                    <i class="fas fa-clock text-orange-500 w-4"></i>
                    <span class="text-gray-600">Atualizada em:</span>
                    <span class="font-medium">${dataAtualizacao}</span>
                </div>
                ${denuncia.anonimo ? `
                <div class="flex items-center space-x-2 col-span-2">
                    <i class="fas fa-user-secret text-orange-500 w-4"></i>
                    <span class="text-gray-600">Tipo:</span>
                    <span class="font-medium text-orange-600">Denúncia Anônima</span>
                </div>
                ` : ''}
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                    <i class="fas fa-align-left text-orange-500 mr-2"></i>Descrição
                </label>
                <div class="bg-gray-50 p-4 rounded-lg">
                    <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(denuncia.descricao)}</p>
                </div>
            </div>
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
                    <i class="fas fa-exclamation-triangle text-white text-xl"></i>
                    <h3 class="text-xl font-bold text-white">Detalhes da Denúncia</h3>
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
// FUNÇÕES DE CARREGAMENTO DE CONTADORES
// ============================================

async function carregarContadoresDinamicos() {
    try {
        // Carregar contador de denúncias
        const denunciasResponse = await fetch('http://localhost:3000/api/denuncias');
        const denuncias = await denunciasResponse.json();
        const totalDenuncias = Array.isArray(denuncias) ? denuncias.length : 0;
        
        // Carregar contador de reclamações
        const reclamacoesResponse = await fetch('http://localhost:3000/api/reclamacoes');
        const reclamacoes = await reclamacoesResponse.json();
        const totalReclamacoes = Array.isArray(reclamacoes) ? reclamacoes.length : 0;
        
        // Carregar contador de usuários
        const usuariosResponse = await fetch('http://localhost:3000/api/usuarios');
        const usuarios = await usuariosResponse.json();
        const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;
        
        // Atualizar badges no menu
        const badgeDenuncias = document.getElementById('badgeDenuncias');
        const badgeReclamacoes = document.getElementById('badgeReclamacoes');
        const badgeUsuarios = document.getElementById('badgeUsuarios');
        
        if (badgeDenuncias) {
            badgeDenuncias.innerText = totalDenuncias;
            badgeDenuncias.style.display = totalDenuncias > 0 ? 'inline-flex' : 'none';
        }
        
        if (badgeReclamacoes) {
            badgeReclamacoes.innerText = totalReclamacoes;
            badgeReclamacoes.style.display = totalReclamacoes > 0 ? 'inline-flex' : 'none';
        }
        
        if (badgeUsuarios) {
            badgeUsuarios.innerText = totalUsuarios;
            badgeUsuarios.style.display = totalUsuarios > 0 ? 'inline-flex' : 'none';
        }
        
        return { totalDenuncias, totalReclamacoes, totalUsuarios };
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
        return { totalDenuncias: 0, totalReclamacoes: 0, totalUsuarios: 0 };
    }
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

// Verificar administrador
function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        showModal('Acesso Negado', 'Você não está autenticado. Por favor, faça login.', 'error', () => {
            window.location.href = '../login.html';
        });
        return null;
    }
    
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== 'admin') {
        showModal('Acesso Negado', 'Apenas administradores podem acessar esta página.', 'error', () => {
            window.location.href = '../usuario/dashboard.html';
        });
        return null;
    }
    
    const adminNomeElement = document.getElementById('adminNome');
    if (adminNomeElement) adminNomeElement.innerText = usuario.nome;
    return usuario;
}

// Buscar dados
async function buscarDenuncias() {
    try {
        const response = await fetch('http://localhost:3000/api/denuncias');
        const data = await response.json();
        denunciasData = Array.isArray(data) ? data : (data.data || []);
        return denunciasData;
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        showToast('error', 'Erro ao carregar denúncias');
        return [];
    }
}

async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = Array.isArray(data) ? data : (data.data || []);
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

// Obter nome do usuário por ID
function getUsuarioNome(usuarioId) {
    if (!usuarioId) return 'Anônimo';
    const usuario = usuariosData.find(u => u.id === usuarioId);
    return usuario ? usuario.nome : 'Usuário não encontrado';
}

// Atualizar status com confirmação
function atualizarStatus(id, novoStatus) {
    const statusLabels = {
        pendente: 'Pendente',
        em_andamento: 'Em Andamento',
        concluida: 'Concluída',
        arquivada: 'Arquivada'
    };
    
    showModal('Confirmar Alteração', `Deseja alterar o status desta denúncia para "${statusLabels[novoStatus] || novoStatus}"?`, 'question', async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/denuncias/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: novoStatus })
            });
            
            if (response.ok) {
                showToast('success', `Status atualizado para ${statusLabels[novoStatus] || novoStatus}`);
                await carregarDenuncias();
                await carregarContadoresDinamicos();
            } else {
                showToast('error', 'Erro ao atualizar status');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('error', 'Erro ao conectar ao servidor');
        }
    });
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar lista de denúncias
function renderizarDenuncias(denuncias) {
    const container = document.getElementById('listaDenuncias');
    const totalSpan = document.getElementById('totalDenunciasTexto');
    
    if (totalSpan) totalSpan.innerText = `${denuncias.length} denúncia(s) encontrada(s)`;
    
    if (denuncias.length === 0) {
        if (container) {
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-md p-12 text-center">
                    <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-500">Nenhuma denúncia encontrada</h3>
                    <p class="text-gray-400 mt-2">Não há denúncias registradas no momento.</p>
                </div>
            `;
        }
        return;
    }
    
    const statusCores = {
        pendente: { bg: 'from-yellow-400 to-yellow-600', badge: 'bg-yellow-200 text-yellow-800', icon: 'fa-clock' },
        em_andamento: { bg: 'from-blue-400 to-blue-600', badge: 'bg-blue-200 text-blue-800', icon: 'fa-sync-alt' },
        concluida: { bg: 'from-green-400 to-green-600', badge: 'bg-green-200 text-green-800', icon: 'fa-check-circle' },
        arquivada: { bg: 'from-gray-400 to-gray-600', badge: 'bg-gray-200 text-gray-800', icon: 'fa-archive' }
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
    
    let html = '';
    
    denuncias.forEach(denuncia => {
        const statusInfo = statusCores[denuncia.status] || statusCores.pendente;
        const dataCriacao = new Date(denuncia.createdAt).toLocaleDateString('pt-PT');
        const nomeUsuario = getUsuarioNome(denuncia.usuario_id);
        const categoriaLabel = categoriaLabels[denuncia.tipo] || denuncia.tipo;
        
        html += `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <div class="px-6 py-4 bg-gradient-to-r ${statusInfo.bg} flex flex-wrap justify-between items-center gap-3">
                    <h3 class="text-lg font-bold text-white">${escapeHtml(denuncia.titulo)}</h3>
                    <span class="px-3 py-1 ${statusInfo.badge} rounded-full text-xs font-semibold flex items-center status-badge">
                        <i class="fas ${statusInfo.icon} mr-2"></i>
                        ${denuncia.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                
                <div class="p-6">
                    <p class="text-gray-600 mb-4">${escapeHtml(denuncia.descricao.substring(0, 150))}${denuncia.descricao.length > 150 ? '...' : ''}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-tag text-orange-500 w-4"></i>
                            <span class="text-gray-800 font-medium">${categoriaLabel}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-map-marker-alt text-orange-500 w-4"></i>
                            <span class="text-gray-800 font-medium">${escapeHtml(denuncia.local || 'Não informado')}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-user text-orange-500 w-4"></i>
                            <span class="text-gray-800 font-medium">${escapeHtml(nomeUsuario)}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-calendar-alt text-orange-500 w-4"></i>
                            <span class="text-gray-800 font-medium">${dataCriacao}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-hashtag text-orange-500 w-4"></i>
                            <span class="text-gray-800 font-medium">${denuncia.protocolo || 'N/A'}</span>
                        </div>
                        ${denuncia.anonimo ? `
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-user-secret text-orange-500 w-4"></i>
                            <span class="text-orange-600 font-medium">Anônima</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
                        <div class="flex items-center space-x-3">
                            <span class="text-sm font-medium text-gray-700">Atualizar estado:</span>
                            <select id="statusSelect_${denuncia.id}" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                                <option value="pendente" ${denuncia.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
                                <option value="em_andamento" ${denuncia.status === 'em_andamento' ? 'selected' : ''}>⚙️ Em andamento</option>
                                <option value="concluida" ${denuncia.status === 'concluida' ? 'selected' : ''}>✅ Concluída</option>
                                <option value="arquivada" ${denuncia.status === 'arquivada' ? 'selected' : ''}>📦 Arquivada</option>
                            </select>
                            <button onclick="atualizarStatus(${denuncia.id}, document.getElementById('statusSelect_${denuncia.id}').value)" 
                                    class="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200 transition">
                                <i class="fas fa-sync-alt mr-1"></i> Atualizar
                            </button>
                        </div>
                        
                        <button onclick="showDetailsModal(denunciasData.find(d => d.id === ${denuncia.id}))" 
                                class="text-blue-600 hover:text-blue-800 transition p-2" title="Ver detalhes">
                            <i class="fas fa-eye"></i> Ver detalhes
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (container) container.innerHTML = html;
}

// Aplicar filtros
function aplicarFiltros() {
    const statusFiltro = document.getElementById('filtroStatus')?.value || 'todos';
    const categoriaFiltro = document.getElementById('filtroCategoria')?.value || 'todas';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    let filtradas = [...denunciasData];
    
    if (statusFiltro !== 'todos') {
        filtradas = filtradas.filter(d => d.status === statusFiltro);
    }
    
    if (categoriaFiltro !== 'todas') {
        filtradas = filtradas.filter(d => d.tipo === categoriaFiltro);
    }
    
    if (searchTerm) {
        filtradas = filtradas.filter(d => 
            d.titulo.toLowerCase().includes(searchTerm) ||
            d.descricao.toLowerCase().includes(searchTerm) ||
            (d.local && d.local.toLowerCase().includes(searchTerm)) ||
            getUsuarioNome(d.usuario_id).toLowerCase().includes(searchTerm)
        );
    }
    
    renderizarDenuncias(filtradas);
}

// Carregar denúncias principal
async function carregarDenuncias() {
    const container = document.getElementById('listaDenuncias');
    if (container) {
        container.innerHTML = `
            <div class="flex justify-center items-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                <p class="ml-3 text-gray-500">Carregando denúncias...</p>
            </div>
        `;
    }
    
    await buscarDenuncias();
    await buscarUsuarios();
    renderizarDenuncias(denunciasData);
    await carregarContadoresDinamicos();
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
// ATUALIZAÇÃO PERIÓDICA DOS CONTADORES
// ============================================

let intervaloAtualizacao = null;

function iniciarAtualizacaoPeriodica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    
    intervaloAtualizacao = setInterval(async () => {
        await carregarContadoresDinamicos();
        console.log('🔄 Contadores atualizados automaticamente');
    }, 30000);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
    const admin = verificarAdmin();
    if (!admin) return;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('keyup', aplicarFiltros);
    
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros);
    
    const filtroCategoria = document.getElementById('filtroCategoria');
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
    
    await carregarDenuncias();
    iniciarAtualizacaoPeriodica();
    
    showToast('success', 'Bem-vindo ao painel de denúncias!');
}

// ============================================
// ESTILOS CSS DINÂMICOS
// ============================================

const style = document.createElement('style');
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
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
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
    .animate-spin {
        animation: spin 1s linear infinite;
    }
`;
document.head.appendChild(style);

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.atualizarStatus = atualizarStatus;
window.logout = logout;
window.showDetailsModal = showDetailsModal;
window.closeDetailsModal = closeDetailsModal;
window.denunciasData = () => denunciasData;

document.addEventListener('DOMContentLoaded', init);