// dashboard.js - Script do Dashboard do Usuário

let denunciasData = [];
let reclamacoesData = [];
let usuariosData = [];
let barChart = null;
let pieChart = null;

function formatFileSize(bytes) {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getStatusColor(status) {
    const cores = {
        'pendente': 'bg-yellow-100 text-yellow-800',
        'em_andamento': 'bg-blue-100 text-blue-800',
        'concluida': 'bg-green-100 text-green-800',
        'arquivada': 'bg-gray-100 text-gray-800',
        'aberta': 'bg-yellow-100 text-yellow-800',
        'resolvida': 'bg-green-100 text-green-800',
        'fechada': 'bg-gray-100 text-gray-800'
    };
    return cores[status] || 'bg-gray-100 text-gray-800';
}

function translateStatus(status) {
    const traducoes = {
        'pendente': 'Pendente',
        'em_andamento': 'Em Andamento',
        'concluida': 'Concluída',
        'arquivada': 'Arquivada',
        'aberta': 'Aberta',
        'resolvida': 'Resolvida',
        'fechada': 'Fechada'
    };
    return traducoes[status] || status;
}

// Função para debug - mostrar dados do usuário no console
function debugUsuarioLogado() {
    const usuarioStr = sessionStorage.getItem('usuarioLogado');
    if (usuarioStr) {
        try {
            const usuario = JSON.parse(usuarioStr);
            console.log(' Dados do usuário logado:');
            console.log('  - ID:', usuario.id);
            console.log('  - Nome:', usuario.nome);
            console.log('  - Email:', usuario.email);
            console.log('  - Processo:', usuario.numero_processo);
            console.log('  - Tipo:', usuario.tipo);
            console.log('  - Data login:', usuario.data_login);
            return usuario;
        } catch(e) {
            console.error('Erro ao parsear usuário:', e);
        }
    } else {
        console.warn(' Nenhum usuário encontrado no sessionStorage');
    }
    return null;
}

async function buscarAnexos(denunciaId, reclamacaoId) {
    try {
        let url = '';
        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
        const usuarioIdQuery = usuarioLogado?.id ? `?usuario_id=${usuarioLogado.id}` : '';
        if (denunciaId) {
            url = `http://localhost:3000/api/anexos/denuncia/${denunciaId}${usuarioIdQuery}`;
        } else if (reclamacaoId) {
            url = `http://localhost:3000/api/anexos/reclamacao/${reclamacaoId}${usuarioIdQuery}`;
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

function showModalWithAttachments(type, title, message, detalhes = null, anexos = []) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const config = {
        success: { icon: 'fa-check-circle', iconColor: 'text-green-500', bgGradient: 'from-green-500 to-green-600', buttonColor: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', iconColor: 'text-red-500', bgGradient: 'from-red-500 to-red-600', buttonColor: 'bg-red-500' },
        info: { icon: 'fa-info-circle', iconColor: 'text-blue-500', bgGradient: 'from-blue-500 to-blue-600', buttonColor: 'bg-blue-500' },
        warning: { icon: 'fa-exclamation-triangle', iconColor: 'text-yellow-500', bgGradient: 'from-yellow-500 to-yellow-600', buttonColor: 'bg-yellow-500' },
        detalhe: { icon: 'fa-file-alt', iconColor: 'text-orange-500', bgGradient: 'from-orange-500 to-orange-600', buttonColor: 'bg-orange-500' }
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
            @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .modal-content { animation: slideIn 0.3s ease; }
            .toast-slide-in { animation: slideInRight 0.3s ease; }
            .anexo-item { transition: all 0.2s ease; }
            .anexo-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        `;
        document.head.appendChild(style);
    }
    
    const anexosHtml = '';  // Ocultar anexos do modal de detalhes de denúncia/reclamação.
    
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
                <button id="modalCloseBtn" class="px-6 py-2 ${current.buttonColor} text-white rounded-lg transition transform hover:scale-105 font-medium shadow-md hover:shadow-lg">
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

function showToast(type, message) {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
    toast.style.animation = 'slideInRight 0.3s ease';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    
    if (!document.getElementById('toastStyles')) {
        const style = document.createElement('style');
        style.id = 'toastStyles';
        style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }
    
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

function verificarUsuario() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    
    if (!usuarioLogado) {
        console.warn(' Usuário não encontrado no sessionStorage');
        window.location.href = '../login.html';
        return null;
    }
    
    try {
        const usuario = JSON.parse(usuarioLogado);
        console.log(' Usuário carregado:', usuario);
        
        if (usuario.tipo === 'admin') {
            window.location.href = '../admin/dashboardAdmin.html';
            return null;
        }
        
        return usuario;
    } catch (error) {
        console.error(' Erro ao parsear usuário:', error);
        window.location.href = '../login.html';
        return null;
    }
}

function obterIniciaisNomeCompleto(nome) {
    if (!nome) return 'US';
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'US';
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function aplicarFotoPerfil(usuario) {
    const fotoPerfil = usuario.foto_perfil || usuario.fotoPerfil || '';
    const initials = obterIniciaisNomeCompleto(usuario.nome);
    const avatarIds = ['usuarioAvatar', 'avatarMobile'];

    avatarIds.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;

        if (fotoPerfil) {
            element.style.backgroundImage = `url('${fotoPerfil}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundColor = '';
            element.textContent = '';
        } else {
            element.style.backgroundImage = '';
            element.style.backgroundColor = '';
            element.textContent = initials;
        }
    });
}

// Função para obter saudação personalizada
function obterSaudacaoPersonalizada(nome) {
    const hora = new Date().getHours();
    const primeiroNome = nome ? nome.split(' ')[0] : 'Usuário';
    
    if (hora < 12) {
        return `Bom dia, ${primeiroNome}! `;
    } else if (hora < 18) {
        return `Boa tarde, ${primeiroNome}! `;
    } else {
        return `Boa noite, ${primeiroNome}! `;
    }
}

async function buscarDenuncias() {
    try {
        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
        if (!usuarioLogado.id) return [];
        const response = await fetch(`http://localhost:3000/api/denuncias?usuario_id=${usuarioLogado.id}`);
        const data = await response.json();
        denunciasData = Array.isArray(data) ? data : (data.data || []);
        return denunciasData;
    } catch (error) { console.error('Erro ao buscar denúncias:', error); return []; }
}

async function buscarReclamacoes() {
    try {
        const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
        if (!usuarioLogado.id) return [];
        const response = await fetch(`http://localhost:3000/api/reclamacoes?usuario_id=${usuarioLogado.id}`);
        const data = await response.json();
        reclamacoesData = Array.isArray(data) ? data : (data.data || []);
        return reclamacoesData;
    } catch (error) { console.error('Erro ao buscar reclamações:', error); return []; }
}

async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = data.success ? data.data : (Array.isArray(data) ? data : []);
        return usuariosData;
    } catch (error) { console.error('Erro ao buscar usuários:', error); return []; }
}

async function verDetalhes(id, tipo) {
    try {
        let item = tipo === 'denuncia' ? denunciasData.find(d => d.id === id) : reclamacoesData.find(r => r.id === id);
        
        if (!item) { showToast('error', 'Item não encontrado'); return; }
        
        let usuarioInfo = null;
        if (item.usuario_id) {
            const usuario = usuariosData.find(u => u.id === item.usuario_id);
            if (usuario) { usuarioInfo = { nome: usuario.nome, email: usuario.email, processo: usuario.numero_processo }; }
        }
        
        const dataFormatada = new Date(item.data_ocorrencia || item.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const detalhes = {
            protocolo: item.protocolo || 'N/A',
            titulo: item.titulo,
            descricao: item.descricao,
            data: dataFormatada,
            local: item.local || 'Não informado',
            status: item.status,
            categoria: tipo === 'denuncia' ? (item.tipo || 'Não informada') : (item.categoria || 'Não informada'),
            usuario: usuarioInfo ? usuarioInfo.nome : 'N/A',
            email: usuarioInfo ? usuarioInfo.email : 'N/A'
        };
        
        const tipoTexto = tipo === 'denuncia' ? 'Denúncia' : 'Reclamação';
        showModalWithAttachments('detalhe', `${tipoTexto} - ${item.titulo.substring(0, 50)}`, `Visualizando detalhes da ${tipoTexto.toLowerCase()}`, detalhes, []);
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showToast('error', 'Não foi possível carregar os detalhes');
    }
}

function renderizarCardsEstatisticas() {
    const totalAtividades = denunciasData.length + reclamacoesData.length;
    const pendentes = denunciasData.filter(d => d.status === 'pendente').length + reclamacoesData.filter(r => r.status === 'aberta' || r.status === 'pendente').length;
    const emAndamento = denunciasData.filter(d => d.status === 'em_andamento').length + reclamacoesData.filter(r => r.status === 'em_andamento').length;
    const concluidas = denunciasData.filter(d => d.status === 'concluida').length + reclamacoesData.filter(r => r.status === 'resolvida' || r.status === 'concluida').length;
    const atividadesMes = [...denunciasData, ...reclamacoesData].filter(item => new Date(item.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length;

    const totalDenunciasEl = document.getElementById('totalDenuncias');
    const totalPendentesEl = document.getElementById('totalPendentes');
    const totalProcessamentoEl = document.getElementById('totalProcessamento');
    const totalConcluidasEl = document.getElementById('totalConcluidas');
    const totalVariacaoEl = document.getElementById('totalVariacao');
    const tabTotalEl = document.getElementById('tabTotal');
    const tabPendentesEl = document.getElementById('tabPendentes');
    const tabAndamentoEl = document.getElementById('tabAndamento');
    const tabResolvidasEl = document.getElementById('tabResolvidas');
    const statsRegistradasEl = document.getElementById('statsRegistradas');
    const statsAguardandoEl = document.getElementById('statsAguardando');
    const statsProcessandoEl = document.getElementById('statsProcessando');
    const statsConcluidasEl = document.getElementById('statsConcluidas');

    if (totalDenunciasEl) totalDenunciasEl.innerText = totalAtividades;
    if (totalPendentesEl) totalPendentesEl.innerText = pendentes;
    if (totalProcessamentoEl) totalProcessamentoEl.innerText = emAndamento;
    if (totalConcluidasEl) totalConcluidasEl.innerText = concluidas;
    if (totalVariacaoEl) totalVariacaoEl.innerText = `${atividadesMes > 0 ? '+' + atividadesMes : '0'} este mês`;
    if (tabTotalEl) tabTotalEl.innerText = totalAtividades;
    if (tabPendentesEl) tabPendentesEl.innerText = pendentes;
    if (tabAndamentoEl) tabAndamentoEl.innerText = emAndamento;
    if (tabResolvidasEl) tabResolvidasEl.innerText = concluidas;
    if (statsRegistradasEl) statsRegistradasEl.innerText = totalAtividades;
    if (statsAguardandoEl) statsAguardandoEl.innerText = pendentes;
    if (statsProcessandoEl) statsProcessandoEl.innerText = emAndamento;
    if (statsConcluidasEl) statsConcluidasEl.innerText = concluidas;

    const badgeDenuncias = document.getElementById('denunciasCount');
    const badgeReclamacoes = document.getElementById('reclamacoesCount');
    if (badgeDenuncias) badgeDenuncias.innerText = denunciasData.length;
    if (badgeReclamacoes) badgeReclamacoes.innerText = reclamacoesData.length;
}

function renderizarGrafico() {
    const dias = [];
    for (let i = 29; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        dias.push(data.toISOString().split('T')[0]);
    }
    
    const dadosDenuncias = new Array(30).fill(0);
    const dadosReclamacoes = new Array(30).fill(0);
    
    denunciasData.forEach(denuncia => {
        const dataDenuncia = new Date(denuncia.createdAt).toISOString().split('T')[0];
        const index = dias.indexOf(dataDenuncia);
        if (index !== -1) dadosDenuncias[index]++;
    });
    
    reclamacoesData.forEach(reclamacao => {
        const dataReclamacao = new Date(reclamacao.createdAt).toISOString().split('T')[0];
        const index = dias.indexOf(dataReclamacao);
        if (index !== -1) dadosReclamacoes[index]++;
    });
    
    const labels = dias.map(d => {
        const data = new Date(d);
        return `${data.getDate()}/${data.getMonth() + 1}`;
    });
    
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();
    
    barChart = new Chart(ctx, { 
        type: 'bar', 
        data: { 
            labels: labels, 
            datasets: [
                { label: 'Denúncias', data: dadosDenuncias, backgroundColor: 'rgba(249, 115, 22, 0.7)', borderColor: 'rgba(249, 115, 22, 1)', borderWidth: 1, borderRadius: 6 },
                { label: 'Reclamações', data: dadosReclamacoes, backgroundColor: 'rgba(234, 179, 8, 0.7)', borderColor: 'rgba(234, 179, 8, 1)', borderWidth: 1, borderRadius: 6 }
            ] 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } }, 
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#f97316', bodyColor: '#fff', cornerRadius: 8 } 
            }, 
            scales: { 
                y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } }, 
                x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } } 
            } 
        } 
    });
}

