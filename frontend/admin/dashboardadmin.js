// dashboard.js - Script do Painel Administrativo

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
        denunciasData = Array.isArray(data) ? data : [];
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
            showToast('success', `Status atualizado para: ${status}`);
            await init();
        } else {
            showToast('error', 'Erro ao atualizar status');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast('error', 'Erro ao conectar ao servidor');
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
    document.getElementById('badgeDenuncias').innerText = denunciasData.length;
    document.getElementById('badgeUsuarios').innerText = totalUsuarios;
    document.getElementById('badgeReclamacoes').innerText = reclamacoesData.length;
}

// ============================================
// RENDERIZAR GRÁFICO (Denúncias + Reclamações)
// ============================================
function renderizarGrafico() {
    const semanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    const dadosDenunciasSemana = [0, 0, 0, 0];
    const dadosReclamacoesSemana = [0, 0, 0, 0];
    
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    
    // Contar denúncias por semana
    denunciasData.forEach(denuncia => {
        const data = new Date(denuncia.createdAt);
        if (data >= inicioMes) {
            const diffDias = Math.floor((data - inicioMes) / (1000 * 60 * 60 * 24));
            const semana = Math.min(Math.floor(diffDias / 7), 3);
            dadosDenunciasSemana[semana]++;
        }
    });
    
    // Contar reclamações por semana
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
                    labels: {
                        usePointStyle: true,
                        boxWidth: 10
                    }
                },
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
                    ticks: { stepSize: 1 },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { 
                    grid: { display: false }
                }
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
    
    document.getElementById('totalAtividades').innerText = todasAtividades.length;
    
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
    
    document.getElementById('listaAtividades').innerHTML = atividadesHtml;
}

