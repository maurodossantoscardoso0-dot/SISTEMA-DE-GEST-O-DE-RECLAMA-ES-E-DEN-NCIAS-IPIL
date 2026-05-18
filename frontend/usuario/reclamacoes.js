const API_URL = 'http://localhost:3000/api';
        let usuarioLogado = null;
        let reclamacoes = [];
        let reclamacoesFiltradas = [];

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

        async function carregarReclamacoes() {
            try {
                const response = await fetch(`${API_URL}/reclamacoes?usuario_id=${usuarioLogado.id}`);
                if (response.ok) {
                    reclamacoes = await response.json();
                    reclamacoesFiltradas = [...reclamacoes];
                    console.log(`✅ ${reclamacoes.length} reclamações carregadas`);
                } else {
                    throw new Error('Erro ao carregar reclamações');
                }
                atualizarInterface();
            } catch (error) {
                console.error('Erro:', error);
                reclamacoes = [];
                reclamacoesFiltradas = [];
                atualizarInterface();
                mostrarNotificacao('Erro ao carregar reclamações', 'error');
            }
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
            
            document.getElementById('reclamacoesCount').textContent = reclamacoes.length;
            document.getElementById('denunciasCount').textContent = Math.floor(reclamacoes.length / 2);
            
            const abertas = reclamacoes.filter(r => r.status === 'aberta').length;
            if (abertas > 0) {
                document.getElementById('notificationBadge').textContent = abertas;
                document.getElementById('notificationBadge').classList.remove('hidden');
            }
            
            renderizarReclamacoes();
        }

        function renderizarReclamacoes() {
            const lista = document.getElementById('reclamacoesList');
            const emptyState = document.getElementById('emptyState');
            
            if (reclamacoesFiltradas.length === 0) {
                lista.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }
            
            emptyState.classList.add('hidden');
            
            lista.innerHTML = reclamacoesFiltradas.map(reclamacao => `
                <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                    <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div class="flex-1">
                            <div class="flex items-start justify-between mb-3">
                                <h2 class="text-xl font-bold text-gray-800">${reclamacao.titulo}</h2>
                                <span class="lg:hidden inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(reclamacao.status)}">${translateStatus(reclamacao.status)}</span>
                            </div>
                            <p class="text-gray-600 mb-4">${reclamacao.descricao}</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div class="flex items-center space-x-2 text-gray-600"><i class="fas fa-hashtag w-4 text-gray-400"></i><span><span class="font-medium">Protocolo:</span> ${reclamacao.protocolo || 'N/A'}</span></div>
                                <div class="flex items-center space-x-2 text-gray-600"><i class="fas fa-tag w-4 text-gray-400"></i><span><span class="font-medium">Categoria:</span> ${reclamacao.categoria}</span></div>
                                <div class="flex items-center space-x-2 text-gray-600"><i class="fas fa-calendar-alt w-4 text-gray-400"></i><span><span class="font-medium">Data:</span> ${formatDate(reclamacao.data_ocorrencia)}</span></div>
                                <div class="flex items-center space-x-2 text-gray-600"><i class="fas fa-map-marker-alt w-4 text-gray-400"></i><span><span class="font-medium">Local:</span> ${reclamacao.local}</span></div>
                            </div>
                        </div>
                        <div class="hidden lg:flex flex-col items-end gap-3">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(reclamacao.status)}">
                                <span class="w-2 h-2 ${reclamacao.status === 'aberta' ? 'bg-yellow-500' : reclamacao.status === 'em_andamento' ? 'bg-blue-500' : 'bg-green-500'} rounded-full mr-2"></span>
                                ${translateStatus(reclamacao.status)}
                            </span>
                            <div class="flex space-x-2">
                                <button onclick="verDetalhes(${reclamacao.id})" class="p-2 text-gray-500 hover:text-orange-600 transition"><i class="fas fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="lg:hidden flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                        <button onclick="verDetalhes(${reclamacao.id})" class="text-gray-500 hover:text-orange-600 transition"><i class="fas fa-eye"></i></button>
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
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('bg-orange-500', 'text-white');
                btn.classList.add('bg-gray-100', 'text-gray-700');
            });
            event.target.classList.remove('bg-gray-100', 'text-gray-700');
            event.target.classList.add('bg-orange-500', 'text-white');
            
            renderizarReclamacoes();
        }

        function filtrarReclamacoes() {
            const termo = document.getElementById('searchInput').value.toLowerCase();
            if (!termo) {
                reclamacoesFiltradas = [...reclamacoes];
            } else {
                reclamacoesFiltradas = reclamacoes.filter(r => 
                    r.titulo.toLowerCase().includes(termo) ||
                    r.protocolo?.toLowerCase().includes(termo) ||
                    r.local.toLowerCase().includes(termo) ||
                    r.descricao.toLowerCase().includes(termo)
                );
            }
            renderizarReclamacoes();
        }

        function verDetalhes(id) {
            const reclamacao = reclamacoes.find(r => r.id === id);
            alert(`📋 RECLAMAÇÃO\n\nProtocolo: ${reclamacao.protocolo}\nTítulo: ${reclamacao.titulo}\nDescrição: ${reclamacao.descricao}\nStatus: ${translateStatus(reclamacao.status)}\nData: ${formatDate(reclamacao.data_ocorrencia)}\nLocal: ${reclamacao.local}`);
        }

        function mostrarNotificacao(mensagem, tipo) {
            const notification = document.createElement('div');
            notification.className = `fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce ${tipo === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
            notification.innerHTML = `<div class="flex items-center space-x-2"><i class="fas ${tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i><span>${mensagem}</span></div>`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
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
            await carregarReclamacoes();
        });

        window.logout = logout;
        window.verDetalhes = verDetalhes;
        window.filtrarReclamacoes = filtrarReclamacoes;
        window.filtrarPorStatus = filtrarPorStatus;