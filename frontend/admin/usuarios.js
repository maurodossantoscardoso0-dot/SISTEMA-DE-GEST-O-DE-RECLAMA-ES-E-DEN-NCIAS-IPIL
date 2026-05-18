// ============================================
// USUÁRIOS.JS - GESTÃO DE USUÁRIOS (PAINEL ADMIN)
// VERSÃO COMPLETA COM DATAS CORRIGIDAS E PROTEÇÃO DO ADMIN
// ============================================

let usuariosData = [];
let usuariosFiltrados = [];
let usuarioAdminAtual = null;

// ============================================
// FUNÇÕES DE FORMATAÇÃO DE DATAS CORRIGIDAS
// ============================================

/**
 * Formata data do MySQL/PostgreSQL para DD/MM/YYYY
 * Suporta: created_at, updated_at, ultimo_acesso, ano_nascimento
 */
function formatarDataAdmin(data) {
    if (!data) return 'Data não informada';
    
    try {
        // Se for string no formato DD/MM/YYYY (já formatada)
        if (typeof data === 'string' && data.includes('/')) {
            return data;
        }
        
        // Se for string ISO (YYYY-MM-DDTHH:MM:SS)
        if (typeof data === 'string' && data.includes('T')) {
            const [dataParte] = data.split('T');
            const [ano, mes, dia] = dataParte.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        // Se for string no formato YYYY-MM-DD
        if (typeof data === 'string' && data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        // Se for objeto Date
        const date = new Date(data);
        if (isNaN(date.getTime())) {
            console.warn('Data inválida:', data);
            return 'Data inválida';
        }
        
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear();
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
}

/**
 * Formata data e hora para exibição completa
 * Exemplo: 15/05/2026 às 14:30
 */
function formatarDataHoraAdmin(data) {
    if (!data) return 'Data não informada';
    
    try {
        // Se for string ISO (YYYY-MM-DDTHH:MM:SS)
        if (typeof data === 'string' && data.includes('T')) {
            const [dataParte, horaParte] = data.split('T');
            const [ano, mes, dia] = dataParte.split('-');
            const [horas, minutos] = horaParte.split(':');
            return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
        }
        
        // Se for string no formato YYYY-MM-DD (sem hora)
        if (typeof data === 'string' && data.includes('-') && !data.includes('T')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        // Se for objeto Date
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear();
        const horas = date.getHours().toString().padStart(2, '0');
        const minutos = date.getMinutes().toString().padStart(2, '0');
        
        return `${dia}/${mes}/${ano} às ${horas}:${minutos}`;
    } catch (error) {
        console.error('Erro ao formatar data/hora:', error);
        return 'Data inválida';
    }
}

/**
 * Formata data de nascimento (ano_nascimento)
 */
function formatarDataNascimento(data) {
    if (!data) return 'Não informada';
    
    try {
        if (typeof data === 'string' && data.includes('/')) {
            return data;
        }
        
        if (typeof data === 'string' && data.includes('-')) {
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        const date = new Date(data);
        if (isNaN(date.getTime())) return 'Data inválida';
        
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear();
        
        if (ano < 1900 || ano > 2030) return 'Data inválida';
        
        return `${dia}/${mes}/${ano}`;
    } catch (error) {
        return 'Data inválida';
    }
}

// ============================================
// MODAL PERSONALIZADO
// ============================================
function showModal(type, title, message, onConfirm = null, inputRequired = false) {
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
            .fade-out { opacity: 0; transition: opacity 0.5s; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .animate-spin { animation: spin 1s linear infinite; }
        `;
        document.head.appendChild(style);
    }
    
    let inputHtml = '';
    if (inputRequired) {
        inputHtml = `
            <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Digite "CONFIRMAR" para prosseguir:</label>
                <input type="text" id="confirmInput" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="CONFIRMAR">
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
                <p class="text-gray-600 text-base whitespace-pre-line">${message}</p>
                ${inputHtml}
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
    };
    
    if (type === 'confirm') {
        document.getElementById('modalConfirmBtn')?.addEventListener('click', () => {
            let value = true;
            if (inputRequired) {
                const input = document.getElementById('confirmInput');
                value = input && input.value === 'CONFIRMAR';
            }
            closeModal();
            if (onConfirm) onConfirm(value);
        });
        document.getElementById('modalCancelBtn')?.addEventListener('click', () => {
            closeModal();
            if (onConfirm) onConfirm(false);
        });
    } else {
        document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
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
// VERIFICAR ADMINISTRADOR
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
    usuarioAdminAtual = usuario;
    const adminNome = document.getElementById('adminNome');
    if (adminNome) adminNome.innerText = usuario.nome;
    return usuario;
}

// ============================================
// VERIFICAR SE É O PRÓPRIO ADMIN
// ============================================
function isProprioAdmin(usuarioId, usuarioNome) {
    if (usuarioAdminAtual && usuarioAdminAtual.id === usuarioId) {
        showModal('warning', 'Ação Bloqueada', `⚠️ Você não pode realizar esta ação no seu próprio usuário (${usuarioNome}).\n\nEsta é uma medida de segurança para proteger a conta do administrador.`);
        return true;
    }
    return false;
}

// ============================================
// BUSCAR USUÁRIOS
// ============================================
async function buscarUsuarios() {
    try {
        const response = await fetch('http://localhost:3000/api/usuarios');
        const data = await response.json();
        usuariosData = Array.isArray(data) ? data : [];
        return usuariosData;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showToast('error', 'Erro ao carregar usuários');
        return [];
    }
}

// ============================================
// BUSCAR ESTATÍSTICAS DO USUÁRIO
// ============================================
async function buscarEstatisticasUsuario(usuarioId) {
    try {
        const [denunciasRes, reclamacoesRes] = await Promise.all([
            fetch(`http://localhost:3000/api/denuncias/usuario/${usuarioId}`),
            fetch(`http://localhost:3000/api/reclamacoes/usuario/${usuarioId}`)
        ]);
        
        const denuncias = denunciasRes.ok ? await denunciasRes.json() : [];
        const reclamacoes = reclamacoesRes.ok ? await reclamacoesRes.json() : [];
        
        return {
            denuncias: Array.isArray(denuncias) ? denuncias : [],
            reclamacoes: Array.isArray(reclamacoes) ? reclamacoes : []
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return { denuncias: [], reclamacoes: [] };
    }
}

// ============================================
// EXCLUIR USUÁRIO COMPLETO (COM PROTEÇÃO DO ADMIN)
// ============================================
async function excluirUsuarioCompleto(id, nome) {
    if (isProprioAdmin(id, nome)) return;
    
    const estatisticas = await buscarEstatisticasUsuario(id);
    const totalDenuncias = estatisticas.denuncias.length;
    const totalReclamacoes = estatisticas.reclamacoes.length;
    
    let mensagem = `⚠️ EXCLUSÃO PERMANENTE ⚠️\n\n`;
    mensagem += `Usuário: "${nome}"\n\n`;
    mensagem += `📊 DADOS QUE SERÃO EXCLUÍDOS:\n`;
    mensagem += `• Conta do usuário\n`;
    mensagem += `• ${totalDenuncias} denúncia(s)\n`;
    mensagem += `• ${totalReclamacoes} reclamação(ões)\n\n`;
    mensagem += `⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!\n\n`;
    mensagem += `Digite "CONFIRMAR" para prosseguir:`;
    
    showModal('confirm', '⚠️ Confirmação de Exclusão', mensagem, async (confirmado) => {
        if (!confirmado) {
            showToast('info', 'Exclusão cancelada');
            return;
        }
        
        showToast('info', `Excluindo ${nome}...`);
        
        try {
            const response = await fetch(`http://localhost:3000/api/usuarios/${id}/completo`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const resultado = await response.json();
            
            if (response.ok && resultado.success) {
                showToast('success', resultado.message);
                await carregarUsuarios();
            } else {
                showToast('error', resultado.error || 'Erro ao excluir');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('error', 'Erro ao conectar ao servidor');
        }
    }, true);
}

// ============================================
// BLOQUEAR USUÁRIO (COM PROTEÇÃO DO ADMIN)
// ============================================
async function bloquearUsuario(id, nome) {
    if (isProprioAdmin(id, nome)) return;
    
    showModal('confirm', '🔒 Bloquear Usuário', `Deseja bloquear o usuário "${nome}"?\n\nInforme o motivo do bloqueio:`, async (confirmado) => {
        if (!confirmado) return;
        
        const motivo = prompt('Informe o motivo do bloqueio:');
        if (motivo === null) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/usuarios/${id}/bloquear`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: 'bloqueado',
                    motivo_bloqueio: motivo || 'Motivo não informado',
                    bloqueado_por: usuarioAdminAtual?.nome || 'Administrador'
                })
            });
            
            const resultado = await response.json();
            
            if (response.ok && resultado.success) {
                showToast('success', `Usuário "${nome}" bloqueado!`);
                await carregarUsuarios();
            } else {
                showToast('error', resultado.error || 'Erro ao bloquear');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('error', 'Erro ao conectar');
        }
    });
}

// ============================================
// ATIVAR USUÁRIO (COM PROTEÇÃO DO ADMIN)
// ============================================
async function ativarUsuario(id, nome) {
    if (isProprioAdmin(id, nome)) return;
    
    showModal('confirm', '✅ Ativar Usuário', `Deseja ativar o usuário "${nome}"?`, async (confirmado) => {
        if (!confirmado) return;
        
        try {
            const response = await fetch(`http://localhost:3000/api/usuarios/${id}/ativar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ativo' })
            });
            
            const resultado = await response.json();
            
            if (response.ok && resultado.success) {
                showToast('success', `Usuário "${nome}" ativado!`);
                await carregarUsuarios();
            } else {
                showToast('error', resultado.error || 'Erro ao ativar');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('error', 'Erro ao conectar');
        }
    });
}

// ============================================
// VER DETALHES DO USUÁRIO (COM DATAS CORRIGIDAS)
// ============================================
async function verDetalhes(usuario) {
    const modal = document.getElementById('modalDetalhes');
    const modalConteudo = document.getElementById('modalConteudo');
    
    modalConteudo.innerHTML = `
        <div class="flex items-center justify-center py-8">
            <i class="fas fa-spinner text-orange-600 text-3xl animate-spin"></i>
            <p class="ml-3 text-gray-500">Carregando detalhes...</p>
        </div>
    `;
    modal.classList.remove('hidden');
    
    const estatisticas = await buscarEstatisticasUsuario(usuario.id);
    
    // FORMATAR DATAS CORRETAMENTE
    const dataCadastro = formatarDataHoraAdmin(usuario.createdAt || usuario.created_at);
    const dataAtualizacao = formatarDataHoraAdmin(usuario.updatedAt || usuario.updated_at);
    const dataNascimento = formatarDataNascimento(usuario.ano_nascimento);
    const ultimoAcesso = usuario.ultimo_acesso 
        ? formatarDataHoraAdmin(usuario.ultimo_acesso)
        : 'Nunca acessou';
    
    const statusCor = {
        'ativo': 'text-green-600 bg-green-100',
        'inativo': 'text-yellow-600 bg-yellow-100',
        'bloqueado': 'text-red-600 bg-red-100'
    };
    
    const statusTexto = {
        'ativo': 'Ativo',
        'inativo': 'Inativo',
        'bloqueado': 'Bloqueado'
    };
    
    const tipoCor = usuario.tipo === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
    const tipoTexto = usuario.tipo === 'admin' ? 'Administrador' : 'Aluno';
    const isAdminAtual = usuarioAdminAtual && usuarioAdminAtual.id === usuario.id;
    
    modalConteudo.innerHTML = `
        <div class="space-y-6 max-h-[80vh] overflow-y-auto">
            <!-- Informações Pessoais -->
            <div class="bg-gray-50 rounded-xl p-5">
                <h4 class="text-lg font-bold text-orange-600 mb-4 flex items-center">
                    <i class="fas fa-user mr-2"></i>
                    Informações Pessoais
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-500">Nome</p>
                        <p class="font-medium">${escapeHtml(usuario.nome)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Email</p>
                        <p class="font-medium">${escapeHtml(usuario.email)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Telefone</p>
                        <p class="font-medium">${usuario.telefone || 'Não informado'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Nº Processo</p>
                        <p class="font-medium">${usuario.numero_processo || 'Não informado'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Data de Nascimento</p>
                        <p class="font-medium">${dataNascimento}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Sexo</p>
                        <p class="font-medium">${usuario.sexo === 'masculino' ? 'Masculino' : usuario.sexo === 'feminino' ? 'Feminino' : 'Não informado'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Curso</p>
                        <p class="font-medium">${usuario.curso || 'Não informado'}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Classe/Turma/Sala</p>
                        <p class="font-medium">${usuario.classe || ''} ${usuario.turma || ''} ${usuario.sala ? `- Sala ${usuario.sala}` : ''}</p>
                    </div>
                </div>
            </div>
            
            <!-- Estatísticas -->
            <div class="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-5">
                <h4 class="text-lg font-bold text-orange-600 mb-4 flex items-center">
                    <i class="fas fa-chart-bar mr-2"></i>
                    Atividades do Usuário
                </h4>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white rounded-lg p-4 text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                        <p class="text-2xl font-bold">${estatisticas.denuncias.length}</p>
                        <p class="text-sm text-gray-600">Denúncias</p>
                    </div>
                    <div class="bg-white rounded-lg p-4 text-center">
                        <i class="fas fa-flag text-yellow-500 text-3xl mb-2"></i>
                        <p class="text-2xl font-bold">${estatisticas.reclamacoes.length}</p>
                        <p class="text-sm text-gray-600">Reclamações</p>
                    </div>
                </div>
            </div>
            
            <!-- Status -->
            <div class="bg-gray-50 rounded-xl p-5">
                <h4 class="text-lg font-bold text-orange-600 mb-4 flex items-center">
                    <i class="fas fa-shield-alt mr-2"></i>
                    Status da Conta
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs text-gray-500">Tipo</p>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${tipoCor}">${tipoTexto}</span>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500">Status</p>
                        <span class="px-2 py-1 rounded-full text-xs font-medium ${statusCor[usuario.status]}">
                            <i class="fas ${usuario.status === 'ativo' ? 'fa-check-circle' : usuario.status === 'inativo' ? 'fa-pause-circle' : 'fa-ban'} mr-1"></i>
                            ${statusTexto[usuario.status]}
                        </span>
                    </div>
                    ${usuario.motivo_bloqueio ? `
                    <div class="md:col-span-2">
                        <p class="text-xs text-gray-500">Motivo do Bloqueio</p>
                        <p class="text-sm text-red-600 bg-red-50 p-2 rounded-lg mt-1">${escapeHtml(usuario.motivo_bloqueio)}</p>
                        ${usuario.bloqueado_por ? `<p class="text-xs text-gray-500 mt-1">Bloqueado por: ${escapeHtml(usuario.bloqueado_por)}</p>` : ''}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Informações do Sistema (DATAS CORRIGIDAS) -->
            <div class="bg-gray-50 rounded-xl p-5">
                <h4 class="text-lg font-bold text-orange-600 mb-4 flex items-center">
                    <i class="fas fa-clock mr-2"></i>
                    Informações do Sistema
                </h4>
                <div class="space-y-2">
                    <div class="flex justify-between p-2 bg-white rounded">
                        <span class="text-sm text-gray-600">Data de Cadastro:</span>
                        <span class="font-medium text-gray-800">${dataCadastro}</span>
                    </div>
                    <div class="flex justify-between p-2 bg-white rounded">
                        <span class="text-sm text-gray-600">Última Atualização:</span>
                        <span class="font-medium text-gray-800">${dataAtualizacao}</span>
                    </div>
                    <div class="flex justify-between p-2 bg-white rounded">
                        <span class="text-sm text-gray-600">Último Acesso:</span>
                        <span class="font-medium text-gray-800">${ultimoAcesso}</span>
                    </div>
                    <div class="flex justify-between p-2 bg-white rounded">
                        <span class="text-sm text-gray-600">ID do Usuário:</span>
                        <span class="font-mono text-sm text-gray-800">#${usuario.id}</span>
                    </div>
                </div>
            </div>
            
            <!-- Botões de ação -->
            ${!isAdminAtual ? `
            <div class="flex gap-3 justify-end">
                ${usuario.status === 'ativo' ? `
                <button onclick="bloquearUsuario(${usuario.id}, '${escapeHtml(usuario.nome)}'); fecharModal();" 
                        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                    <i class="fas fa-ban mr-2"></i>Bloquear
                </button>
                ` : usuario.status === 'bloqueado' ? `
                <button onclick="ativarUsuario(${usuario.id}, '${escapeHtml(usuario.nome)}'); fecharModal();" 
                        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                    <i class="fas fa-check-circle mr-2"></i>Ativar
                </button>
                ` : ''}
                <button onclick="excluirUsuarioCompleto(${usuario.id}, '${escapeHtml(usuario.nome)}'); fecharModal();" 
                        class="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition">
                    <i class="fas fa-trash-alt mr-2"></i>Excluir Permanentemente
                </button>
            </div>
            ` : `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <i class="fas fa-shield-alt text-yellow-600 text-2xl mb-2 block"></i>
                <p class="text-sm text-yellow-700">Esta é a sua conta. Para sua segurança, você não pode bloquear ou excluir seu próprio usuário.</p>
            </div>
            `}
        </div>
    `;
}

// ============================================
// RENDERIZAR LISTA DE USUÁRIOS (COM DATA DE CADASTRO)
// ============================================
function renderizarUsuarios(usuarios) {
    const container = document.getElementById('listaUsuarios');
    const totalSpan = document.getElementById('totalUsuariosTexto');
    const badgeUsuarios = document.getElementById('badgeUsuarios');
    
    if (totalSpan) totalSpan.innerText = `${usuarios.length} usuário(s) cadastrado(s)`;
    if (badgeUsuarios) badgeUsuarios.innerText = usuarios.length;
    
    if (usuarios.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-md p-12 text-center">
                <i class="fas fa-users-slash text-gray-300 text-6xl mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-500">Nenhum usuário encontrado</h3>
                <p class="text-gray-400 mt-2">Não há usuários cadastrados no momento.</p>
            </div>
        `;
        return;
    }
    
    const statusCores = {
        'ativo': 'text-green-600 bg-green-100',
        'inativo': 'text-yellow-600 bg-yellow-100',
        'bloqueado': 'text-red-600 bg-red-100'
    };
    
    const statusTextos = {
        'ativo': 'Ativo',
        'inativo': 'Inativo',
        'bloqueado': 'Bloqueado'
    };
    
    let html = '';
    
    usuarios.forEach(usuario => {
        const dataCadastro = formatarDataAdmin(usuario.createdAt || usuario.created_at);
        const borderColor = usuario.tipo === 'admin' ? 'border-purple-500' : 'border-orange-500';
        const iconColor = usuario.tipo === 'admin' ? 'text-purple-500' : 'text-orange-500';
        const tipoBadge = usuario.tipo === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
        const tipoTexto = usuario.tipo === 'admin' ? 'Administrador' : 'Aluno';
        const isAdminAtual = usuarioAdminAtual && usuarioAdminAtual.id === usuario.id;
        
        html += `
            <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border-t-4 ${borderColor}">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2 mb-3">
                            <h3 class="text-lg font-bold text-gray-800 flex items-center">
                                <i class="fas fa-user-circle ${iconColor} mr-2 text-xl"></i>
                                ${escapeHtml(usuario.nome)}
                                ${isAdminAtual ? '<span class="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">(Você)</span>' : ''}
                            </h3>
                            <span class="px-2 py-1 text-xs rounded-full ${tipoBadge}">${tipoTexto}</span>
                            <span class="px-2 py-1 text-xs rounded-full ${statusCores[usuario.status]}">
                                <i class="fas ${usuario.status === 'ativo' ? 'fa-check-circle' : usuario.status === 'inativo' ? 'fa-pause-circle' : 'fa-ban'} mr-1"></i>
                                ${statusTextos[usuario.status]}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                            <div class="flex items-center space-x-2 text-gray-600">
                                <i class="fas fa-envelope ${iconColor} w-4"></i>
                                <span class="text-gray-500">Email:</span>
                                <span class="text-gray-800 font-medium truncate">${escapeHtml(usuario.email)}</span>
                            </div>
                            <div class="flex items-center space-x-2 text-gray-600">
                                <i class="fas fa-phone ${iconColor} w-4"></i>
                                <span class="text-gray-500">Telefone:</span>
                                <span class="text-gray-800 font-medium">${usuario.telefone || 'Não informado'}</span>
                            </div>
                            <div class="flex items-center space-x-2 text-gray-600">
                                <i class="fas fa-calendar-alt ${iconColor} w-4"></i>
                                <span class="text-gray-500">Cadastro:</span>
                                <span class="text-gray-800 font-medium">${dataCadastro}</span>
                            </div>
                        </div>
                        
                        ${usuario.motivo_bloqueio ? `
                        <div class="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                            <i class="fas fa-info-circle mr-1"></i>
                            Motivo: ${escapeHtml(usuario.motivo_bloqueio)}
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="flex items-center space-x-2">
                        <button onclick='verDetalhes(${JSON.stringify(usuario)})' 
                                class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Ver detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        ${!isAdminAtual ? `
                            ${usuario.status === 'ativo' ? `
                            <button onclick="bloquearUsuario(${usuario.id}, '${escapeHtml(usuario.nome)}')" 
                                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Bloquear">
                                <i class="fas fa-ban"></i>
                            </button>
                            ` : usuario.status === 'bloqueado' ? `
                            <button onclick="ativarUsuario(${usuario.id}, '${escapeHtml(usuario.nome)}')" 
                                    class="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Ativar">
                                <i class="fas fa-check-circle"></i>
                            </button>
                            ` : ''}
                            <button onclick="excluirUsuarioCompleto(${usuario.id}, '${escapeHtml(usuario.nome)}')" 
                                    class="p-2 text-red-800 hover:bg-red-100 rounded-lg transition" title="Excluir permanentemente">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        ` : `
                            <button class="p-2 text-gray-400 cursor-not-allowed" disabled title="Não é possível modificar sua própria conta">
                                <i class="fas fa-ban"></i>
                            </button>
                            <button class="p-2 text-gray-400 cursor-not-allowed" disabled title="Não é possível excluir sua própria conta">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ============================================
// FILTROS
// ============================================
function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFiltro = document.getElementById('filtroStatus').value;
    
    let filtrados = [...usuariosData];
    
    if (statusFiltro !== 'todos') {
        filtrados = filtrados.filter(u => u.status === statusFiltro);
    }
    
    if (searchTerm) {
        filtrados = filtrados.filter(u => 
            u.nome.toLowerCase().includes(searchTerm) ||
            u.email.toLowerCase().includes(searchTerm) ||
            (u.telefone && u.telefone.includes(searchTerm))
        );
    }
    
    usuariosFiltrados = filtrados;
    renderizarUsuarios(usuariosFiltrados);
}

function limparFiltros() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filtroStatus').value = 'todos';
    usuariosFiltrados = [...usuariosData];
    renderizarUsuarios(usuariosFiltrados);
    showToast('info', 'Filtros limpos!');
}

// ============================================
// UTILITÁRIOS
// ============================================
function fecharModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) modal.classList.add('hidden');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LOGOUT COM MODAL DE CONFIRMAÇÃO
// ============================================
function logout() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm';
    modal.style.animation = 'fadeIn 0.3s ease';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden" style="animation: slideIn 0.3s ease;">
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
                <p class="text-gray-700 text-base">Tem certeza que deseja sair do sistema?</p>
                <p class="text-gray-500 text-sm mt-2">Você será redirecionado para a página de login.</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button id="cancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">
                    <i class="fas fa-times mr-2"></i>Cancelar
                </button>
                <button id="confirmBtn" class="px-5 py-2 bg-orange-500 text-white rounded-lg transition transform hover:scale-105 font-medium">
                    <i class="fas fa-check mr-2"></i>Sair
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('confirmBtn')?.addEventListener('click', () => {
        showToast('success', 'Sessão encerrada com sucesso!');
        setTimeout(() => {
            sessionStorage.removeItem('usuarioLogado');
            sessionStorage.removeItem('token');
            window.location.href = '../login.html';
        }, 500);
        modal.remove();
    });
    document.getElementById('cancelBtn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ============================================
// CARREGAR DADOS
// ============================================
async function carregarUsuarios() {
    const container = document.getElementById('listaUsuarios');
    if (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <i class="fas fa-spinner text-orange-600 text-4xl animate-spin"></i>
                <p class="ml-3 text-gray-500">Carregando usuários...</p>
            </div>
        `;
    }
    
    await buscarUsuarios();
    usuariosFiltrados = [...usuariosData];
    renderizarUsuarios(usuariosFiltrados);
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const admin = verificarAdmin();
    if (!admin) return;
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', aplicarFiltros);
    }
    
    const filtroStatus = document.getElementById('filtroStatus');
    if (filtroStatus) {
        filtroStatus.addEventListener('change', aplicarFiltros);
    }
    
    carregarUsuarios();
});

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================
window.logout = logout;
window.verDetalhes = verDetalhes;
window.bloquearUsuario = bloquearUsuario;
window.ativarUsuario = ativarUsuario;
window.excluirUsuarioCompleto = excluirUsuarioCompleto;
window.fecharModal = fecharModal;
window.limparFiltros = limparFiltros;
window.aplicarFiltros = aplicarFiltros;