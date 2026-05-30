// dashboardAdmin.js - Script do Painel Administrativo

// Variáveis globais
let denunciasData = [];
let reclamacoesData = [];
let usuariosData = [];
let barChart = null;

// ============================================
// FUNÇÃO PARA VERIFICAR ADMIN
// ============================================
function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== 'admin') {
        showModal('error', 'Acesso Negado', '⛔ Apenas administradores podem acessar este painel.');
        setTimeout(() => {
            window.location.href = '../aluno/dashboard.html';
        }, 2000);
        return null;
    }
    return usuario;
}

// ============================================
// MODAL PERSONALIZADO
// ============================================
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
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            .modal-content { animation: slideIn 0.3s ease; }
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
                <p class="text-gray-600 text-base whitespace-pre-line">${message}</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button id="modalCloseBtn" class="px-6 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                    <i class="fas fa-check mr-2"></i>OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm) onConfirm();
    };
    
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let value = Number(bytes);
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    return `${value.toFixed(1).replace('.0', '')} ${units[unitIndex]}`;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getStatusColor(status) {
    switch ((status || '').toLowerCase()) {
        case 'aprovado': return 'bg-green-100 text-green-700';
        case 'rejeitado': return 'bg-red-100 text-red-700';
        case 'em_analise':
        case 'em análise': return 'bg-yellow-100 text-yellow-700';
        case 'pendente': return 'bg-orange-100 text-orange-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

function translateStatus(status) {
    switch ((status || '').toLowerCase()) {
        case 'aprovado': return 'Aprovado';
        case 'rejeitado': return 'Rejeitado';
        case 'em_analise':
        case 'em análise': return 'Em Análise';
        case 'pendente': return 'Pendente';
        default: return status || 'Não informado';
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

function showModalWithAttachments(type, title, message, detalhes = null, anexos = []) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();

    const config = {
        success: { icon: 'fa-check-circle', iconColor: 'text-green-500', bgGradient: 'from-green-500 to-green-600', buttonColor: 'bg-green-500 hover:bg-green-600' },
        error: { icon: 'fa-exclamation-circle', iconColor: 'text-red-500', bgGradient: 'from-red-500 to-red-600', buttonColor: 'bg-red-500 hover:bg-red-600' },
        info: { icon: 'fa-info-circle', iconColor: 'text-blue-500', bgGradient: 'from-blue-500 to-blue-600', buttonColor: 'bg-blue-500 hover:bg-blue-600' },
        warning: { icon: 'fa-exclamation-triangle', iconColor: 'text-yellow-500', bgGradient: 'from-yellow-500 to-yellow-600', buttonColor: 'bg-yellow-500 hover:bg-yellow-600' },
        detalhe: { icon: 'fa-file-alt', iconColor: 'text-orange-500', bgGradient: 'from-orange-500 to-orange-600', buttonColor: 'bg-orange-500 hover:bg-orange-600' }
    };

    const current = config[type] || config.info;

    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';

    if (!document.getElementById('modalStyles')) {
        const style = document.createElement('style');
        style.id = 'modalStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            .modal-content { animation: slideIn 0.3s ease; }
            .anexo-item { transition: all 0.2s ease; }
            .anexo-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        `;
        document.head.appendChild(style);
    }

    let anexosHtml = '';
    if (anexos && anexos.length > 0) {
        anexosHtml = `
            <div class="mt-4">
                <div class="flex items-center space-x-2 mb-3">
                    <i class="fas fa-paperclip text-orange-500 text-sm"></i>
                    <span class="text-xs font-semibold text-gray-700 uppercase">Anexos (${anexos.length})</span>
                </div>
                <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    ${anexos.map(anexo => {
                        const fileName = anexo.nome || 'Arquivo';
                        const fileExt = fileName.split('.').pop().toLowerCase();
                        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExt);
                        const fileUrl = criarUrlAnexo(anexo);
                        let fileIcon = 'fa-file';
                        if (isImage) fileIcon = 'fa-file-image';
                        else if (fileExt === 'pdf') fileIcon = 'fa-file-pdf';
                        else if (['doc', 'docx'].includes(fileExt)) fileIcon = 'fa-file-word';
                        else if (['xls', 'xlsx'].includes(fileExt)) fileIcon = 'fa-file-excel';
                        else if (['zip', 'rar', '7z'].includes(fileExt)) fileIcon = 'fa-file-archive';
                        return `
                            <div class="anexo-item bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-orange-300 transition cursor-pointer" onclick="window.open('${fileUrl}', '_blank')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-3">
                                        <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <i class="fas ${fileIcon} text-orange-600 text-sm"></i>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-800 truncate" title="${fileName}">${fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}</p>
                                            <p class="text-xs text-gray-500">${isImage ? 'Imagem' : 'Documento'}${anexo.tamanho ? ` • ${formatFileSize(anexo.tamanho)}` : ''}</p>
                                        </div>
                                    </div>
                                    <i class="fas fa-external-link-alt text-gray-400 text-xs"></i>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    } else {
        anexosHtml = `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <i class="fas fa-paperclip text-gray-400 text-lg mb-2 block"></i>
                <p class="text-xs text-gray-500">Nenhum anexo enviado</p>
            </div>
        `;
    }

    let detalhesHtml = '';
    if (detalhes) {
        detalhesHtml = `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="space-y-3">
                    ${detalhes.protocolo ? `<div class="flex items-center justify-between pb-2 border-b border-gray-200"><span class="text-xs text-gray-500 font-medium">PROTOCOLO</span><span class="text-sm font-mono font-bold text-gray-800">${detalhes.protocolo}</span></div>` : ''}
                    ${detalhes.titulo ? `<div><span class="text-xs text-gray-500 font-medium block mb-1">TÍTULO</span><span class="text-sm font-semibold text-gray-800">${escapeHtml(detalhes.titulo)}</span></div>` : ''}
                    ${detalhes.descricao ? `<div><span class="text-xs text-gray-500 font-medium block mb-1">DESCRIÇÃO</span><p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(detalhes.descricao)}</p></div>` : ''}
                    ${detalhes.data ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">DATA DO OCORRIDO</span><span class="text-sm text-gray-700">${detalhes.data}</span></div>` : ''}
                    ${detalhes.local ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">LOCAL</span><span class="text-sm text-gray-700">${escapeHtml(detalhes.local)}</span></div>` : ''}
                    ${detalhes.status ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">STATUS</span><span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(detalhes.status)}">${translateStatus(detalhes.status)}</span></div>` : ''}
                    ${detalhes.categoria ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">CATEGORIA</span><span class="text-sm text-gray-700">${escapeHtml(detalhes.categoria)}</span></div>` : ''}
                    ${detalhes.usuario ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">USUÁRIO</span><span class="text-sm text-gray-700">${escapeHtml(detalhes.usuario)}</span></div>` : ''}
                    ${detalhes.email ? `<div class="flex items-center justify-between"><span class="text-xs text-gray-500 font-medium">EMAIL</span><span class="text-sm text-gray-700">${escapeHtml(detalhes.email)}</span></div>` : ''}
                </div>
            </div>
        `;
    }

    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
            <div class="bg-gradient-to-r ${current.bgGradient} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${current.icon} ${current.iconColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${escapeHtml(title)}</h3>
                </div>
            </div>
            <div class="px-6 py-6 max-h-[70vh] overflow-y-auto">
                <p class="text-gray-600 text-base leading-relaxed">${escapeHtml(message)}</p>
                ${detalhesHtml}
                ${anexosHtml}
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end">
                <button id="modalCloseBtn" class="px-6 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium">
                    <i class="fas fa-check mr-2"></i>Fechar
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// TOAST DE NOTIFICAÇÃO
// ============================================
function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.style.animation = 'slideInRight 0.3s ease';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ============================================
// BUSCAR DADOS DA API
// ============================================
async function buscarDenuncias() {
    try {
        const response = await fetch('http://localhost:3000/api/denuncias');
        const data = await response.json();
        denunciasData = Array.isArray(data) ? data : (data.data || []);
        return denunciasData;
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        return [];
    }
}

async function buscarReclamacoes() {
    try {
        const response = await fetch('http://localhost:3000/api/reclamacoes');
        const data = await response.json();
        reclamacoesData = Array.isArray(data) ? data : (data.data || []);
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
        usuariosData = Array.isArray(data) ? data : (data.data || []);
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

async function buscarAnexos(denunciaId, reclamacaoId) {
    try {
        let url = '';
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

// ============================================
// RENDERIZAR CARDS DAS ESTATÍSTICAS
// ============================================
function renderizarCardsEstatisticas() {
    const totalGeral = denunciasData.length + reclamacoesData.length;
    const pendentes = denunciasData.filter(d => d.status === 'pendente').length + reclamacoesData.filter(r => r.status === 'aberta' || r.status === 'pendente').length;
    const totalUsuarios = usuariosData.length;
    const resolvidos = denunciasData.filter(d => d.status === 'concluida').length + reclamacoesData.filter(r => r.status === 'resolvida' || r.status === 'concluida').length;
    const taxaResolucao = totalGeral > 0 ? Math.round((resolvidos / totalGeral) * 100) : 0;
    
    const atividadesSemana = [...denunciasData, ...reclamacoesData].filter(item => new Date(item.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
    const usuariosMes = usuariosData.filter(u => new Date(u.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length;

    const cardsHtml = `
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Total de Registos</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${totalGeral}</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-chart-line mr-1"></i>
                        +${atividadesSemana} esta semana
                    </p>
                </div>
                <div class="bg-orange-100 p-3 rounded-lg">
                    <i class="fas fa-clipboard-list text-orange-600 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Pendentes</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${pendentes}</h3>
                    <p class="text-xs text-yellow-600 mt-2">
                        <i class="fas fa-clock mr-1"></i>
                        Aguardando análise
                    </p>
                </div>
                <div class="bg-yellow-100 p-3 rounded-lg">
                    <i class="fas fa-hourglass-half text-yellow-600 text-2xl"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Usuários Ativos</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${totalUsuarios}</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-user-plus mr-1"></i>
                        +${usuariosMes} este mês
                    </p>
                </div>
                <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-users text-green-600 text-2xl"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Taxa de Resolução</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${taxaResolucao}%</h3>
                    <p class="text-xs text-blue-600 mt-2">
                        <i class="fas fa-trend-up mr-1"></i>
                        ${resolvidos} de ${totalGeral} resolvidas
                    </p>
                </div>
                <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-check-circle text-blue-600 text-2xl"></i>
                </div>
            </div>
        </div>
    `;
    document.getElementById('cardsEstatisticas').innerHTML = cardsHtml;
    
    // Atualizar badges do sidebar
    const badgeDenuncias = document.getElementById('badgeDenuncias');
    const badgeReclamacoes = document.getElementById('badgeReclamacoes');
    const badgeUsuarios = document.getElementById('badgeUsuarios');
    
    if (badgeDenuncias) badgeDenuncias.innerText = denunciasData.length;
    if (badgeReclamacoes) badgeReclamacoes.innerText = reclamacoesData.length;
    if (badgeUsuarios) badgeUsuarios.innerText = totalUsuarios;
}

// ============================================
// RENDERIZAR GRÁFICO
// ============================================
function renderizarGrafico() {
    const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const dadosDenunciasSemana = [0, 0, 0, 0];
    const dadosReclamacoesSemana = [0, 0, 0, 0];
    
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    
    denunciasData.forEach(denuncia => {
        const data = new Date(denuncia.createdAt);
        if (data >= inicioMes) {
            const diffDias = Math.floor((data - inicioMes) / (1000 * 60 * 60 * 24));
            const semana = Math.min(Math.floor(diffDias / 7), 3);
            dadosDenunciasSemana[semana]++;
        }
    });
    
    reclamacoesData.forEach(reclamacao => {
        const data = new Date(reclamacao.createdAt);
        if (data >= inicioMes) {
            const diffDias = Math.floor((data - inicioMes) / (1000 * 60 * 60 * 24));
            const semana = Math.min(Math.floor(diffDias / 7), 3);
            dadosReclamacoesSemana[semana]++;
        }
    });

    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();
    
    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: semanas,
            datasets: [
                {
                    label: 'Denúncias',
                    data: dadosDenunciasSemana,
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Reclamações',
                    data: dadosReclamacoesSemana,
                    backgroundColor: 'rgba(234, 179, 8, 0.7)',
                    borderColor: 'rgba(234, 179, 8, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, boxWidth: 10 }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#f97316',
                    bodyColor: '#fff',
                    cornerRadius: 8
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// ============================================
// RENDERIZAR ATIVIDADES RECENTES
// ============================================
function renderizarAtividades() {
    const todasAtividades = [
        ...denunciasData.map(d => ({ ...d, tipo_item: 'denuncia' })),
        ...reclamacoesData.map(r => ({ ...r, tipo_item: 'reclamacao' }))
    ];
    
    todasAtividades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const atividadesRecentes = todasAtividades.slice(0, 5);
    
    const totalAtividades = document.getElementById('totalAtividades');
    if (totalAtividades) totalAtividades.innerText = todasAtividades.length;
    
    const icones = {
        pendente: 'fa-clock text-yellow-600 bg-yellow-100',
        em_andamento: 'fa-sync-alt text-blue-600 bg-blue-100',
        concluida: 'fa-check text-green-600 bg-green-100',
        arquivada: 'fa-archive text-gray-600 bg-gray-100',
        aberta: 'fa-envelope-open text-yellow-600 bg-yellow-100',
        resolvida: 'fa-check-circle text-green-600 bg-green-100',
        fechada: 'fa-times-circle text-gray-600 bg-gray-100'
    };
    
    let atividadesHtml = '';
    atividadesRecentes.forEach(item => {
        const icone = icones[item.status] || icones.pendente;
        const tipoIcone = item.tipo_item === 'denuncia' ? 'fa-exclamation-triangle' : 'fa-flag';
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT');
        
        atividadesHtml += `
            <div class="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition" onclick="verDetalhes(${item.id}, '${item.tipo_item}')">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${icone.split(' ').slice(2).join(' ')}">
                    <i class="fas ${tipoIcone} ${icone.split(' ')[0]} text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">${item.titulo.substring(0, 40)}${item.titulo.length > 40 ? '...' : ''}</p>
                    <p class="text-xs text-gray-500">${dataFormatada} • ${item.status.replace('_', ' ')}</p>
                </div>
            </div>
        `;
    });
    
    if (atividadesRecentes.length === 0) {
        atividadesHtml = '<p class="text-center text-gray-500 py-4">Nenhuma atividade recente</p>';
    }
    
    const listaAtividades = document.getElementById('listaAtividades');
    if (listaAtividades) listaAtividades.innerHTML = atividadesHtml;
}

// ============================================
// RENDERIZAR TABELA DE GESTÃO (SEM ÍCONE DE FOLHA)
// ORDEM: Título, Tipo, Categoria, Data, Status, Ações
// ============================================
async function carregarTabelaGeral() {
    await buscarDenuncias();
    await buscarReclamacoes();
    
    const statusCores = {
        pendente: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        em_andamento: 'bg-blue-50 text-blue-700 border-blue-300',
        concluida: 'bg-green-50 text-green-700 border-green-300',
        arquivada: 'bg-gray-50 text-gray-700 border-gray-300',
        aberta: 'bg-yellow-50 text-yellow-700 border-yellow-300',
        resolvida: 'bg-green-50 text-green-700 border-green-300',
        fechada: 'bg-gray-50 text-gray-700 border-gray-300'
    };
    
    // Combinar denúncias e reclamações
    const todosItens = [
        ...denunciasData.map(d => ({ 
            ...d, 
            tipo_item: 'denuncia',
            tipo_texto: 'Denúncia',
            categoria_exibicao: d.tipo || 'Não informada',
            icone: 'fa-exclamation-triangle text-orange-500',
            bgIcon: 'bg-orange-100'
        })),
        ...reclamacoesData.map(r => ({ 
            ...r, 
            tipo_item: 'reclamacao',
            tipo_texto: 'Reclamação',
            categoria_exibicao: r.categoria || 'Não informada',
            icone: 'fa-flag text-yellow-500',
            bgIcon: 'bg-yellow-100'
        }))
    ];
    
    // Ordenar por data (mais recentes primeiro)
    todosItens.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let tabelaHtml = '';
    
    if (todosItens.length === 0) {
        tabelaHtml = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3 block text-gray-300"></i>
                    Nenhuma denúncia ou reclamação encontrada
                </td>
            </tr>
        `;
    } else {
        todosItens.forEach(item => {
            const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const cor = statusCores[item.status] || statusCores.pendente;
            
            let statusExibicao = '';
            if (item.tipo_item === 'denuncia') {
                const statusMap = {
                    pendente: 'Pendente',
                    em_andamento: 'Em Andamento',
                    concluida: 'Concluída',
                    arquivada: 'Arquivada'
                };
                statusExibicao = statusMap[item.status] || item.status;
            } else {
                const statusMap = {
                    aberta: 'Aberta',
                    em_andamento: 'Em Andamento',
                    resolvida: 'Resolvida',
                    fechada: 'Fechada'
                };
                statusExibicao = statusMap[item.status] || item.status;
            }
            
            tabelaHtml += `
                <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="verDetalhes(${item.id}, '${item.tipo_item}')">
                    <!-- Título -->
                    <td class="px-6 py-4">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 ${item.bgIcon} rounded-full flex items-center justify-center">
                                <i class="fas ${item.icone} text-sm"></i>
                            </div>
                            <span class="text-sm font-medium text-gray-900 max-w-xs truncate" title="${item.titulo.replace(/"/g, '&quot;')}">
                                ${item.titulo.length > 50 ? item.titulo.substring(0, 50) + '...' : item.titulo}
                            </span>
                        </div>
                    </td>
                    <!-- Tipo -->
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-semibold ${item.tipo_item === 'denuncia' ? 'text-orange-600' : 'text-yellow-600'}">
                            ${item.tipo_texto}
                        </span>
                    </td>
                    <!-- Categoria -->
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">${item.categoria_exibicao}</span>
                    </td>
                    <!-- Data -->
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-500">${dataFormatada}</span>
                    </td>
                    <!-- Status -->
                    <td class="px-6 py-4 whitespace-nowrap">
                        <select onchange="atualizarStatus(${item.id}, '${item.tipo_item === 'denuncia' ? 'denuncias' : 'reclamacoes'}', this.value, event)" 
                                class="text-xs border rounded-lg px-2 py-1 ${cor} focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                onclick="event.stopPropagation()">
                            ${item.tipo_item === 'denuncia' ? `
                                <option value="pendente" ${item.status === 'pendente' ? 'selected' : ''}>📋 Pendente</option>
                                <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>⚙️ Em Andamento</option>
                                <option value="concluida" ${item.status === 'concluida' ? 'selected' : ''}>✅ Concluída</option>
                                <option value="arquivada" ${item.status === 'arquivada' ? 'selected' : ''}>📦 Arquivada</option>
                            ` : `
                                <option value="aberta" ${item.status === 'aberta' ? 'selected' : ''}>📋 Aberta</option>
                                <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>⚙️ Em Andamento</option>
                                <option value="resolvida" ${item.status === 'resolvida' ? 'selected' : ''}>✅ Resolvida</option>
                                <option value="fechada" ${item.status === 'fechada' ? 'selected' : ''}>🔒 Fechada</option>
                            `}
                        </select>
                    </td>
                    <!-- Ações - Apenas ícone de olho -->
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="verDetalhes(${item.id}, '${item.tipo_item}')" 
                                class="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-lg" 
                                title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </table>
            `;
        });
    }
    
    const tabelaGestao = document.getElementById('tabelaGestao');
    if (tabelaGestao) tabelaGestao.innerHTML = tabelaHtml;
}

// ============================================
// VER DETALHES (Resumo)
// ============================================
async function verDetalhes(id, tipo) {
    const item = tipo === 'denuncia' 
        ? denunciasData.find(d => d.id === id)
        : reclamacoesData.find(r => r.id === id);
    
    if (!item) {
        showToast('error', 'Item não encontrado');
        return;
    }

    try {
        const anexos = await buscarAnexos(tipo === 'denuncia' ? id : null, tipo === 'reclamacao' ? id : null);
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const detalhes = {
            protocolo: item.protocolo || 'N/A',
            titulo: item.titulo,
            descricao: item.descricao,
            data: dataFormatada,
            local: item.local || 'Não informado',
            status: item.status,
            categoria: tipo === 'denuncia' ? (item.tipo || 'Não informada') : (item.categoria || 'Não informada'),
            usuario: item.usuario_id ? `ID ${item.usuario_id}` : 'N/A',
            email: 'N/A'
        };

        const tipoTexto = tipo === 'denuncia' ? 'Denúncia' : 'Reclamação';
        showModalWithAttachments('detalhe', `Detalhes da ${tipoTexto}`, `Visualizando detalhes da ${tipoTexto.toLowerCase()}`, detalhes, anexos);
    } catch (error) {
        console.error('Erro ao carregar anexos:', error);
        showToast('error', 'Erro ao carregar os anexos');
    }
}

// ============================================
// ATUALIZAR STATUS
// ============================================
async function atualizarStatus(id, tipo, status, evento) {
    if (evento) evento.stopPropagation();
    
    try {
        const url = `http://localhost:3000/api/${tipo}/${id}/status`;
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        
        if (response.ok) {
            showToast('success', `Status atualizado com sucesso!`);
            await carregarTabelaGeral();
            await renderizarCardsEstatisticas();
            await renderizarAtividades();
            await renderizarNotificacoes();
        } else {
            showToast('error', 'Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', 'Erro ao conectar ao servidor');
    }
}

// ============================================
// RENDERIZAR CARDS DE FUNCIONALIDADES (APENAS 3 CARDS)
// ============================================
function renderizarCardsFuncionalidades() {
    const totalDenuncias = denunciasData.length;
    const totalReclamacoes = reclamacoesData.length;
    
    const cardsHtml = `
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-indigo-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-indigo-100 p-3 rounded-lg">
                    <i class="fas fa-users text-indigo-600 text-xl"></i>
                </div>
                <span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">+${usuariosData.filter(u => new Date(u.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length} novo</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Gestão de Usuários</h3>
            <p class="text-sm text-gray-500 mb-4">${usuariosData.length} usuários registrados</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">Administradores: ${usuariosData.filter(u => u.tipo === 'admin').length}</span>
                <a href="usuarios.html" class="text-indigo-600 text-sm font-medium hover:text-indigo-800">
                    Gerenciar <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-purple-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-purple-100 p-3 rounded-lg">
                    <i class="fas fa-cog text-purple-600 text-xl"></i>
                </div>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Configurações do Sistema</h3>
            <p class="text-sm text-gray-500 mb-4">Parâmetros gerais, categorias e permissões</p>
            <div class="flex justify-end">
                <a href="#" class="text-purple-600 text-sm font-medium hover:text-purple-800">
                    Configurar <i class="fas fa-arrow-right ml-1"></i>
                </a>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-green-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-chart-pie text-green-600 text-xl"></i>
                </div>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Visão Geral</h3>
            <p class="text-sm text-gray-500 mb-4">Denúncias: ${totalDenuncias} | Reclamações: ${totalReclamacoes}</p>
            <div class="flex justify-end">
                <button onclick="document.getElementById('barChart').scrollIntoView({behavior: 'smooth'})" class="text-green-600 text-sm font-medium hover:text-green-800">
                    Ver Gráficos <i class="fas fa-chart-line ml-1"></i>
                </button>
            </div>
        </div>
    `;
    
    const cardsFuncionalidades = document.getElementById('cardsFuncionalidades');
    if (cardsFuncionalidades) cardsFuncionalidades.innerHTML = cardsHtml;
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function renderizarNotificacoes() {
    const pendentesDenuncias = denunciasData.filter(d => d.status === 'pendente');
    const pendentesReclamacoes = reclamacoesData.filter(r => r.status === 'aberta');
    const totalPendentes = pendentesDenuncias.length + pendentesReclamacoes.length;
    
    const contador = document.getElementById('contadorNotificacoes');
    if (contador) {
        if (totalPendentes > 0) {
            contador.innerText = totalPendentes > 9 ? '9+' : totalPendentes;
            contador.classList.remove('hidden');
        } else {
            contador.classList.add('hidden');
        }
    }
    
    let notificacoesHtml = '';
    
    pendentesDenuncias.slice(0, 5).forEach(d => {
        notificacoesHtml += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onclick="verDetalhes(${d.id}, 'denuncia')">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-red-600 text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-800">Nova Denúncia</p>
                        <p class="text-xs text-gray-500">${d.titulo.substring(0, 40)}${d.titulo.length > 40 ? '...' : ''}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date(d.createdAt).toLocaleDateString('pt-PT')}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    pendentesReclamacoes.slice(0, 5).forEach(r => {
        notificacoesHtml += `
            <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onclick="verDetalhes(${r.id}, 'reclamacao')">
                <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-flag text-yellow-600 text-sm"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-800">Nova Reclamação</p>
                        <p class="text-xs text-gray-500">${r.titulo.substring(0, 40)}${r.titulo.length > 40 ? '...' : ''}</p>
                        <p class="text-xs text-gray-400 mt-1">${new Date(r.createdAt).toLocaleDateString('pt-PT')}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    if (notificacoesHtml === '') {
        notificacoesHtml = '<div class="p-4 text-center text-gray-500">Nenhuma notificação</div>';
    }
    
    const listaNotificacoes = document.getElementById('listaNotificacoes');
    if (listaNotificacoes) listaNotificacoes.innerHTML = notificacoesHtml;
}

// ============================================
// SETUP DO DROPDOWN DE NOTIFICAÇÕES
// ============================================
function setupNotificacaoDropdown() {
    const btn = document.getElementById('notificacaoBtn');
    const dropdown = document.getElementById('notificacaoDropdown');
    
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown) dropdown.classList.toggle('hidden');
            renderizarNotificacoes();
        });
    }
    
    document.addEventListener('click', () => {
        if (dropdown) dropdown.classList.add('hidden');
    });
}

// ============================================
// LOGOUT COM MODAL
// ============================================
function logout() {
    const existingModal = document.getElementById('logoutConfirmModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
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
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-sign-out-alt text-orange-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">Sair do Sistema</h3>
                </div>
            </div>
            <div class="px-6 py-6 text-center">
                <i class="fas fa-question-circle text-orange-500 text-5xl mb-4"></i>
                <p class="text-gray-700 text-base mb-2">Tem certeza que deseja sair?</p>
                <p class="text-gray-500 text-sm">Você será redirecionado para a página de login.</p>
            </div>
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
    
    document.getElementById('logoutConfirmBtn')?.addEventListener('click', () => {
        closeModal();
        const toast = document.createElement('div');
        toast.className = 'fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 bg-green-500 text-white toast-slide-in';
        toast.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Sessão encerrada com sucesso!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1500);
        setTimeout(() => {
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('token');
            window.location.href = '../login.html';
        }, 500);
    });
    
    document.getElementById('logoutCancelBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// ATUALIZAR CONTADORES PERIODICAMENTE
// ============================================
let intervaloAtualizacao = null;

function iniciarAtualizacaoPeriodica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    
    intervaloAtualizacao = setInterval(async () => {
        await buscarDenuncias();
        await buscarReclamacoes();
        await buscarUsuarios();
        renderizarCardsEstatisticas();
        renderizarGrafico();
        renderizarAtividades();
        await carregarTabelaGeral();
        renderizarCardsFuncionalidades();
        renderizarNotificacoes();
        console.log('🔄 Dashboard atualizado automaticamente');
    }, 30000);
}

// ============================================
// INICIALIZAÇÃO PRINCIPAL
// ============================================
async function init() {
    const admin = verificarAdmin();
    if (!admin) return;
    
    const adminNomeElement = document.getElementById('adminNome');
    if (adminNomeElement) adminNomeElement.innerText = admin.nome;
    
    await Promise.all([
        buscarDenuncias(),
        buscarReclamacoes(),
        buscarUsuarios()
    ]);
    
    renderizarCardsEstatisticas();
    renderizarGrafico();
    renderizarAtividades();
    await carregarTabelaGeral();
    renderizarCardsFuncionalidades();
    renderizarNotificacoes();
    setupNotificacaoDropdown();
    iniciarAtualizacaoPeriodica();
    
    console.log('✅ Dashboard do Administrador inicializado com sucesso!');
}

// Iniciar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);