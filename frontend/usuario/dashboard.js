const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let denunciasUsuario = [];
let reclamacoesUsuario = [];
let todasAtividades = [];
let barChart, pieChart;
let intervaloAtualizacao = null;

// ============================================
// TOAST E NOTIFICAÇÕES MODERNAS
// ============================================

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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// MODAL MODERNO E INTERATIVO
// ============================================
function showModal(type, title, message, detalhes = null) {
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    const config = {
        success: { 
            icon: 'fa-check-circle', 
            iconColor: 'text-green-500', 
            bgGradient: 'from-green-500 to-green-600',
            buttonColor: 'bg-green-500 hover:bg-green-600'
        },
        error: { 
            icon: 'fa-exclamation-circle', 
            iconColor: 'text-red-500', 
            bgGradient: 'from-red-500 to-red-600',
            buttonColor: 'bg-red-500 hover:bg-red-600'
        },
        info: { 
            icon: 'fa-info-circle', 
            iconColor: 'text-blue-500', 
            bgGradient: 'from-blue-500 to-blue-600',
            buttonColor: 'bg-blue-500 hover:bg-blue-600'
        },
        warning: { 
            icon: 'fa-exclamation-triangle', 
            iconColor: 'text-yellow-500', 
            bgGradient: 'from-yellow-500 to-yellow-600',
            buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        },
        detalhe: { 
            icon: 'fa-file-alt', 
            iconColor: 'text-orange-500', 
            bgGradient: 'from-orange-500 to-orange-600',
            buttonColor: 'bg-orange-500 hover:bg-orange-600'
        }
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
        `;
        document.head.appendChild(style);
    }
    
    let detalhesHtml = '';
    if (detalhes) {
        detalhesHtml = `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="space-y-3">
                    ${detalhes.protocolo ? `
                        <div class="flex items-center justify-between pb-2 border-b border-gray-200">
                            <span class="text-xs text-gray-500 font-medium">PROTOCOLO</span>
                            <span class="text-sm font-mono font-bold text-gray-800">${detalhes.protocolo}</span>
                        </div>
                    ` : ''}
                    ${detalhes.titulo ? `
                        <div>
                            <span class="text-xs text-gray-500 font-medium block mb-1">TÍTULO</span>
                            <span class="text-sm font-semibold text-gray-800">${escapeHtml(detalhes.titulo)}</span>
                        </div>
                    ` : ''}
                    ${detalhes.descricao ? `
                        <div>
                            <span class="text-xs text-gray-500 font-medium block mb-1">DESCRIÇÃO</span>
                            <p class="text-sm text-gray-700 leading-relaxed">${escapeHtml(detalhes.descricao)}</p>
                        </div>
                    ` : ''}
                    ${detalhes.data ? `
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-500 font-medium">DATA DO OCORRIDO</span>
                            <span class="text-sm text-gray-700">${detalhes.data}</span>
                        </div>
                    ` : ''}
                    ${detalhes.local ? `
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-500 font-medium">LOCAL</span>
                            <span class="text-sm text-gray-700">${escapeHtml(detalhes.local)}</span>
                        </div>
                    ` : ''}
                    ${detalhes.status ? `
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-500 font-medium">STATUS</span>
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(detalhes.status)}">${translateStatus(detalhes.status)}</span>
                        </div>
                    ` : ''}
                    ${detalhes.categoria ? `
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-500 font-medium">CATEGORIA</span>
                            <span class="text-sm text-gray-700">${detalhes.categoria}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="modal-content bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div class="bg-gradient-to-r ${current.bgGradient} px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas ${current.icon} ${current.iconColor} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${escapeHtml(title)}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-600 text-base leading-relaxed">${escapeHtml(message)}</p>
                ${detalhesHtml}
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

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO E UTILITÁRIOS
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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(data) {
    if (!data) return 'Data não informada';
    const date = new Date(data);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

// ============================================
// FUNÇÕES DE CARREGAMENTO DE DADOS
// ============================================

async function carregarDenuncias() {
    try {
        const response = await fetch(`${API_URL}/denuncias?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            const data = await response.json();
            denunciasUsuario = Array.isArray(data) ? data : (data.data || []);
            console.log(`✅ ${denunciasUsuario.length} denúncias carregadas`);
        } else {
            throw new Error('Erro ao carregar denúncias');
        }
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        denunciasUsuario = [];
        showToast('error', 'Erro ao carregar denúncias');
    }
}

