// configuracoes.js - Script da página de Configurações

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let configuracoes = {};

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    verificarAdmin();
    carregarConfiguracoes();
    configurarEventos();
    
    // Mostrar/Esconder campo de mensagem de manutenção
    const modoManutencao = document.getElementById('modoManutencao');
    const mensagemDiv = document.getElementById('mensagemManutencaoDiv');
    
    if (modoManutencao) {
        modoManutencao.addEventListener('change', function() {
            if (this.checked) {
                mensagemDiv.classList.remove('hidden');
            } else {
                mensagemDiv.classList.add('hidden');
            }
        });
    }
    
    // Carregar contadores para badges
    carregarContadores();
});

// ============================================
// VERIFICAR ADMIN
// ============================================

function verificarAdmin() {
    const usuarioLogado = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogado) {
        window.location.href = '../login.html';
        return null;
    }
    
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== 'admin') {
        showToast('Acesso Negado! Apenas administradores.', 'error');
        setTimeout(() => {
            window.location.href = '../usuario/dashboard.html';
        }, 2000);
        return null;
    }
    
    const adminNomeElement = document.getElementById('adminNome');
    if (adminNomeElement) adminNomeElement.innerText = usuario.nome;
    return usuario;
}

// ============================================
// CARREGAR CONTADORES PARA BADGES
// ============================================

async function carregarContadores() {
    try {
        const denunciasResponse = await fetch('http://localhost:3000/api/denuncias');
        const denuncias = await denunciasResponse.json();
        const totalDenuncias = Array.isArray(denuncias) ? denuncias.length : 0;
        
        const reclamacoesResponse = await fetch('http://localhost:3000/api/reclamacoes');
        const reclamacoes = await reclamacoesResponse.json();
        const totalReclamacoes = Array.isArray(reclamacoes) ? reclamacoes.length : 0;
        
        const usuariosResponse = await fetch('http://localhost:3000/api/usuarios');
        const usuarios = await usuariosResponse.json();
        const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : 0;
        
        const badgeDenuncias = document.getElementById('badgeDenuncias');
        const badgeReclamacoes = document.getElementById('badgeReclamacoes');
        const badgeUsuarios = document.getElementById('badgeUsuarios');
        
        if (badgeDenuncias) badgeDenuncias.innerText = totalDenuncias;
        if (badgeReclamacoes) badgeReclamacoes.innerText = totalReclamacoes;
        if (badgeUsuarios) badgeUsuarios.innerText = totalUsuarios;
        
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
    }
}

// ============================================
// CARREGAR CONFIGURAÇÕES DO LOCALSTORAGE
// ============================================

