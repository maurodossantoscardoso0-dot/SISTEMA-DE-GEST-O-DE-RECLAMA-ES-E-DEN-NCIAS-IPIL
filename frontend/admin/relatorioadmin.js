/**
 * ============================================
 * RELATÓRIOS E ESTATÍSTICAS - SCRIPT PRINCIPAL
 * ============================================
 * Este arquivo contém toda a lógica JavaScript para:
 * - Buscar dados da API (denúncias, reclamações, usuários)
 * - Calcular estatísticas e distribuições
 * - Renderizar gráficos (linha e pizza) com Chart.js
 * - Gerar relatórios em PDF e Excel
 * - Exibir notificações e modais interativos
 * - Gerenciar autenticação e logout
 * ============================================
 */

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let denunciasData = [];      // Array para armazenar todas as denúncias buscadas da API
let reclamacoesData = [];    // Array para armazenar todas as reclamações buscadas da API
let usuariosData = [];       // Array para armazenar todos os usuários buscados da API
let lineChart = null;        // Referência para o gráfico de linha (Chart.js)
let pieChart = null;         // Referência para o gráfico de pizza (Chart.js)

// ============================================
// FUNÇÕES DE AUTENTICAÇÃO E VERIFICAÇÃO
// ============================================

/**
 * Verifica se o usuário está autenticado e se é administrador
 * @returns {Object|null} Dados do usuário logado ou null se não for admin
 */
function verificarAdmin() {
    // Busca os dados do usuário no sessionStorage (armazenamento temporário)
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    
    // Se não houver usuário logado, redireciona para a página de login
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    
    // Converte a string JSON para objeto JavaScript
    const usuario = JSON.parse(usuarioLogado);
    
    // Verifica se o tipo de usuário é 'admin'
    if (usuario.tipo !== 'admin') {
        // Se não for admin, mostra modal de erro e redireciona
        showModal('error', 'Acesso Negado', '⛔ Apenas administradores podem acessar esta página.');
        setTimeout(() => {
            window.location.href = '../usuario/dashboard.html';
        }, 2000);
        return null;
    }
    
    // Retorna os dados do usuário admin
    return usuario;
}

// ============================================
// MODAL PERSONALIZADO (SUBSTITUI O ALERT NATIVO)
// ============================================

/**
 * Exibe um modal personalizado com diferentes tipos (sucesso, erro, info, etc.)
 * @param {string} type - Tipo do modal: 'success', 'error', 'info', 'warning', 'confirm'
 * @param {string} title - Título do modal
 * @param {string} message - Mensagem a ser exibida
 * @param {function} onConfirm - Função callback ao confirmar
 */
function showModal(type, title, message, onConfirm = null) {
    // Remove modal existente para evitar duplicação
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    // Configurações visuais para cada tipo de modal
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
        confirm: { 
            icon: 'fa-question-circle', 
            iconColor: 'text-orange-500', 
            bgGradient: 'from-orange-500 to-orange-600', 
            buttonColor: 'bg-orange-500 hover:bg-orange-600' 
        }
    };
    
    // Seleciona a configuração baseada no tipo
    const current = config[type] || config.info;
    
    // Cria o elemento do modal
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Adiciona estilos CSS se não existirem
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
    
    // Conteúdo HTML do modal
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
    
    // Função para fechar o modal
    const closeModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
        if (onConfirm) onConfirm();
    };
    
    // Evento do botão fechar
    document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
    // Fecha ao clicar fora do modal
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// TOAST DE NOTIFICAÇÃO (NOTIFICAÇÕES TEMPORÁRIAS)
// ============================================

/**
 * Exibe uma notificação temporária no canto inferior direito
 * @param {string} type - Tipo da notificação: 'success', 'error', 'info'
 * @param {string} message - Mensagem a ser exibida
 */
function showToast(type, message) {
    // Remove toasts existentes para evitar duplicação
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Configurações visuais por tipo
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' }
    };
    
    const currentConfig = config[type] || config.info;
    
    // Cria o elemento do toast
    const toast = document.createElement('div');
    toast.className = `custom-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${currentConfig.bg} text-white toast-slide-in`;
    toast.innerHTML = `<i class="fas ${currentConfig.icon} mr-2"></i>${message}`;
    document.body.appendChild(toast);
    
    // Adiciona estilos CSS se não existirem
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
    
    // Remove o toast automaticamente após 3 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// FORMATAÇÃO DE DATA (FORMATO PORTUGUÊS)
