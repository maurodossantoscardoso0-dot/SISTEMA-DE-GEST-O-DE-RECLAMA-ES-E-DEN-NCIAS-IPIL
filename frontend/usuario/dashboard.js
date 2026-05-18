const API_URL = 'http://localhost:3000/api';
let usuarioLogado = null;
let denunciasUsuario = [];
let reclamacoesUsuario = [];
let todasAtividades = [];
let barChart, pieChart;

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
            .modal-content { animation: slideIn 0.3s ease; }
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
                            <span class="text-sm font-semibold text-gray-800">${detalhes.titulo}</span>
                        </div>
                    ` : ''}
                    ${detalhes.descricao ? `
                        <div>
                            <span class="text-xs text-gray-500 font-medium block mb-1">DESCRIÇÃO</span>
                            <p class="text-sm text-gray-700 leading-relaxed">${detalhes.descricao}</p>
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
                            <span class="text-sm text-gray-700">${detalhes.local}</span>
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
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-600 text-base leading-relaxed">${message}</p>
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

function checkAuth() {
    const usuario = sessionStorage.getItem('usuarioLogado');
    if (!usuario) { window.location.href = './login.html'; return null; }
    return JSON.parse(usuario);
}

function getInitials(nome) {
    if (!nome) return 'U';
    return nome.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
}