async function carregarReclamacoes() {
    try {
        const response = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            const data = await response.json();
            reclamacoesUsuario = Array.isArray(data) ? data : (data.data || []);
            console.log(`✅ ${reclamacoesUsuario.length} reclamações carregadas`);
        } else {
            throw new Error('Erro ao carregar reclamações');
        }
    } catch (error) {
        console.error('Erro ao carregar reclamações:', error);
        reclamacoesUsuario = [];
        showToast('error', 'Erro ao carregar reclamações');
    }
}

function combinarAtividades() {
    const denunciasFormatadas = denunciasUsuario.map(d => ({
        ...d,
        tipo_registro: 'denuncia',
        data_registro: d.data_ocorrencia || d.createdAt,
        status_display: d.status,
        categoria: d.tipo
    }));
    
    const reclamacoesFormatadas = reclamacoesUsuario.map(r => ({
        ...r,
        tipo_registro: 'reclamacao',
        data_registro: r.data_ocorrencia || r.createdAt,
        status_display: r.status,
        categoria: r.categoria
    }));
    
    todasAtividades = [...denunciasFormatadas, ...reclamacoesFormatadas];
    todasAtividades.sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro));
}

// ============================================
// FUNÇÕES DE ESTATÍSTICAS E GRÁFICOS DINÂMICOS
// ============================================

function calcularEstatisticasDinamicas() {
    const totalDenuncias = denunciasUsuario.length;
    const totalReclamacoes = reclamacoesUsuario.length;
    const totalGeral = totalDenuncias + totalReclamacoes;
    
    // Status para denúncias
    const pendentesDenuncias = denunciasUsuario.filter(d => d.status === 'pendente').length;
    const andamentoDenuncias = denunciasUsuario.filter(d => d.status === 'em_andamento').length;
    const concluidasDenuncias = denunciasUsuario.filter(d => d.status === 'concluida').length;
    const arquivadasDenuncias = denunciasUsuario.filter(d => d.status === 'arquivada').length;
    
    // Status para reclamações
    const pendentesReclamacoes = reclamacoesUsuario.filter(r => r.status === 'aberta').length;
    const andamentoReclamacoes = reclamacoesUsuario.filter(r => r.status === 'em_andamento').length;
    const resolvidasReclamacoes = reclamacoesUsuario.filter(r => r.status === 'resolvida').length;
    const fechadasReclamacoes = reclamacoesUsuario.filter(r => r.status === 'fechada').length;
    
    const totalPendentes = pendentesDenuncias + pendentesReclamacoes;
    const totalAndamento = andamentoDenuncias + andamentoReclamacoes;
    const totalConcluidas = concluidasDenuncias + resolvidasReclamacoes;
    const totalArquivadas = arquivadasDenuncias + fechadasReclamacoes;
    
    // Estatísticas de categorias
    const categorias = {
        denuncias: {},
        reclamacoes: {}
    };
    
    denunciasUsuario.forEach(d => {
        const tipo = d.tipo || 'outro';
        categorias.denuncias[tipo] = (categorias.denuncias[tipo] || 0) + 1;
    });
    
    reclamacoesUsuario.forEach(r => {
        const categoria = r.categoria || 'outro';
        categorias.reclamacoes[categoria] = (categorias.reclamacoes[categoria] || 0) + 1;
    });
    
    return {
        totalDenuncias,
        totalReclamacoes,
        totalGeral,
        totalPendentes,
        totalAndamento,
        totalConcluidas,
        totalArquivadas,
        categorias
    };
}

function getUltimos7Dias() {
    const dias = [];
    for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        dias.push({
            data: data,
            dataStr: data.toISOString().split('T')[0],
            label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        });
    }
    return dias;
}