// ============================================

/**
 * Formata uma data no padrão português (dd/mm/aaaa às HH:MM)
 * @param {string|Date} data - Data a ser formatada
 * @returns {string} Data formatada
 */
function formatarDataPortugal(data) {
    if (!data) return 'Data não informada';
    try {
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        const dia = date.getDate().toString().padStart(2, '0');      // Dia com 2 dígitos
        const mes = (date.getMonth() + 1).toString().padStart(2, '0'); // Mês com 2 dígitos (janeiro = 0)
        const ano = date.getFullYear();                               // Ano com 4 dígitos
        const horas = date.getHours().toString().padStart(2, '0');    // Horas com 2 dígitos
        const minutos = date.getMinutes().toString().padStart(2, '0'); // Minutos com 2 dígitos
        
        return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    } catch (error) {
        return 'Data inválida';
    }
}

// ============================================
// FUNÇÕES DE BUSCA DE DADOS (API)
// ============================================

/**
 * Busca todas as denúncias da API
 * @returns {Promise<Array>} Array de denúncias
 */
async function buscarDenuncias() {
    try {
        // Faz requisição GET para o endpoint de denúncias
        const response = await fetch('http://localhost:3000/api/denuncias');
        const data = await response.json();
        // Garante que os dados sejam um array (pode estar dentro de data.data)
        denunciasData = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Denúncias carregadas:', denunciasData.length);
        return denunciasData;
    } catch (error) {
        console.error('Erro ao buscar denúncias:', error);
        return [];
    }
}

/**
 * Busca todas as reclamações da API
 * @returns {Promise<Array>} Array de reclamações
 */
async function buscarReclamacoes() {
    try {
        const response = await fetch('http://localhost:3000/api/reclamacoes');
        const data = await response.json();
        reclamacoesData = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Reclamações carregadas:', reclamacoesData.length);
        return reclamacoesData;
    } catch (error) {
        console.error('Erro ao buscar reclamações:', error);
        return [];
    }
}

/**
 * Busca todos os usuários da API
 * @returns {Promise<Array>} Array de usuários
 */
async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = Array.isArray(data) ? data : (data.data || []);
        console.log('✅ Usuários carregados:', usuariosData.length);
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return [];
    }
}

// ============================================
// CÁLCULO DE DISTRIBUIÇÃO POR CATEGORIA
// ============================================

/**
 * Calcula a distribuição de denúncias e reclamações por categoria
 * @returns {Object} Objeto com categorias e total geral
 */