function renderizarGraficoPizza() {
    const statusMap = new Map();
    [...denunciasData, ...reclamacoesData].forEach(item => {
        const status = item.status || 'Não informado';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const labels = Array.from(statusMap.keys());
    const values = Array.from(statusMap.values());
    const colors = ['#f97316', '#facc15', '#3b82f6', '#22c55e', '#6b7280', '#8b5cf6'];

    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', cornerRadius: 6 }
            }
        }
    });

    const legendContainer = document.getElementById('pieLegend');
    if (!legendContainer) return;

    legendContainer.innerHTML = labels.map((label, index) => {
        const count = values[index] || 0;
        return `
            <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100 shadow-sm">
                <span class="w-3 h-3 rounded-full" style="background:${colors[index]};"></span>
                <span class="text-xs text-gray-600 font-semibold">${translateStatus(label)}: ${count}</span>
            </div>
        `;
    }).join('');
}

function renderizarAtividades() {
    const todasAtividades = [...denunciasData.map(d => ({ ...d, tipo_item: 'denuncia', tipo_texto: 'Denúncia', categoria_exibicao: d.tipo || 'Não informada', icone: 'fa-exclamation-triangle', bgIcon: 'bg-orange-100 text-orange-600' })), ...reclamacoesData.map(r => ({ ...r, tipo_item: 'reclamacao', tipo_texto: 'Reclamação', categoria_exibicao: r.categoria || 'Não informada', icone: 'fa-flag', bgIcon: 'bg-yellow-100 text-yellow-600' }))];
    todasAtividades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const atividadesRecentes = todasAtividades.slice(0, 5);

    const statusClasses = {
        pendente: 'bg-yellow-100 text-yellow-700',
        em_andamento: 'bg-blue-100 text-blue-700',
        concluida: 'bg-green-100 text-green-700',
        arquivada: 'bg-gray-100 text-gray-700',
        aberta: 'bg-yellow-100 text-yellow-700',
        resolvida: 'bg-green-100 text-green-700',
        fechada: 'bg-gray-100 text-gray-700'
    };

    let atividadesHtml = '';
    if (atividadesRecentes.length === 0) {
        atividadesHtml = `
            <tr>
                <td colspan="5" class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-2xl mb-3 block text-gray-300"></i>
                    Nenhuma atividade recente
                </td>
            </tr>
        `;
    } else {
        atividadesRecentes.forEach(item => {
            const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT');
            atividadesHtml += `
                <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="verDetalhes(${item.id}, '${item.tipo_item}')">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center justify-center w-9 h-9 rounded-full ${item.bgIcon}">
                                <i class="fas ${item.icone} text-sm"></i>
                            </span>
                            <span class="text-sm text-gray-700 font-medium">${item.tipo_texto}</span>
                        </div>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">${escapeHtml(item.titulo)}</td>
                    <td class="px-6 py-4 text-sm text-gray-500">${dataFormatada}</td>
                    <td class="px-6 py-4">
                        <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusClasses[item.status] || 'bg-gray-100 text-gray-700'}">
                            ${translateStatus(item.status)}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-right">
                        <button type="button" onclick="event.stopPropagation(); verDetalhes(${item.id}, '${item.tipo_item}')" class="text-orange-600 hover:text-orange-800 text-sm font-semibold">
                            Ver
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    const tabelaAtividades = document.getElementById('tabelaAtividades');
    if (tabelaAtividades) tabelaAtividades.innerHTML = atividadesHtml;
}

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
    
    const todosItens = [
        ...denunciasData.map(d => ({ ...d, tipo_item: 'denuncia', tipo_texto: 'Denúncia', categoria_exibicao: d.tipo || 'Não informada', icone: 'fa-exclamation-triangle text-orange-500', bgIcon: 'bg-orange-100' })),
        ...reclamacoesData.map(r => ({ ...r, tipo_item: 'reclamacao', tipo_texto: 'Reclamação', categoria_exibicao: r.categoria || 'Não informada', icone: 'fa-flag text-yellow-500', bgIcon: 'bg-yellow-100' }))
    ];
    todosItens.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let tabelaHtml = '';
    if (todosItens.length === 0) {
        tabelaHtml = `<tr><td colspan="6" class="text-center py-8 text-gray-500"><i class="fas fa-inbox text-4xl mb-3 block text-gray-300"></i>Nenhuma denúncia ou reclamação encontrada</td></tr>`;
    } else {
        todosItens.forEach(item => {
            const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const cor = statusCores[item.status] || statusCores.pendente;
            
            let opcoesStatus = '';
            if (item.tipo_item === 'denuncia') {
                opcoesStatus = `
                    <option value="pendente" ${item.status === 'pendente' ? 'selected' : ''}>📋 Pendente</option>
                    <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>⚙️ Em Andamento</option>
                    <option value="concluida" ${item.status === 'concluida' ? 'selected' : ''}>✅ Concluída</option>
                    <option value="arquivada" ${item.status === 'arquivada' ? 'selected' : ''}>📦 Arquivada</option>
                `;
            } else {
                opcoesStatus = `
                    <option value="aberta" ${item.status === 'aberta' ? 'selected' : ''}>📋 Aberta</option>
                    <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>⚙️ Em Andamento</option>
                    <option value="resolvida" ${item.status === 'resolvida' ? 'selected' : ''}>✅ Resolvida</option>
                    <option value="fechada" ${item.status === 'fechada' ? 'selected' : ''}>🔒 Fechada</option>
                `;
            }
            
            tabelaHtml += `
                <tr class="hover:bg-gray-50 transition">
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
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm font-semibold ${item.tipo_item === 'denuncia' ? 'text-orange-600' : 'text-yellow-600'}">${item.tipo_texto}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-600">${item.categoria_exibicao}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-sm text-gray-500">${dataFormatada}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <select onchange="atualizarStatus(${item.id}, '${item.tipo_item === 'denuncia' ? 'denuncias' : 'reclamacoes'}', this.value, event)" 
                                class="text-xs border rounded-lg px-2 py-1 ${cor} focus:outline-none focus:ring-2 focus:ring-orange-500" 
                                onclick="event.stopPropagation()">
                            ${opcoesStatus}
                        </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="verDetalhes(${item.id}, '${item.tipo_item}')" 
                                class="text-blue-600 hover:text-blue-800 transition p-2 hover:bg-blue-50 rounded-lg" 
                                title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    const tabelaGestao = document.getElementById('tabelaGestao');
    if (tabelaGestao) tabelaGestao.innerHTML = tabelaHtml;
}

async function atualizarStatus(id, tipo, status, evento) {
    if (evento) evento.stopPropagation();
    try {
        const url = `http://localhost:3000/api/${tipo}/${id}/status`;
        const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: status }) });
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

function renderizarCardsFuncionalidades() {
    const totalDenuncias = denunciasData.length;
    const totalReclamacoes = reclamacoesData.length;
    const cardsHtml = `
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-indigo-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-indigo-100 p-3 rounded-lg"><i class="fas fa-users text-indigo-600 text-xl"></i></div>
                <span class="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">+${usuariosData.filter(u => new Date(u.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length} novo</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Gestão de Usuários</h3>
            <p class="text-sm text-gray-500 mb-4">${usuariosData.length} usuários registrados</p>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-400">Administradores: ${usuariosData.filter(u => u.tipo === 'admin').length}</span>
                <a href="usuarios.html" class="text-indigo-600 text-sm font-medium hover:text-indigo-800">Gerenciar <i class="fas fa-arrow-right ml-1"></i></a>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-purple-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-purple-100 p-3 rounded-lg"><i class="fas fa-cog text-purple-600 text-xl"></i></div>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Configurações do Sistema</h3>
            <p class="text-sm text-gray-500 mb-4">Parâmetros gerais, categorias e permissões</p>
            <div class="flex justify-end">
                <a href="#" class="text-purple-600 text-sm font-medium hover:text-purple-800">Configurar <i class="fas fa-arrow-right ml-1"></i></a>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-green-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-green-100 p-3 rounded-lg"><i class="fas fa-chart-pie text-green-600 text-xl"></i></div>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Visão Geral</h3>
            <p class="text-sm text-gray-500 mb-4">Denúncias: ${totalDenuncias} | Reclamações: ${totalReclamacoes}</p>
            <div class="flex justify-end">
                <button onclick="document.getElementById('barChart').scrollIntoView({behavior: 'smooth'})" class="text-green-600 text-sm font-medium hover:text-green-800">Ver Gráficos <i class="fas fa-chart-line ml-1"></i></button>
            </div>
        </div>
    `;
    const cardsFuncionalidades = document.getElementById('cardsFuncionalidades');
    if (cardsFuncionalidades) cardsFuncionalidades.innerHTML = cardsHtml;
}

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
                    <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><i class="fas fa-exclamation-triangle text-red-600 text-sm"></i></div>
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
                    <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center"><i class="fas fa-flag text-yellow-600 text-sm"></i></div>
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

function logout() {
    const existingModal = document.getElementById('logoutConfirmModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    
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

let intervaloAtualizacao = null;
function iniciarAtualizacaoPeriodica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    intervaloAtualizacao = setInterval(async () => { 
        await buscarDenuncias(); 
        await buscarReclamacoes(); 
        renderizarCardsEstatisticas(); 
        renderizarGrafico(); 
        renderizarGraficoPizza(); 
        renderizarAtividades(); 
        await carregarTabelaGeral(); 
        renderizarNotificacoes(); 
        console.log('🔄 Dashboard atualizado automaticamente'); 
    }, 30000);
}

async function init() {
    // Chamar debug para verificar dados
    debugUsuarioLogado();
    
    const usuario = verificarUsuario();
    if (!usuario) return;
    
    // 🔥 ATUALIZAR SAUDAÇÃO COM NOME DO USUÁRIO
    const saudacaoPersonalizada = document.getElementById('saudacaoPersonalizada');
    const saudacaoNome = document.getElementById('saudacaoNome');
    const usuarioNomeElement = document.getElementById('usuarioNome');
    const usuarioProcessoElement = document.getElementById('usuarioProcesso');
    const nomeMobile = document.getElementById('nomeMobile');
    const processoMobile = document.getElementById('processoMobile');
    
    // Extrair primeiro nome para saudação
    const primeiroNome = usuario.nome ? usuario.nome.split(' ')[0] : 'Usuário';
    
    // Atualizar saudação personalizada
    if (saudacaoPersonalizada) {
        saudacaoPersonalizada.innerText = obterSaudacaoPersonalizada(usuario.nome);
    }
    
    if (saudacaoNome) {
        saudacaoNome.innerText = primeiroNome;
    }
    
    if (usuarioNomeElement) {
        usuarioNomeElement.innerText = usuario.nome || 'Usuário';
    }
    
    if (usuarioProcessoElement) {
        usuarioProcessoElement.innerText = `Processo: ${usuario.numero_processo || 'N/A'}`;
    }
    
    if (nomeMobile) {
        nomeMobile.innerText = usuario.nome || 'Usuário';
    }
    
    if (processoMobile) {
        processoMobile.innerText = `Processo: ${usuario.numero_processo || 'N/A'}`;
    }
    
    // 🔥 ATUALIZAR MENSAGEM DE SAUDAÇÃO BASEADA NO HORÁRIO
    const saudacaoMensagem = document.getElementById('saudacaoMensagem');
    if (saudacaoMensagem) {
        const hora = new Date().getHours();
        let mensagem = '';
        
        if (hora < 12) {
            mensagem = 'Bom dia! Acompanhe as suas actividades e estatísticas em tempo real';
        } else if (hora < 18) {
            mensagem = 'Boa tarde! Acompanhe as suas actividades e estatísticas em tempo real';
        } else {
            mensagem = 'Boa noite! Acompanhe as suas actividades e estatísticas em tempo real';
        }
        
        saudacaoMensagem.innerText = mensagem;
    }
    
    // Aplicar foto de perfil
    aplicarFotoPerfil(usuario);
    
    // Atualizar título da página
    document.title = `${primeiroNome} | IPIL - Dashboard`;
    
    // Buscar dados
    await Promise.all([buscarDenuncias(), buscarReclamacoes(), buscarUsuarios()]);
    
    // Renderizar tudo
    renderizarCardsEstatisticas();
    renderizarGrafico();
    renderizarGraficoPizza();
    renderizarAtividades();
    renderizarCardsFuncionalidades();
    renderizarNotificacoes();
    await carregarTabelaGeral();
    setupNotificacaoDropdown();
    iniciarAtualizacaoPeriodica();
    
    console.log('✅ Dashboard inicializado com sucesso para:', usuario.nome);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);