function calcularAtividadesPorDia() {
    const ultimos7Dias = getUltimos7Dias();
    
    return ultimos7Dias.map(dia => {
        const atividadesDia = todasAtividades.filter(a => {
            const dataAtividade = a.data_registro?.split('T')[0];
            return dataAtividade === dia.dataStr;
        });
        
        const denunciasDia = atividadesDia.filter(a => a.tipo_registro === 'denuncia').length;
        const reclamacoesDia = atividadesDia.filter(a => a.tipo_registro === 'reclamacao').length;
        
        return {
            data: dia.label,
            total: atividadesDia.length,
            denuncias: denunciasDia,
            reclamacoes: reclamacoesDia,
            dataCompleta: dia.data
        };
    });
}

// ============================================
// ATUALIZAÇÃO DOS GRÁFICOS
// ============================================

function atualizarGraficos() {
    const stats = calcularEstatisticasDinamicas();
    const atividadesPorDia = calcularAtividadesPorDia();
    
    // Atualizar gráfico de barras (atividades por dia)
    if (barChart) {
        const labels = atividadesPorDia.map(d => d.data);
        const dadosTotais = atividadesPorDia.map(d => d.total);
        
        const coresLaranja = [
            'rgba(255, 237, 213, 0.8)',
            'rgba(254, 215, 170, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(234, 88, 12, 0.8)',
            'rgba(194, 65, 12, 0.8)',
            'rgba(154, 52, 18, 0.8)'
        ];
        
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = dadosTotais;
        barChart.data.datasets[0].backgroundColor = coresLaranja.slice(0, dadosTotais.length);
        barChart.data.datasets[0].borderColor = 'rgba(249, 115, 22, 1)';
        barChart.update();
    }
    
    // Atualizar gráfico de pizza (status)
    if (pieChart) {
        const dadosPizza = [stats.totalPendentes, stats.totalAndamento, stats.totalConcluidas];
        const labelsPizza = ['Pendentes', 'Em Análise', 'Resolvidas'];
        const coresPizza = [
            'rgba(251, 191, 36, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(194, 65, 12, 0.85)'
        ];
        
        pieChart.data.labels = labelsPizza;
        pieChart.data.datasets[0].data = dadosPizza;
        pieChart.data.datasets[0].backgroundColor = coresPizza;
        pieChart.update();
        
        // Atualizar legenda
        const total = stats.totalPendentes + stats.totalAndamento + stats.totalConcluidas;
        const legendHtml = labelsPizza.map((label, index) => {
            const valor = dadosPizza[index];
            const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;
            return `<div class="flex items-center justify-between py-1">
                        <div class="flex items-center">
                            <span class="w-3 h-3 rounded-full mr-2" style="background-color: ${coresPizza[index]}"></span>
                            <span class="text-xs text-gray-600">${label}</span>
                        </div>
                        <span class="text-xs font-semibold text-gray-800">${valor} (${percentual}%)</span>
                    </div>`;
        }).join('');
        
        const pieLegend = document.getElementById('pieLegend');
        if (pieLegend) pieLegend.innerHTML = legendHtml;
    }
}