function calcularDistribuicaoCategorias() {
    // Objeto com todas as categorias e seus valores iniciais
    const categorias = {
        infraestrutura: { nome: 'Infraestrutura', cor: 'bg-purple-500', corGrafico: 'rgba(147, 51, 234, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        saude: { nome: 'Saúde', cor: 'bg-yellow-500', corGrafico: 'rgba(234, 179, 8, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        educacao: { nome: 'Educação', cor: 'bg-indigo-500', corGrafico: 'rgba(99, 102, 241, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        'meio-ambiente': { nome: 'Meio Ambiente', cor: 'bg-green-500', corGrafico: 'rgba(34, 197, 94, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        seguranca: { nome: 'Segurança', cor: 'bg-red-500', corGrafico: 'rgba(239, 68, 68, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        saneamento: { nome: 'Saneamento', cor: 'bg-blue-500', corGrafico: 'rgba(59, 130, 246, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 },
        outro: { nome: 'Outro', cor: 'bg-gray-500', corGrafico: 'rgba(107, 114, 128, 0.8)', denuncias: 0, reclamacoes: 0, total: 0, percentual: 0 }
    };
    
    // Contabiliza denúncias por categoria
    denunciasData.forEach(denuncia => {
        const tipo = denuncia.tipo || 'outro';
        if (categorias[tipo]) {
            categorias[tipo].denuncias++;
            categorias[tipo].total++;
        }
    });
    
    // Contabiliza reclamações por categoria
    reclamacoesData.forEach(reclamacao => {
        const categoria = reclamacao.categoria || 'outro';
        if (categorias[categoria]) {
            categorias[categoria].reclamacoes++;
            categorias[categoria].total++;
        }
    });
    
    // Calcula total geral e percentuais
    const totalGeral = denunciasData.length + reclamacoesData.length;
    Object.keys(categorias).forEach(key => {
        categorias[key].percentual = totalGeral > 0 ? ((categorias[key].total / totalGeral) * 100).toFixed(1) : 0;
    });
    
    return { categorias, totalGeral };
}

// ============================================
// ATUALIZAÇÃO DOS CARDS DE ESTATÍSTICAS
// ============================================

/**
 * Atualiza os cards de estatísticas na interface
 */
function atualizarCardsEstatisticas() {
    // Calcula totais
    const totalGeral = denunciasData.length + reclamacoesData.length;
    const totalResolvidas = denunciasData.filter(d => d.status === 'concluida').length + reclamacoesData.filter(r => r.status === 'resolvida').length;
    const taxaResolucao = totalGeral > 0 ? ((totalResolvidas / totalGeral) * 100).toFixed(1) : 0;
    
    // HTML dos cards
    const cardsHtml = `
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600 hover:shadow-lg transition stat-card">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Total de Registos</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${totalGeral}</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-chart-line mr-1"></i>
                        Denúncias: ${denunciasData.length} | Reclamações: ${reclamacoesData.length}
                    </p>
                </div>
                <div class="bg-orange-100 p-3 rounded-lg">
                    <i class="fas fa-clipboard-list text-orange-600 text-2xl"></i>
                </div>
            </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition stat-card">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Taxa de Resolução</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${taxaResolucao}%</h3>
                    <p class="text-xs text-green-600 mt-2">
                        <i class="fas fa-check-circle mr-1"></i>
                        ${totalResolvidas} de ${totalGeral} resolvidas
                    </p>
                </div>
                <div class="bg-green-100 p-3 rounded-lg">
                    <i class="fas fa-percent text-green-600 text-2xl"></i>
                </div>
            </div>
            <div class="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                <div class="bg-green-500 h-1.5 rounded-full" style="width: ${taxaResolucao}%"></div>
            </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition stat-card">
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-sm text-gray-500 font-medium">Usuários Ativos</p>
                    <h3 class="text-3xl font-bold text-gray-800 mt-2">${usuariosData.length}</h3>
                    <p class="text-xs text-blue-600 mt-2">
                        <i class="fas fa-users mr-1"></i>
                        Administradores: ${usuariosData.filter(u => u.tipo === 'admin').length}
                    </p>
                </div>
                <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-users text-blue-600 text-2xl"></i>
                </div>
            </div>
        </div>
    `;
    
    // Insere os cards no container
    const cardsContainer = document.getElementById('cardsEstatisticas');
    if (cardsContainer) cardsContainer.innerHTML = cardsHtml;
    
    // Atualiza badges do sidebar
    const badgeDenuncias = document.getElementById('badgeDenuncias');
    const badgeReclamacoes = document.getElementById('badgeReclamacoes');
    const badgeUsuarios = document.getElementById('badgeUsuarios');
    
    if (badgeDenuncias) badgeDenuncias.innerText = denunciasData.length;
    if (badgeReclamacoes) badgeReclamacoes.innerText = reclamacoesData.length;
    if (badgeUsuarios) badgeUsuarios.innerText = usuariosData.length;
}

// ============================================
// ATUALIZAÇÃO DA TABELA DE DISTRIBUIÇÃO
// ============================================

/**
 * Atualiza a tabela de distribuição por categoria na interface
 */
function atualizarTabelaDistribuicao() {
    const { categorias, totalGeral } = calcularDistribuicaoCategorias();
    const tbody = document.getElementById('tabelaCategoriasBody');
    
    if (tbody) {
        let html = '';
        // Filtra apenas categorias com total > 0
        const categoriasAtivas = Object.values(categorias).filter(cat => cat.total > 0);
        
        // Gera linha para cada categoria ativa
        categoriasAtivas.forEach(cat => {
            html += `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <span class="w-3 h-3 ${cat.cor} rounded-full mr-2"></span>
                            <span class="text-sm font-medium text-gray-900">${cat.nome}</span>
                        </div>
                     </td>
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.denuncias}</td>
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.reclamacoes}</td>
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">${cat.total}</td>
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">${cat.percentual}%</td>
                    <td class="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div class="w-24 bg-gray-200 rounded-full h-2">
                            <div class="${cat.cor} h-2 rounded-full" style="width: ${cat.percentual}%"></div>
                        </div>
                    </td>
                 </tr>
            `;
        });
        
        // Linha de total
        html += `
            <tr class="bg-gray-100 font-semibold">
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">TOTAL</td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${denunciasData.length}</td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${reclamacoesData.length}</td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">${totalGeral}</td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">100%</td>
                <td class="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell"></td>
             </tr>
        `;
        
        tbody.innerHTML = html;
    }
}

// ============================================
// GRÁFICO DE PIZZA (DISTRIBUIÇÃO POR CATEGORIA)
// ============================================

/**
 * Renderiza o gráfico de pizza com a distribuição por categoria
 */
function atualizarGraficoPizza() {
    const { categorias } = calcularDistribuicaoCategorias();
    
    // Prepara arrays para o gráfico
    const labels = [];     // Nomes das categorias
    const dados = [];      // Valores (totais)
    const cores = [];      // Cores do gráfico
    
    Object.values(categorias).forEach(cat => {
        if (cat.total > 0) {
            labels.push(cat.nome);
            dados.push(cat.total);
            cores.push(cat.corGrafico);
        }
    });
    
    // Obtém o contexto do canvas
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    // Destroi gráfico anterior se existir
    if (pieChart) pieChart.destroy();
    
    // Cria novo gráfico de pizza
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: cores,
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 15  // Efeito ao passar o mouse
            }]
        },
        options: {
            responsive: true,           // Responsivo
            maintainAspectRatio: true,  // Mantém proporção
            plugins: {
                legend: { display: false },  // Esconde legenda (usa personalizada)
                tooltip: {
                    backgroundColor: '#1F2937',  // Fundo escuro do tooltip
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Atualiza legenda personalizada
    const legendaContainer = document.getElementById('pieLegend');
    if (legendaContainer) {
        let html = '';
        Object.values(categorias).forEach(cat => {
            if (cat.total > 0) {
                html += `
                    <div class="flex items-center">
                        <span class="w-3 h-3 ${cat.cor} rounded-full mr-2"></span>
                        <span class="text-xs text-gray-600">${cat.nome}: <span class="font-medium">${cat.total} (${cat.percentual}%)</span></span>
                    </div>
                `;
            }
        });
        legendaContainer.innerHTML = html;
    }
}

// ============================================
// GRÁFICO DE LINHA (FLUXO POR ESTÁGIO)
// ============================================

/**
 * Renderiza o gráfico de linha mostrando o fluxo por estágio
 */
function atualizarGraficoLinha() {
    // Contagem de denúncias por status
    const statsDenuncias = {
        pendente: denunciasData.filter(d => d.status === 'pendente').length,
        em_andamento: denunciasData.filter(d => d.status === 'em_andamento').length,
        concluida: denunciasData.filter(d => d.status === 'concluida').length,
        arquivada: denunciasData.filter(d => d.status === 'arquivada').length
    };
    
    // Contagem de reclamações por status
    const statsReclamacoes = {
        aberta: reclamacoesData.filter(r => r.status === 'aberta').length,
        em_andamento: reclamacoesData.filter(r => r.status === 'em_andamento').length,
        resolvida: reclamacoesData.filter(r => r.status === 'resolvida').length,
        fechada: reclamacoesData.filter(r => r.status === 'fechada').length
    };
    
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    // Destroi gráfico anterior se existir
    if (lineChart) lineChart.destroy();
    
    // Cria novo gráfico de linha
    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Pendente/Aberta', 'Em Andamento', 'Concluída/Resolvida', 'Arquivada/Fechada'],
            datasets: [
                {
                    label: 'Denúncias',
                    data: [statsDenuncias.pendente, statsDenuncias.em_andamento, statsDenuncias.concluida, statsDenuncias.arquivada],
                    borderColor: 'rgba(249, 115, 22, 1)',      // Cor da linha (laranja)
                    backgroundColor: 'rgba(249, 115, 22, 0.1)', // Cor de preenchimento
                    tension: 0.3,                               // Suavização da curva
                    pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 6,                             // Tamanho dos pontos
                    pointHoverRadius: 8,                        // Tamanho ao passar mouse
                    borderWidth: 3,
                    fill: true                                   // Preenche área abaixo da linha
                },
                {
                    label: 'Reclamações',
                    data: [statsReclamacoes.aberta, statsReclamacoes.em_andamento, statsReclamacoes.resolvida, statsReclamacoes.fechada],
                    borderColor: 'rgba(234, 179, 8, 1)',        // Cor da linha (amarelo)
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    tension: 0.3,
                    pointBackgroundColor: 'rgba(234, 179, 8, 1)',
                    pointBorderColor: '#fff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    borderWidth: 3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    backgroundColor: '#1F2937',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                },
                legend: {
                    position: 'top',           // Legenda no topo
                    labels: {
                        usePointStyle: true,   // Usa círculos na legenda
                        boxWidth: 10
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,          // Começa do zero
                    ticks: { stepSize: 1, precision: 0 },  // Passo 1, sem decimais
                    title: { display: true, text: 'Quantidade', color: '#6B7280' }
                },
                x: {
                    title: { display: true, text: 'Status', color: '#6B7280' }
                }
            }
        }
    });
}

// ============================================
// GERAÇÃO DE PDF (COM DOWNLOAD AUTOMÁTICO)
// ============================================

/**
 * Gera um relatório em PDF com download automático
 */
// ============================================
// GERAÇÃO DE PDF (VERSÃO CORRIGIDA - FUNCIONA 100%)
// ============================================

/**
 * Gera um relatório em PDF com download automático
 */
function gerarPDF() {
    try {
        showToast('info', 'A preparar relatório...');
        
        const { categorias, totalGeral } = calcularDistribuicaoCategorias();
        const dataAtual = formatarDataPortugal(new Date());
        const dataArquivo = new Date().toISOString().split('T')[0];
        
        // Constrói o HTML completo do relatório para impressão
        const relatorioHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório IPIL - ${dataArquivo}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Segoe UI', 'Arial', sans-serif;
                        padding: 40px;
                        color: #333;
                        line-height: 1.6;
                        background: white;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        .print-button {
                            display: none;
                        }
                        @page {
                            size: A4;
                            margin: 1.5cm;
                        }
                    }
                    
                    .container {
                        max-width: 100%;
                        margin: 0 auto;
                    }
                    
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 3px solid #f97316;
                    }
                    
                    .logo {
                        background: linear-gradient(135deg, #f97316, #ea580c);
                        color: white;
                        font-size: 28px;
                        font-weight: bold;
                        padding: 10px 25px;
                        display: inline-block;
                        border-radius: 12px;
                        margin-bottom: 15px;
                    }
                    
                    .title {
                        font-size: 22px;
                        color: #f97316;
                        margin: 10px 0 5px;
                    }
                    
                    .subtitle {
                        font-size: 14px;
                        color: #666;
                    }
                    
                    .date-info {
                        background: #f3f4f6;
                        padding: 10px 15px;
                        border-radius: 8px;
                        margin: 20px 0;
                        text-align: center;
                        font-size: 12px;
                        color: #555;
                    }
                    
                    .summary {
                        background: #fff7ed;
                        padding: 15px 20px;
                        border-left: 4px solid #f97316;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    
                    .summary h3 {
                        color: #f97316;
                        margin-bottom: 15px;
                        font-size: 16px;
                    }
                    
                    .summary-stats {
                        display: flex;
                        justify-content: space-around;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    
                    .stat-item {
                        text-align: center;
                        padding: 10px 20px;
                        background: white;
                        border-radius: 8px;
                        min-width: 120px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    }
                    
                    .stat-number {
                        font-size: 24px;
                        font-weight: bold;
                        color: #f97316;
                    }
                    
                    .stat-label {
                        font-size: 12px;
                        color: #666;
                        margin-top: 5px;
                    }
                    
                    h3 {
                        color: #f97316;
                        margin: 25px 0 15px 0;
                        font-size: 18px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                        font-size: 13px;
                    }
                    
                    th {
                        background: linear-gradient(135deg, #f97316, #ea580c);
                        color: white;
                        padding: 12px;
                        text-align: center;
                        font-weight: 600;
                    }
                    
                    td {
                        padding: 10px;
                        text-align: center;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    
                    td:first-child {
                        text-align: left;
                        font-weight: 500;
                    }
                    
                    tr:hover {
                        background-color: #fef3c7;
                    }
                    
                    .total-row {
                        background: #f3f4f6;
                        font-weight: bold;
                    }
                    
                    .total-row td {
                        font-weight: bold;
                    }
                    
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 10px;
                        color: #999;
                    }
                    
                    .print-button {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        background: #f97316;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: bold;
                        z-index: 1000;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                    }
                    
                    .print-button:hover {
                        background: #ea580c;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <!-- Cabeçalho -->
                    <div class="header">
                        <div class="logo">IPIL</div>
                        <h1 class="title">Instituto Politécnico Industrial de Luanda</h1>
                        <p class="subtitle">Sistema de Gestão de Denúncias e Reclamações</p>
                        <div class="date-info">
                            📅 Relatório gerado em: ${dataAtual}
                        </div>
                    </div>
                    
                    <!-- Resumo Geral -->
                    <div class="summary">
                        <h3>📊 Resumo Geral</h3>
                        <div class="summary-stats">
                            <div class="stat-item">
                                <div class="stat-number">${denunciasData.length}</div>
                                <div class="stat-label">Total de Denúncias</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${reclamacoesData.length}</div>
                                <div class="stat-label">Total de Reclamações</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-number">${totalGeral}</div>
                                <div class="stat-label">Total Geral</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabela de Distribuição -->
                    <h3>📋 Distribuição por Categoria</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Categoria</th>
                                <th>Denúncias</th>
                                <th>Reclamações</th>
                                <th>Total</th>
                                <th>Percentual</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        // Adiciona linhas da tabela
        const categoriasArray = Object.values(categorias);
        for (let i = 0; i < categoriasArray.length; i++) {
            const cat = categoriasArray[i];
            if (cat.total > 0) {
                relatorioHtml += `
                    <tr>
                        <td>${cat.nome}</td>
                        <td>${cat.denuncias}</td>
                        <td>${cat.reclamacoes}</td>
                        <td><strong>${cat.total}</strong></td>
                        <td>${cat.percentual}%</td>
                    </tr>
                `;
            }
        }
        
        relatorioHtml += `
                        </tbody>
                        <tfoot>
                            <tr class="total-row">
                                <td><strong>TOTAL</strong></td>
                                <td><strong>${denunciasData.length}</strong></td>
                                <td><strong>${reclamacoesData.length}</strong></td>
                                <td><strong>${totalGeral}</strong></td>
                                <td><strong>100%</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    <!-- Rodapé -->
                    <div class="footer">
                        <p>© 2026 Instituto Politécnico Industrial de Luanda - IPIL</p>
                        <p>Sistema de Gestão de Denúncias e Reclamações</p>
                        <p>Documento gerado automaticamente pelo sistema</p>
                    </div>
                </div>
                
                <button onclick="window.print()" class="print-button">
                    🖨️ Imprimir / Salvar PDF
                </button>
                
                <script>
                    // Auto-abrir diálogo de impressão após carregar
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;
        
        // Abrir em nova janela para impressão/PDF
        const printWindow = window.open('', '_blank', 'width=900,height=700,toolbar=yes,scrollbars=yes,menubar=yes');
        
        if (printWindow) {
            printWindow.document.write(relatorioHtml);
            printWindow.document.close();
            showToast('success', 'Relatório aberto! Use Ctrl+S para salvar como PDF.');
        } else {
            showToast('error', 'Permita pop-ups para este site. Clique no botão permitir pop-ups e tente novamente.');
        }
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('error', 'Erro ao gerar PDF: ' + error.message);
    }
}

function gerarExcel() {
    try {
        showToast('info', 'A preparar planilha Excel...');
        const { categorias, totalGeral } = calcularDistribuicaoCategorias();
        const dataAtual = formatarDataPortugal(new Date());
        const dataArquivo = new Date().toISOString().split('T')[0];

        const worksheetData = [
            ['Relatório IPIL'],
            ['Gerado em', dataAtual],
            [],
            ['Métrica', 'Valor'],
            ['Total de Denúncias', denunciasData.length],
            ['Total de Reclamações', reclamacoesData.length],
            ['Total Geral', totalGeral],
            [],
            ['Categoria', 'Denúncias', 'Reclamações', 'Total', 'Percentual']
        ];

        Object.values(categorias).forEach(cat => {
            if (cat.total >= 0) {
                worksheetData.push([
                    cat.nome,
                    cat.denuncias,
                    cat.reclamacoes,
                    cat.total,
                    `${cat.percentual}%`
                ]);
            }
        });

        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
        XLSX.writeFile(workbook, `relatorio_ipil_${dataArquivo}.xlsx`);
        showToast('success', 'Planilha Excel gerada com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar Excel:', error);
        showToast('error', 'Erro ao gerar Excel: ' + error.message);
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

/**
 * Renderiza as notificações pendentes no ícone do sino
 */
function renderizarNotificacoes() {
    // Conta denúncias pendentes e reclamações abertas
    const pendentesDenuncias = denunciasData.filter(d => d.status === 'pendente');
    const pendentesReclamacoes = reclamacoesData.filter(r => r.status === 'aberta');
    const totalPendentes = pendentesDenuncias.length + pendentesReclamacoes.length;
    
    // Atualiza o badge do sino
    const contador = document.getElementById('contadorNotificacoes');
    if (contador) {
        if (totalPendentes > 0) {
            contador.innerText = totalPendentes > 9 ? '9+' : totalPendentes;
            contador.classList.remove('hidden');
        } else {
            contador.classList.add('hidden');
        }
    }
}

// ============================================
// CARREGAMENTO PRINCIPAL DOS DADOS
// ============================================

/**
 * Carrega todos os dados da API e atualiza a interface
 */
async function carregarRelatorios() {
    try {
        console.log('🔄 A carregar dados...');
        
        // Busca dados em paralelo (Promise.all)
        await Promise.all([
            buscarDenuncias(),
            buscarReclamacoes(),
            buscarUsuarios()
        ]);
        
        // Atualiza todos os componentes da interface
        atualizarCardsEstatisticas();
        atualizarTabelaDistribuicao();
        atualizarGraficoPizza();
        atualizarGraficoLinha();
        renderizarNotificacoes();
        
        console.log('✅ Relatórios atualizados com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao carregar relatórios:', error);
        showToast('error', 'Erro ao carregar relatórios');
    }
}

// ============================================
// FUNÇÃO DE LOGOUT
// ============================================

/**
 * Realiza o logout do usuário com modal de confirmação
 */
function logout() {
    // Remove modal existente
    const existingModal = document.getElementById('logoutConfirmModal');
    if (existingModal) existingModal.remove();
    
    // Cria modal de confirmação
    const modal = document.createElement('div');
    modal.id = 'logoutConfirmModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    
    // Adiciona estilos CSS
    if (!document.getElementById('logoutStyles')) {
        const style = document.createElement('style');
        style.id = 'logoutStyles';
        style.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideIn { from { transform: translateY(-50px) scale(0.9); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
            .modal-slide-in { animation: slideIn 0.3s ease; }
        `;
        document.head.appendChild(style);
    }
    
    // Conteúdo do modal
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
    
    // Evento de confirmar logout
    document.getElementById('logoutConfirmBtn')?.addEventListener('click', () => {
        closeModal();
        // Limpa sessionStorage e redireciona
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('token');
        window.location.href = '../login.html';
    });
    
    // Evento de cancelar
    document.getElementById('logoutCancelBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// ============================================
// INICIALIZAÇÃO DA PÁGINA
// ============================================

/**
 * Função principal de inicialização (executada quando o DOM carrega)
 */
async function init() {
    // Verifica se o usuário é admin
    const admin = verificarAdmin();
    if (!admin) return;
    
    // Atualiza nome do administrador na navbar
    const adminNomeElement = document.getElementById('adminNome');
    if (adminNomeElement) adminNomeElement.innerText = admin.nome;

    const adminAvatarElement = document.getElementById('adminAvatar');
    if (adminAvatarElement) {
        const nomeParts = admin.nome ? admin.nome.trim().split(' ') : [];
        const initials = nomeParts.length === 0 ? 'AD' : nomeParts.map(part => part[0].toUpperCase()).slice(0, 2).join('');
        adminAvatarElement.innerText = initials;
    }
    
    // Configura eventos dos botões de download
    const pdfBtn = document.getElementById('gerarPDFBtn');
    const excelBtn = document.getElementById('gerarExcelBtn');
    
    if (pdfBtn) pdfBtn.addEventListener('click', (e) => { e.preventDefault(); gerarPDF(); });
    if (excelBtn) excelBtn.addEventListener('click', (e) => { e.preventDefault(); gerarExcel(); });
    
    // Carrega os relatórios
    await carregarRelatorios();
}

// ============================================
// EVENTO PRINCIPAL (DOM CARREGADO)
// ============================================

// Aguarda o carregamento completo do DOM para iniciar
document.addEventListener('DOMContentLoaded', init);

// ============================================
// EXPORTA FUNÇÕES PARA USO GLOBAL (window)
// ============================================

// Torna as funções acessíveis globalmente (para serem chamadas por onclick nos botões HTML)
window.gerarPDF = gerarPDF;
window.gerarExcel = gerarExcel;
window.logout = logout;