function carregarConfiguracoes() {
    // Carregar do localStorage ou usar valores padrão
    const savedConfig = localStorage.getItem('sistema_configuracoes');
    
    if (savedConfig) {
        configuracoes = JSON.parse(savedConfig);
    } else {
        // Configurações padrão
        configuracoes = {
            nomeSistema: 'IPIL - Sistema de Reclamações e Denúncias',
            modoManutencao: false,
            mensagemManutencao: 'Sistema em manutenção. Pedimos desculpa pelo incómodo. Voltaremos em breve!',
            maxTentativas: '5',
            tempoBloqueio: '30',
            forcaSenha: 'media',
            twoFactor: false,
            logsAtividade: true,
            maxAnexoTamanho: '5',
            maxAnexos: '5',
            tiposArquivo: ['jpg', 'png', 'pdf', 'doc'],
            prazoDenuncias: 48,
            prazoReclamacoes: 24,
            arquivamentoAutomatico: '90',
            exclusaoAutomatica: '0',
            notifDenuncias: true,
            notifReclamacoes: true,
            notifUsuarios: false,
            categoriasDenuncias: ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
            categoriasReclamacoes: ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
            frequenciaBackup: 'weekly',
            horarioBackup: '02:00'
        };
    }
    
    // Aplicar configurações aos campos do formulário
    document.getElementById('nomeSistema').value = configuracoes.nomeSistema || '';
    document.getElementById('modoManutencao').checked = configuracoes.modoManutencao || false;
    document.getElementById('mensagemManutencao').value = configuracoes.mensagemManutencao || '';
    document.getElementById('maxTentativas').value = configuracoes.maxTentativas || '5';
    document.getElementById('tempoBloqueio').value = configuracoes.tempoBloqueio || '30';
    document.getElementById('forcaSenha').value = configuracoes.forcaSenha || 'media';
    document.getElementById('twoFactor').checked = configuracoes.twoFactor || false;
    document.getElementById('logsAtividade').checked = configuracoes.logsAtividade !== false;
    document.getElementById('maxAnexoTamanho').value = configuracoes.maxAnexoTamanho || '5';
    document.getElementById('maxAnexos').value = configuracoes.maxAnexos || '5';
    document.getElementById('prazoDenuncias').value = configuracoes.prazoDenuncias || 48;
    document.getElementById('prazoReclamacoes').value = configuracoes.prazoReclamacoes || 24;
    document.getElementById('arquivamentoAutomatico').value = configuracoes.arquivamentoAutomatico || '90';
    document.getElementById('exclusaoAutomatica').value = configuracoes.exclusaoAutomatica || '0';
    document.getElementById('notifDenuncias').checked = configuracoes.notifDenuncias !== false;
    document.getElementById('notifReclamacoes').checked = configuracoes.notifReclamacoes !== false;
    document.getElementById('notifUsuarios').checked = configuracoes.notifUsuarios || false;
    document.getElementById('frequenciaBackup').value = configuracoes.frequenciaBackup || 'weekly';
    document.getElementById('horarioBackup').value = configuracoes.horarioBackup || '02:00';
    
    // Configurar tipos de arquivo
    if (configuracoes.tiposArquivo) {
        document.querySelectorAll('.tipoArquivo').forEach(checkbox => {
            checkbox.checked = configuracoes.tiposArquivo.includes(checkbox.value);
        });
    }
    
    // Configurar categorias
    if (configuracoes.categoriasDenuncias) {
        renderizarCategorias('denuncia', configuracoes.categoriasDenuncias);
    }
    if (configuracoes.categoriasReclamacoes) {
        renderizarCategorias('reclamacao', configuracoes.categoriasReclamacoes);
    }
    
    // Mostrar/Esconder mensagem de manutenção
    const mensagemDiv = document.getElementById('mensagemManutencaoDiv');
    if (configuracoes.modoManutencao) {
        mensagemDiv.classList.remove('hidden');
    } else {
        mensagemDiv.classList.add('hidden');
    }
}

// ============================================
// RENDERIZAR CATEGORIAS
// ============================================