function atualizarCardsEstatisticas() {
    const stats = calcularEstatisticasDinamicas();
    
    // Atualizar cards principais
    const totalRegistros = document.getElementById('totalRegistros');
    const totalPendentes = document.getElementById('totalPendentes');
    const totalAndamento = document.getElementById('totalAndamento');
    const totalConcluidas = document.getElementById('totalConcluidas');
    
    if (totalRegistros) totalRegistros.textContent = stats.totalGeral;
    if (totalPendentes) totalPendentes.textContent = stats.totalPendentes;
    if (totalAndamento) totalAndamento.textContent = stats.totalAndamento;
    if (totalConcluidas) totalConcluidas.textContent = stats.totalConcluidas;
    
    // Atualizar tabs
    const tabTotal = document.getElementById('tabTotal');
    const tabPendentes = document.getElementById('tabPendentes');
    const tabAndamento = document.getElementById('tabAndamento');
    const tabResolvidas = document.getElementById('tabResolvidas');
    
    if (tabTotal) tabTotal.textContent = stats.totalGeral;
    if (tabPendentes) tabPendentes.textContent = stats.totalPendentes;
    if (tabAndamento) tabAndamento.textContent = stats.totalAndamento;
    if (tabResolvidas) tabResolvidas.textContent = stats.totalConcluidas;
    
    // Atualizar notification badge
    const notificationBadge = document.getElementById('notificationBadge');
    if (notificationBadge) {
        if (stats.totalPendentes > 0) {
            notificationBadge.textContent = stats.totalPendentes;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    }
    
    // Atualizar contadores do menu lateral
    const reclamacoesCount = document.getElementById('reclamacoesCount');
    const denunciasCount = document.getElementById('denunciasCount');
    
    if (reclamacoesCount) reclamacoesCount.textContent = stats.totalReclamacoes;
    if (denunciasCount) denunciasCount.textContent = stats.totalDenuncias;
}

function atualizarTabelaAtividades() {
    const tbody = document.getElementById('tabelaAtividades');
    
    if (!tbody) return;
    
    if (todasAtividades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-orange-500 text-4xl mb-3 block"></i>
                    <p class="text-base">Nenhuma atividade encontrada</p>
                    <a href="./novasubmissao.html" class="text-orange-600 hover:text-orange-800 text-sm font-medium mt-2 inline-block transition-colors">
                        + Criar nova submissão
                    </a>
                </td>
            </tr>
        `;
        return;
    }
    
    const ultimasAtividades = todasAtividades.slice(0, 10);
    
    tbody.innerHTML = ultimasAtividades.map(item => `
        <tr class="hover:bg-orange-50 transition-colors cursor-pointer" onclick="verDetalhes('${item.tipo_registro}', ${item.id})">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <i class="fas ${item.tipo_registro === 'denuncia' ? 'fa-exclamation-triangle text-orange-500' : 'fa-flag text-orange-500'} text-lg"></i>
                    <span class="text-sm font-semibold ${item.tipo_registro === 'denuncia' ? 'text-orange-600' : 'text-orange-600'}">
                        ${item.tipo_registro === 'denuncia' ? 'Denúncia' : 'Reclamação'}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">${escapeHtml(item.titulo)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatDate(item.data_registro)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status_display)}">
                    ${translateStatus(item.status_display)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button class="text-orange-600 hover:text-orange-800 transition-colors">
                    <i class="fas fa-eye mr-1"></i> Detalhes
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// FUNÇÕES DE ATUALIZAÇÃO EM TEMPO REAL
// ============================================

async function atualizarDashboardCompleto() {
    try {
        // Mostrar loading nos cards
        const cards = document.querySelectorAll('.stat-card-value');
        cards.forEach(card => {
            if (card && !card.classList.contains('loading')) {
                card.style.opacity = '0.5';
            }
        });
        
        await Promise.all([carregarDenuncias(), carregarReclamacoes()]);
        combinarAtividades();
        
        atualizarInterface();
        atualizarCardsEstatisticas();
        atualizarGraficos();
        atualizarTabelaAtividades();
        
        // Restaurar opacidade
        cards.forEach(card => {
            card.style.opacity = '1';
        });
        
        console.log('✅ Dashboard atualizado em:', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        showToast('error', 'Erro ao atualizar dados');
    }
}

function iniciarAtualizacaoPeriodica() {
    if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
    
    // Atualizar a cada 30 segundos
    intervaloAtualizacao = setInterval(() => {
        atualizarDashboardCompleto();
    }, 30000);
}

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function atualizarInterface() {
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
}

function verDetalhes(tipo, id) {
    if (tipo === 'denuncia') {
        const item = denunciasUsuario.find(d => d.id === id);
        if (item) {
            showModal('detalhe', ' Detalhes da Denúncia', '', {
                protocolo: item.protocolo,
                titulo: item.titulo,
                descricao: item.descricao,
                data: formatDate(item.data_ocorrencia),
                local: item.local,
                status: item.status,
                categoria: item.tipo
            });
        } else {
            showModal('error', 'Erro', 'Denúncia não encontrada');
        }
    } else {
        const item = reclamacoesUsuario.find(r => r.id === id);
        if (item) {
            showModal('detalhe', ' Detalhes da Reclamação', '', {
                protocolo: item.protocolo,
                titulo: item.titulo,
                descricao: item.descricao,
                data: formatDate(item.data_ocorrencia),
                local: item.local,
                status: item.status,
                categoria: item.categoria
            });
        } else {
            showModal('error', 'Erro', 'Reclamação não encontrada');
        }
    }
}

function filtrarPorStatus(status) {
    const tbody = document.getElementById('tabelaAtividades');
    let filtradas = [...todasAtividades];
    
    if (status === 'pendente') {
        filtradas = todasAtividades.filter(a => a.status_display === 'pendente' || a.status_display === 'aberta');
    } else if (status === 'em_andamento') {
        filtradas = todasAtividades.filter(a => a.status_display === 'em_andamento');
    } else if (status === 'concluida') {
        filtradas = todasAtividades.filter(a => a.status_display === 'concluida' || a.status_display === 'resolvida');
    }
    
    if (filtradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-search text-orange-500 text-4xl mb-3 block"></i>
                    <p>Nenhuma atividade com este status</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filtradas.slice(0, 10).map(item => `
        <tr class="hover:bg-orange-50 transition-colors cursor-pointer" onclick="verDetalhes('${item.tipo_registro}', ${item.id})">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <i class="fas ${item.tipo_registro === 'denuncia' ? 'fa-exclamation-triangle text-orange-500' : 'fa-flag text-orange-500'} text-lg"></i>
                    <span class="text-sm font-semibold ${item.tipo_registro === 'denuncia' ? 'text-orange-600' : 'text-orange-600'}">
                        ${item.tipo_registro === 'denuncia' ? 'Denúncia' : 'Reclamação'}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 text-sm font-medium text-gray-900 max-w-xs truncate">${escapeHtml(item.titulo)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${formatDate(item.data_registro)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status_display)}">
                    ${translateStatus(item.status_display)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button class="text-orange-600 hover:text-orange-800 transition-colors">
                    <i class="fas fa-eye mr-1"></i> Detalhes
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// INICIALIZAÇÃO DOS GRÁFICOS
// ============================================

function initCharts() {
    const barCtx = document.getElementById('barChart');
    const pieCtx = document.getElementById('pieChart');
    
    if (barCtx) {
        barChart = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: { 
                labels: [], 
                datasets: [{ 
                    label: 'Atividades Registradas', 
                    data: [], 
                    backgroundColor: [],
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1,
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#f97316',
                        bodyColor: '#fff',
                        cornerRadius: 8
                    }
                }, 
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1, color: '#6b7280' },
                        grid: { color: '#e5e7eb' }
                    }, 
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#6b7280', font: { size: 11 } }
                    } 
                } 
            }
        });
    }
    
    if (pieCtx) {
        pieChart = new Chart(pieCtx.getContext('2d'), {
            type: 'pie',
            data: { 
                labels: [], 
                datasets: [{ 
                    data: [], 
                    backgroundColor: [],
                    borderWidth: 3,
                    hoverOffset: 15,
                    cutout: '0%'
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: '#f97316',
                        bodyColor: '#fff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function initTabs() {
    const botoes = document.querySelectorAll('.filter-btn');
    const statusMap = ['todos', 'pendente', 'em_andamento', 'concluida'];
    
    botoes.forEach((btn, idx) => {
        btn.addEventListener('click', function() {
            botoes.forEach(b => { 
                b.classList.remove('bg-orange-500', 'text-white'); 
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            this.classList.remove('bg-gray-100', 'text-gray-700'); 
            this.classList.add('bg-orange-500', 'text-white');
            if (statusMap[idx] === 'todos') atualizarTabelaAtividades();
            else filtrarPorStatus(statusMap[idx]);
        });
    });
}

// ============================================
// LOGOUT
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
// INICIALIZAÇÃO PRINCIPAL
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    
    initCharts();
    initTabs();
    
    await atualizarDashboardCompleto();
    iniciarAtualizacaoPeriodica();
    
    showToast('success', `Bem-vindo, ${usuarioLogado.nome.split(' ')[0]}!`);
    console.log('✅ Dashboard inicializado com sucesso');
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.logout = logout;
window.verDetalhes = verDetalhes;
window.filtrarPorStatus = filtrarPorStatus;