function formatDate(data) {
    if (!data) return 'Data não informada';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

async function carregarDenuncias() {
    try {
        const response = await fetch(`${API_URL}/denuncias?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            denunciasUsuario = await response.json();
            console.log(`✅ ${denunciasUsuario.length} denúncias carregadas`);
        } else {
            throw new Error('Erro ao carregar denúncias');
        }
    } catch (error) {
        console.error('Erro ao carregar denúncias:', error);
        denunciasUsuario = [];
    }
}

async function carregarReclamacoes() {
    try {
        const response = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
        if (response.ok) {
            reclamacoesUsuario = await response.json();
            console.log(`✅ ${reclamacoesUsuario.length} reclamações carregadas`);
        } else {
            throw new Error('Erro ao carregar reclamações');
        }
    } catch (error) {
        console.error('Erro ao carregar reclamações:', error);
        reclamacoesUsuario = [];
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

function atualizarInterface() {
    document.getElementById('usuarioNome').textContent = usuarioLogado.nome;
    document.getElementById('usuarioProcesso').textContent = `Processo: ${usuarioLogado.numero_processo}`;
    document.getElementById('saudacaoNome').textContent = usuarioLogado.nome.split(' ')[0];
    
    const initials = getInitials(usuarioLogado.nome);
    document.getElementById('usuarioAvatar').textContent = initials;
    document.getElementById('avatarMobile').textContent = initials;
    document.getElementById('nomeMobile').textContent = usuarioLogado.nome;
    document.getElementById('processoMobile').textContent = `Processo: ${usuarioLogado.numero_processo}`;
    
    document.getElementById('denunciasCount').textContent = denunciasUsuario.length;
    document.getElementById('reclamacoesCount').textContent = reclamacoesUsuario.length;
}

function atualizarDashboard() {
    const totalDenuncias = denunciasUsuario.length;
    const totalReclamacoes = reclamacoesUsuario.length;
    const totalGeral = totalDenuncias + totalReclamacoes;
    
    const pendentesDenuncias = denunciasUsuario.filter(d => d.status === 'pendente').length;
    const pendentesReclamacoes = reclamacoesUsuario.filter(r => r.status === 'aberta').length;
    const totalPendentes = pendentesDenuncias + pendentesReclamacoes;
    
    const andamentoDenuncias = denunciasUsuario.filter(d => d.status === 'em_andamento').length;
    const andamentoReclamacoes = reclamacoesUsuario.filter(r => r.status === 'em_andamento').length;
    const totalAndamento = andamentoDenuncias + andamentoReclamacoes;
    
    const concluidasDenuncias = denunciasUsuario.filter(d => d.status === 'concluida').length;
    const concluidasReclamacoes = reclamacoesUsuario.filter(r => r.status === 'resolvida').length;
    const totalConcluidas = concluidasDenuncias + concluidasReclamacoes;
    
    document.getElementById('totalDenuncias').textContent = totalGeral;
    document.getElementById('totalPendentes').textContent = totalPendentes;
    document.getElementById('totalProcessamento').textContent = totalAndamento;
    document.getElementById('totalConcluidas').textContent = totalConcluidas;
    
    document.getElementById('tabTotal').textContent = totalGeral;
    document.getElementById('tabPendentes').textContent = totalPendentes;
    document.getElementById('tabAndamento').textContent = totalAndamento;
    document.getElementById('tabResolvidas').textContent = totalConcluidas;
    
    document.getElementById('statsRegistradas').textContent = totalGeral;
    document.getElementById('statsAguardando').textContent = totalPendentes;
    document.getElementById('statsProcessando').textContent = totalAndamento;
    document.getElementById('statsConcluidas').textContent = totalConcluidas;
    
    const notificacoes = totalPendentes;
    if (notificacoes > 0) {
        document.getElementById('notificationBadge').textContent = notificacoes;
        document.getElementById('notificationBadge').classList.remove('hidden');
    }
    
    atualizarGraficos(totalPendentes, totalAndamento, totalConcluidas);
    atualizarTabelaAtividades();
}

function atualizarGraficos(pendentes, andamento, concluidas) {
    const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (6 - i));
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    
    const dadosBarras = [];
    for (let i = 0; i < 7; i++) {
        const dataAtual = new Date();
        dataAtual.setDate(dataAtual.getDate() - (6 - i));
        const dataStr = dataAtual.toISOString().split('T')[0];
        
        const atividadesDia = todasAtividades.filter(a => a.data_registro?.split('T')[0] === dataStr);
        dadosBarras.push(atividadesDia.length);
    }
    
    // Cores na paleta laranja para o gráfico de barras
    const coresLaranja = [
        'rgba(255, 237, 213, 0.8)',  // laranja muito claro
        'rgba(254, 215, 170, 0.8)',  // laranja claro
        'rgba(251, 191, 36, 0.8)',   // âmbar
        'rgba(249, 115, 22, 0.8)',   // laranja principal
        'rgba(234, 88, 12, 0.8)',    // laranja escuro
        'rgba(194, 65, 12, 0.8)',    // laranja mais escuro
        'rgba(154, 52, 18, 0.8)'     // laranja queimado
    ];
    
    if (barChart) {
        barChart.data.labels = ultimos7Dias;
        barChart.data.datasets[0].data = dadosBarras;
        barChart.data.datasets[0].backgroundColor = coresLaranja;
        barChart.data.datasets[0].borderColor = 'rgba(249, 115, 22, 1)';
        barChart.update();
    }
    
    // Cores na paleta laranja para o gráfico de pizza
    const dadosPizza = [pendentes, andamento, concluidas];
    const labelsPizza = ['Pendentes', 'Em Análise', 'Resolvidas'];
    const coresPizza = [
        'rgba(251, 191, 36, 0.85)',   // âmbar/dourado
        'rgba(249, 115, 22, 0.85)',   // laranja principal
        'rgba(194, 65, 12, 0.85)'     // laranja queimado
    ];
    
    if (pieChart) {
        pieChart.data.labels = labelsPizza;
        pieChart.data.datasets[0].data = dadosPizza;
        pieChart.data.datasets[0].backgroundColor = coresPizza;
        pieChart.data.datasets[0].borderColor = '#ffffff';
        pieChart.update();
    }
    
    const total = pendentes + andamento + concluidas;
    const legendHtml = labelsPizza.map((label, index) => {
        const valor = dadosPizza[index];
        const percentual = total > 0 ? Math.round((valor / total) * 100) : 0;
        return `<div class="flex items-center justify-between py-1"><div class="flex items-center"><span class="w-3 h-3 rounded-full mr-2" style="background-color: ${coresPizza[index]}"></span><span class="text-xs text-gray-600">${label}</span></div><span class="text-xs font-semibold text-gray-800">${valor} (${percentual}%)</span></div>`;
    }).join('');
    
    document.getElementById('pieLegend').innerHTML = legendHtml;
}

function atualizarTabelaAtividades() {
    const tbody = document.getElementById('tabelaAtividades');
    
    if (todasAtividades.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-inbox text-orange-500 text-4xl mb-3 block"></i>
                    <p class="text-base">Nenhuma atividade encontrada</p>
                    <a href="./novasubmissao.html" class="text-orange-600 hover:text-orange-800 text-sm font-medium mt-2 inline-block transition-colors">+ Criar nova submissão</a>
                </td>
            </tr>
        `;
        return;
    }
    
    const ultimas5 = todasAtividades.slice(0, 5);
    
    tbody.innerHTML = ultimas5.map(item => `
        <tr class="hover:bg-orange-50 transition-colors cursor-pointer" onclick="verDetalhes('${item.tipo_registro}', ${item.id})">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <i class="fas ${item.tipo_registro === 'denuncia' ? 'fa-exclamation-triangle text-orange-500' : 'fa-flag text-orange-500'} text-lg"></i>
                    <span class="text-sm font-semibold ${item.tipo_registro === 'denuncia' ? 'text-orange-600' : 'text-orange-600'}">
                        ${item.tipo_registro === 'denuncia' ? 'Denúncia' : 'Reclamação'}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.titulo}</td>
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
// VER DETALHES COM MODAL MODERNO
// ============================================
function verDetalhes(tipo, id) {
    if (tipo === 'denuncia') {
        const item = denunciasUsuario.find(d => d.id === id);
        if (item) {
            showModal('detalhe', '📋 Detalhes da Denúncia', '', {
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
            showModal('detalhe', '📋 Detalhes da Reclamação', '', {
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
    
    tbody.innerHTML = filtradas.slice(0, 5).map(item => `
        <tr class="hover:bg-orange-50 transition-colors cursor-pointer" onclick="verDetalhes('${item.tipo_registro}', ${item.id})">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-2">
                    <i class="fas ${item.tipo_registro === 'denuncia' ? 'fa-exclamation-triangle text-orange-500' : 'fa-flag text-orange-500'} text-lg"></i>
                    <span class="text-sm font-semibold ${item.tipo_registro === 'denuncia' ? 'text-orange-600' : 'text-orange-600'}">
                        ${item.tipo_registro === 'denuncia' ? 'Denúncia' : 'Reclamação'}
                    </span>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.titulo}</td>
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

function initCharts() {
    const barCtx = document.getElementById('barChart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: { 
            labels: [], 
            datasets: [{ 
                label: 'Atividades', 
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
                    ticks: { color: '#6b7280' }
                } 
            } 
        }
    });
    
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChart = new Chart(pieCtx, {
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

document.addEventListener('DOMContentLoaded', async function() {
    usuarioLogado = checkAuth();
    if (!usuarioLogado) return;
    
    initCharts();
    initTabs();
    
    await Promise.all([carregarDenuncias(), carregarReclamacoes()]);
    combinarAtividades();
    atualizarInterface();
    atualizarDashboard();
    
    setTimeout(() => {
        const totalBtn = document.querySelector('.filter-btn:first-child');
        if(totalBtn) { totalBtn.classList.remove('bg-gray-100', 'text-gray-700'); totalBtn.classList.add('bg-orange-500', 'text-white'); }
    }, 100);
});

window.logout = logout;
window.verDetalhes = verDetalhes;