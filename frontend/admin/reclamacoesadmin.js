// reclamacoesadmin.js - Script da página de Reclamações

let reclamacoesData = [];
let usuariosData = [];


// Verificar administrador
function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== 'admin') {
        alert(' Acesso negado! Apenas administradores.');
        window.location.href = '../aluno/dashboard.html';
        return null;
    }
    document.getElementById('adminNome').innerText = usuario.nome;
    return usuario;
}

// Buscar dados
async function buscarReclamacoes() {
    try {
        const response = await fetch('http://localhost:3000/api/reclamacoes');
        const data = await response.json();
        reclamacoesData = Array.isArray(data) ? data : [];
        return reclamacoesData;
    } catch (error) {
        console.error('Erro ao buscar reclamações:', error);
        return [];
    }
}

async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = Array.isArray(data) ? data : [];
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}


// Obter nome de usuário por ID

function getUsuarioNome(usuarioId) {
    if (!usuarioId) return 'Anônimo';
    const usuario = usuariosData.find(u => u.id === usuarioId);
    return usuario ? usuario.nome : 'Usuário não encontrado';
}

// Actualizar status

async function atualizarStatus(id, novoStatus) {
    try {
        const response = await fetch(`http://localhost:3000/api/reclamacoes/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        
        if (response.ok) {
            console.log(` Status da reclamação ${id} atualizado para: ${novoStatus}`);
            showToast('success', `Status atualizado para ${novoStatus.replace('_', ' ')}`);
            await carregarReclamacoes();
        } else {
            console.error('Erro ao atualizar status');
            showToast('error', 'Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', 'Erro ao conectar ao servidor');
    }
}

// Toast de notificacões
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}


// Escape html
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Renderizar lista de reclamações
function renderizarReclamacoes(reclamacoes) {
    const container = document.getElementById('listaReclamacoes');
    const totalSpan = document.getElementById('totalReclamacoesTexto');
    const badgeReclamacoes = document.getElementById('badgeReclamacoes');
    
    totalSpan.innerText = `${reclamacoes.length} reclamação(ões) encontrada(s)`;
    badgeReclamacoes.innerText = reclamacoes.length;
    
    if (reclamacoes.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-12 text-center">
                <i class="fas fa-inbox text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-500">Nenhuma reclamação encontrada</h3>
                <p class="text-gray-400 mt-2">Não há reclamações registradas no momento.</p>
            </div>
        `;
        return;
    }
    
    const statusCores = {
        aberta: { bg: 'from-yellow-400 to-yellow-600', badge: 'bg-yellow-200 text-yellow-800', icon: 'fa-envelope-open' },
        em_andamento: { bg: 'from-blue-400 to-blue-600', badge: 'bg-blue-200 text-blue-800', icon: 'fa-sync-alt' },
        resolvida: { bg: 'from-green-400 to-green-600', badge: 'bg-green-200 text-green-800', icon: 'fa-check-circle' },
        fechada: { bg: 'from-gray-400 to-gray-600', badge: 'bg-gray-200 text-gray-800', icon: 'fa-times-circle' }
    };
    
    const categoriaLabels = {
        infraestrutura: 'Infraestrutura',
        saude: 'Saúde',
        educacao: 'Educação',
        'meio-ambiente': 'Meio Ambiente',
        seguranca: 'Segurança',
        saneamento: 'Saneamento',
        outro: 'Outro'
    };
    
    let html = '';
    
    reclamacoes.forEach(reclamacao => {
        const statusInfo = statusCores[reclamacao.status] || statusCores.aberta;
        const dataCriacao = new Date(reclamacao.createdAt).toLocaleDateString('pt-PT');
        const dataAtualizacao = new Date(reclamacao.updatedAt).toLocaleDateString('pt-PT');
        const nomeUsuario = getUsuarioNome(reclamacao.usuario_id);
        const categoriaLabel = categoriaLabels[reclamacao.categoria] || reclamacao.categoria;
        
        html += `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                <div class="px-6 py-4 bg-gradient-to-r ${statusInfo.bg} flex flex-wrap justify-between items-center gap-3">
                    <h3 class="text-lg font-bold text-white">${escapeHtml(reclamacao.titulo)}</h3>
                    <span class="px-3 py-1 ${statusInfo.badge} rounded-full text-xs font-semibold flex items-center status-badge">
                        <i class="fas ${statusInfo.icon} mr-2"></i>
                        ${reclamacao.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>
                
                <div class="p-6">
                    <p class="text-gray-600 mb-4">${escapeHtml(reclamacao.descricao.substring(0, 200))}${reclamacao.descricao.length > 200 ? '...' : ''}</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-tag text-orange-500 w-4"></i>
                            <span class="text-gray-500">Categoria:</span>
                            <span class="text-gray-800 font-medium">${categoriaLabel}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-map-marker-alt text-orange-500 w-4"></i>
                            <span class="text-gray-500">Local:</span>
                            <span class="text-gray-800 font-medium">${escapeHtml(reclamacao.local || 'Não informado')}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-user text-orange-500 w-4"></i>
                            <span class="text-gray-500">Usuário:</span>
                            <span class="text-gray-800 font-medium">${escapeHtml(nomeUsuario)}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-calendar-alt text-orange-500 w-4"></i>
                            <span class="text-gray-500">Criada:</span>
                            <span class="text-gray-800 font-medium">${dataCriacao}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-clock text-orange-500 w-4"></i>
                            <span class="text-gray-500">Atualizada:</span>
                            <span class="text-gray-800 font-medium">${dataAtualizacao}</span>
                        </div>
                        <div class="flex items-center space-x-2 text-sm">
                            <i class="fas fa-hashtag text-orange-500 w-4"></i>
                            <span class="text-gray-500">Protocolo:</span>
                            <span class="text-gray-800 font-medium">${reclamacao.protocolo || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="mt-4 pt-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
                        <div class="flex items-center space-x-3">
                            <span class="text-sm font-medium text-gray-700">Atualizar estado:</span>
                            <select id="statusSelect_${reclamacao.id}" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                                <option value="aberta" ${reclamacao.status === 'aberta' ? 'selected' : ''}>Aberta</option>
                                <option value="em_andamento" ${reclamacao.status === 'em_andamento' ? 'selected' : ''}>Em andamento</option>
                                <option value="resolvida" ${reclamacao.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
                                <option value="fechada" ${reclamacao.status === 'fechada' ? 'selected' : ''}>Fechada</option>
                            </select>
                            <button onclick="atualizarStatus(${reclamacao.id}, document.getElementById('statusSelect_${reclamacao.id}').value)" 
                                    class="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200 transition">
                                <i class="fas fa-sync-alt mr-1"></i> Atualizar
                            </button>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button onclick="verDetalhes(${reclamacao.id})" class="text-gray-400 hover:text-blue-600 transition p-2" title="Ver detalhes">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}


// Ver detalhes da reclamação
function verDetalhes(id) {
    const reclamacao = reclamacoesData.find(r => r.id === id);
    if (reclamacao) {
        const nomeUsuario = getUsuarioNome(reclamacao.usuario_id);
        alert(`DETALHES DA RECLAMAÇÃO\n\n` +
              `Protocolo: ${reclamacao.protocolo}\n` +
              `Título: ${reclamacao.titulo}\n` +
              `Descrição: ${reclamacao.descricao}\n` +
              `Categoria: ${reclamacao.categoria}\n` +
              `Local: ${reclamacao.local || 'Não informado'}\n` +
              `Usuário: ${nomeUsuario}\n` +
              `Status: ${reclamacao.status.replace('_', ' ')}\n` +
              `Data de criação: ${new Date(reclamacao.createdAt).toLocaleDateString('pt-PT')}\n` +
              `Última atualização: ${new Date(reclamacao.updatedAt).toLocaleDateString('pt-PT')}`);
    }
}

// Aplicar filtros
function aplicarFiltros() {
    const statusFiltro = document.getElementById('filtroStatus').value;
    const categoriaFiltro = document.getElementById('filtroCategoria').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filtradas = [...reclamacoesData];
    
    if (statusFiltro !== 'todos') {
        filtradas = filtradas.filter(r => r.status === statusFiltro);
    }
    
    if (categoriaFiltro !== 'todas') {
        filtradas = filtradas.filter(r => r.categoria === categoriaFiltro);
    }
    
    if (searchTerm) {
        filtradas = filtradas.filter(r => 
            r.titulo.toLowerCase().includes(searchTerm) ||
            r.descricao.toLowerCase().includes(searchTerm) ||
            (r.local && r.local.toLowerCase().includes(searchTerm)) ||
            getUsuarioNome(r.usuario_id).toLowerCase().includes(searchTerm)
        );
    }
    
    renderizarReclamacoes(filtradas);
}

// Carregar reclamação principal
async function carregarReclamacoes() {
    const container = document.getElementById('listaReclamacoes');
    container.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner spinner text-orange-600 text-4xl"></i>
            <p class="ml-3 text-gray-500">Carregando reclamações...</p>
        </div>
    `;
    
    await buscarReclamacoes();
    await buscarUsuarios();
    renderizarReclamacoes(reclamacoesData);
    
    const badgeDenuncias = document.getElementById('badgeDenuncias');
    if (badgeDenuncias) {
        try {
            const response = await fetch('http://localhost:3000/api/denuncias');
            const denuncias = await response.json();
            badgeDenuncias.innerText = Array.isArray(denuncias) ? denuncias.length : 0;
        } catch (e) {
            console.error('Erro ao buscar denúncias:', e);
        }
    }
    
    const badgeUsuarios = document.getElementById('badgeUsuarios');
    if (badgeUsuarios) {
        try {
            const response = await fetch('http://localhost:3000/api/usuarios');
            const usuarios = await response.json();
            badgeUsuarios.innerText = Array.isArray(usuarios) ? usuarios.length : 0;
        } catch (e) {
            console.error('Erro ao buscar usuários:', e);
        }
    }
}


// Logout
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
async function init() {
    const admin = verificarAdmin();
    if (!admin) return;
    
    // Event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('keyup', aplicarFiltros);
    
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros);
    
    const filtroCategoria = document.getElementById('filtroCategoria');
    if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros);
    
    await carregarReclamacoes();
}

document.addEventListener('DOMContentLoaded', init);