function renderizarCategorias(tipo, categorias) {
    const container = document.getElementById(`categorias${tipo === 'denuncia' ? 'Denuncias' : 'Reclamacoes'}`);
    if (!container) return;
    
    container.innerHTML = '';
    categorias.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-2 bg-gray-50 rounded-lg';
        div.innerHTML = `
            <span>${escapeHtml(cat)}</span>
            <button type="button" onclick="removerCategoria('${tipo}', '${escapeHtml(cat)}')" class="text-red-500 hover:text-red-700">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

// ============================================
// ADICIONAR CATEGORIA
// ============================================

function adicionarCategoria(tipo) {
    const inputId = `novaCategoria${tipo === 'denuncia' ? 'Denuncia' : 'Reclamacao'}`;
    const input = document.getElementById(inputId);
    const novaCategoria = input.value.trim();
    
    if (!novaCategoria) {
        showToast('Digite o nome da categoria', 'warning');
        return;
    }
    
    const categoriasArray = tipo === 'denuncia' ? configuracoes.categoriasDenuncias : configuracoes.categoriasReclamacoes;
    
    if (categoriasArray.includes(novaCategoria)) {
        showToast('Esta categoria já existe!', 'warning');
        return;
    }
    
    categoriasArray.push(novaCategoria);
    renderizarCategorias(tipo, categoriasArray);
    input.value = '';
    showToast('Categoria adicionada com sucesso!', 'success');
}

// ============================================
// REMOVER CATEGORIA
// ============================================

function removerCategoria(tipo, categoria) {
    const categoriasArray = tipo === 'denuncia' ? configuracoes.categoriasDenuncias : configuracoes.categoriasReclamacoes;
    const index = categoriasArray.indexOf(categoria);
    
    if (index > -1) {
        categoriasArray.splice(index, 1);
        renderizarCategorias(tipo, categoriasArray);
        showToast('Categoria removida!', 'success');
    }
}

// ============================================
// SALVAR CONFIGURAÇÕES
// ============================================

function salvarConfiguracoes(event) {
    if (event) event.preventDefault();
    
    // Coletar tipos de arquivo
    const tiposArquivo = [];
    document.querySelectorAll('.tipoArquivo:checked').forEach(checkbox => {
        tiposArquivo.push(checkbox.value);
    });
    
    // Atualizar objeto de configurações
    configuracoes = {
        nomeSistema: document.getElementById('nomeSistema').value,
        modoManutencao: document.getElementById('modoManutencao').checked,
        mensagemManutencao: document.getElementById('mensagemManutencao').value,
        maxTentativas: document.getElementById('maxTentativas').value,
        tempoBloqueio: document.getElementById('tempoBloqueio').value,
        forcaSenha: document.getElementById('forcaSenha').value,
        twoFactor: document.getElementById('twoFactor').checked,
        logsAtividade: document.getElementById('logsAtividade').checked,
        maxAnexoTamanho: document.getElementById('maxAnexoTamanho').value,
        maxAnexos: document.getElementById('maxAnexos').value,
        tiposArquivo: tiposArquivo,
        prazoDenuncias: parseInt(document.getElementById('prazoDenuncias').value),
        prazoReclamacoes: parseInt(document.getElementById('prazoReclamacoes').value),
        arquivamentoAutomatico: document.getElementById('arquivamentoAutomatico').value,
        exclusaoAutomatica: document.getElementById('exclusaoAutomatica').value,
        notifDenuncias: document.getElementById('notifDenuncias').checked,
        notifReclamacoes: document.getElementById('notifReclamacoes').checked,
        notifUsuarios: document.getElementById('notifUsuarios').checked,
        categoriasDenuncias: configuracoes.categoriasDenuncias || ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
        categoriasReclamacoes: configuracoes.categoriasReclamacoes || ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
        frequenciaBackup: document.getElementById('frequenciaBackup').value,
        horarioBackup: document.getElementById('horarioBackup').value
    };
    
    // Salvar no localStorage
    localStorage.setItem('sistema_configuracoes', JSON.stringify(configuracoes));
    
    showToast('Configurações salvas com sucesso!', 'success');
    console.log('Configurações salvas:', configuracoes);
}

// ============================================
// RESETAR CONFIGURAÇÕES PARA PADRÃO
// ============================================

function resetConfiguracoes() {
    if (confirm('Tem certeza que deseja restaurar todas as configurações para o padrão?')) {
        localStorage.removeItem('sistema_configuracoes');
        carregarConfiguracoes();
        showToast('Configurações restauradas para o padrão!', 'success');
    }
}

// ============================================
// GERAR BACKUP
// ============================================

function gerarBackup() {
    const data = new Date();
    const dataStr = `${data.getFullYear()}-${data.getMonth()+1}-${data.getDate()}`;
    
    const backup = {
        data: data.toISOString(),
        configuracoes: configuracoes,
        versao: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_ipil_${dataStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Backup gerado com sucesso!', 'success');
}

// ============================================
// RESTAURAR BACKUP
// ============================================

function restaurarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                if (backup.configuracoes) {
                    localStorage.setItem('sistema_configuracoes', JSON.stringify(backup.configuracoes));
                    carregarConfiguracoes();
                    showToast('Backup restaurado com sucesso!', 'success');
                } else {
                    showToast('Arquivo de backup inválido!', 'error');
                }
            } catch (error) {
                showToast('Erro ao ler o arquivo de backup!', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// CONFIGURAR EVENTOS
// ============================================

function configurarEventos() {
    const form = document.getElementById('configForm');
    if (form) {
        form.addEventListener('submit', salvarConfiguracoes);
    }
}

// ============================================
// TOAST DE NOTIFICAÇÃO
// ============================================

function showToast(message, type = 'success') {
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const config = {
        success: { icon: 'fa-check-circle', bg: 'bg-green-500' },
        error: { icon: 'fa-exclamation-circle', bg: 'bg-red-500' },
        warning: { icon: 'fa-exclamation-triangle', bg: 'bg-yellow-500' },
        info: { icon: 'fa-info-circle', bg: 'bg-blue-500' }
    };
    
    const current = config[type] || config.success;
    
    const toast = document.createElement('div');
    toast.className = `custom-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${current.bg} text-white toast-slide-in`;
    toast.innerHTML = `<i class="fas ${current.icon} mr-2"></i>${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// ESCAPE HTML
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    if (confirm('Tem certeza que deseja sair do sistema?')) {
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('token');
        window.location.href = '../login.html';
    }
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.adicionarCategoria = adicionarCategoria;
window.removerCategoria = removerCategoria;
window.resetConfiguracoes = resetConfiguracoes;
window.gerarBackup = gerarBackup;
window.restaurarBackup = restaurarBackup;
window.logout = logout;