// ============================================
// RENDERIZAR TABELA DE DENÚNCIAS E RECLAMAÇÕES
// ============================================
async function carregarDenuncias() {
    await buscarDenuncias();
    await buscarReclamacoes();
    
    const statusOptions = {
        pendente: ['pendente', 'em_andamento', 'concluida', 'arquivada'],
        em_andamento: ['pendente', 'em_andamento', 'concluida', 'arquivada'],
        concluida: ['pendente', 'em_andamento', 'concluida', 'arquivada'],
        arquivada: ['pendente', 'em_andamento', 'concluida', 'arquivada']
    };
    
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
        ...denunciasData.map(d => ({ ...d, tipo: 'denuncia', categoria_tipo: d.tipo })),
        ...reclamacoesData.map(r => ({ ...r, tipo: 'reclamacao', categoria_tipo: r.categoria }))
    ];
    
    todosItens.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const itensExibir = todosItens.slice(0, 10);
    
    let tabelaHtml = '';
    itensExibir.forEach(item => {
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT');
        const cor = statusCores[item.status] || statusCores.pendente;
        const tipoIcone = item.tipo === 'denuncia' ? 'fa-exclamation-triangle text-orange-500' : 'fa-flag text-yellow-500';
        const tipoTexto = item.tipo === 'denuncia' ? 'Denúncia' : 'Reclamação';
        
        tabelaHtml += `
            <tr class="hover:bg-gray-50 transition cursor-pointer" onclick="verDetalhes(${item.id}, '${item.tipo}')">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center space-x-2">
                        <i class="fas ${tipoIcone}"></i>
                        <span class="text-sm font-medium">${tipoTexto}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${item.id}</td>
                <td class="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">${item.titulo}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${item.categoria_tipo || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${dataFormatada}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <select onchange="atualizarStatus(${item.id}, '${item.tipo === 'denuncia' ? 'denuncias' : 'reclamacoes'}', this.value)" 
                            class="text-xs border rounded-lg px-2 py-1 ${cor}" onclick="event.stopPropagation()">
                        ${item.tipo === 'denuncia' ? `
                            <option value="pendente" ${item.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="concluida" ${item.status === 'concluida' ? 'selected' : ''}>Concluída</option>
                            <option value="arquivada" ${item.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
                        ` : `
                            <option value="aberta" ${item.status === 'aberta' ? 'selected' : ''}>Aberta</option>
                            <option value="em_andamento" ${item.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                            <option value="resolvida" ${item.status === 'resolvida' ? 'selected' : ''}>Resolvida</option>
                            <option value="fechada" ${item.status === 'fechada' ? 'selected' : ''}>Fechada</option>
                        `}
                    </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="verDetalhes(${item.id}, '${item.tipo}')" class="text-blue-600 hover:text-blue-800" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    if (itensExibir.length === 0) {
        tabelaHtml = '<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhuma denúncia ou reclamação encontrada</td></tr>';
    }
    
    document.getElementById('tabelaDenuncias').innerHTML = tabelaHtml;
}

// ============================================
// RENDERIZAR CARDS DE FUNCIONALIDADES (SEM RELATÓRIOS E ATUALIZAÇÃO)
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
            <p class="text-sm text-gray-500 mb-4">Parâmetros gerais, categorias</p>
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
        
        <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 border-orange-500">
            <div class="flex items-center justify-between mb-4">
                <div class="bg-orange-100 p-3 rounded-lg">
                    <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                </div>
                <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">${denunciasData.filter(d => d.status === 'pendente').length + reclamacoesData.filter(r => r.status === 'aberta').length} pendentes</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-1">Gestão de Conteúdo</h3>
            <p class="text-sm text-gray-500 mb-4">Gerir denúncias e reclamações</p>
            <div class="flex justify-end">
                <button onclick="document.getElementById('tabelaDenuncias').scrollIntoView({behavior: 'smooth'})" class="text-orange-600 text-sm font-medium hover:text-orange-800">
                    Gerenciar <i class="fas fa-arrow-right ml-1"></i>
                </button>
            </div>
        </div>
    `;
    document.getElementById('cardsFuncionalidades').innerHTML = cardsHtml;
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function renderizarNotificacoes() {
    const pendentesDenuncias = denunciasData.filter(d => d.status === 'pendente');
    const pendentesReclamacoes = reclamacoesData.filter(r => r.status === 'aberta');
    const totalPendentes = pendentesDenuncias.length + pendentesReclamacoes.length;
    
    const contador = document.getElementById('contadorNotificacoes');
    if (totalPendentes > 0) {
        contador.innerText = totalPendentes > 9 ? '9+' : totalPendentes;
        contador.classList.remove('hidden');
    } else {
        contador.classList.add('hidden');
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
    
    document.getElementById('listaNotificacoes').innerHTML = notificacoesHtml;
}

// ============================================
// VER DETALHES COM MODAL
// ============================================
function verDetalhes(id, tipo) {
    const item = tipo === 'denuncia' 
        ? denunciasData.find(d => d.id === id)
        : reclamacoesData.find(r => r.id === id);
    
    if (item) {
        const dataFormatada = new Date(item.createdAt).toLocaleDateString('pt-PT', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        const mensagem = `📋 ${tipo === 'denuncia' ? 'DENÚNCIA' : 'RECLAMAÇÃO'}\n\n` +
            `Protocolo: ${item.protocolo || 'N/A'}\n` +
            `Título: ${item.titulo}\n` +
            `Descrição: ${item.descricao}\n` +
            `Status: ${item.status.replace('_', ' ')}\n` +
            `Data: ${dataFormatada}\n` +
            `Local: ${item.local || 'Não informado'}\n` +
            `Categoria: ${item.tipo || item.categoria || 'Não informada'}`;
        
        showModal('info', `Detalhes da ${tipo === 'denuncia' ? 'Denúncia' : 'Reclamação'}`, mensagem);
    }
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
            dropdown.classList.toggle('hidden');
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
    await carregarDenuncias();
    renderizarCardsFuncionalidades();
    renderizarNotificacoes();
    setupNotificacaoDropdown();
}

// Iniciar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);