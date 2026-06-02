// configuracoes.js - Script da página de Configurações do Administrador

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let configuracoes = {};
let backupInterval = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    verificarAdmin();
    await carregarConfiguracoes();
    configurarEventos();
    carregarContadores();
    inicializarBackupAutomatico();
    carregarLogsAtividade();
    
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
    
    // Preview de categorias
    atualizarPreviewCategorias();
    atualizarMenuAtivo();
});

// ============================================
function atualizarMenuAtivo() {
    const path = window.location.pathname.toLowerCase();
    document.querySelectorAll('aside a.nav-link').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (path.endsWith(href.toLowerCase())) {
            link.classList.add('menu-active');
        } else {
            link.classList.remove('menu-active');
        }
    });
}

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
        showToast('⛔ Acesso Negado! Apenas administradores.', 'error');
        setTimeout(() => {
            window.location.href = '../usuario/dashboard.html';
        }, 2000);
        return null;
    }
    
    const adminNomeElement = document.getElementById('adminNome');
    if (adminNomeElement) adminNomeElement.innerText = usuario.nome;
    
    // Atualizar avatar
    const adminAvatar = document.getElementById('adminAvatar');
    if (adminAvatar) {
        const partes = usuario.nome.trim().split(/\s+/).filter(Boolean);
        const iniciais = partes.length > 1
            ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
            : partes[0].substring(0, 2).toUpperCase();
        adminAvatar.innerText = iniciais;
    }
    
    return usuario;
}

// ============================================
// APLICAR MODO MANUTENÇÃO (CORRIGIDO)
// ============================================

function aplicarModoManutencao(ativar) {
    // Só aplica o modo manutenção se estiver explicitamente ativado
    // e não estiver na página de configurações para evitar loop
    const isConfigPage = window.location.pathname.includes('configuracoes.html');
    
    if (ativar && !isConfigPage) {
        let overlay = document.getElementById('manutencaoOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'manutencaoOverlay';
            overlay.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center';
            overlay.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-md text-center">
                    <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-tools text-orange-600 text-3xl"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">Sistema em Manutenção</h2>
                    <p class="text-gray-600 mb-4" id="manutencaoMensagem">${configuracoes.mensagemManutencao || 'Sistema em manutenção. Voltaremos em breve!'}</p>
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        }
    } else {
        const overlay = document.getElementById('manutencaoOverlay');
        if (overlay) overlay.remove();
    }
}

// ============================================
// CARREGAR CONTADORES PARA BADGES
// ============================================

async function carregarContadores() {
    try {
        const [denunciasRes, reclamacoesRes, usuariosRes] = await Promise.all([
            fetch('/api/denuncias'),
            fetch('/api/reclamacoes'),
            fetch('/api/usuarios')
        ]);
        
        const denuncias = await denunciasRes.json();
        const reclamacoes = await reclamacoesRes.json();
        const usuarios = await usuariosRes.json();
        
        const totalDenuncias = Array.isArray(denuncias) ? denuncias.length : (denuncias.data?.length || 0);
        const totalReclamacoes = Array.isArray(reclamacoes) ? reclamacoes.length : (reclamacoes.data?.length || 0);
        const totalUsuarios = Array.isArray(usuarios) ? usuarios.length : (usuarios.data?.length || 0);
        
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
// CARREGAR CONFIGURAÇÕES (CORRIGIDO - SEM ATIVAR MANUTENÇÃO)
// ============================================

async function carregarConfiguracoes() {
    const savedConfig = localStorage.getItem('sistema_configuracoes');
    
    if (savedConfig) {
        configuracoes = JSON.parse(savedConfig);
    } else {
        configuracoes = {
            versao: '2.0.0',
            nomeSistema: 'IPIL - Sistema de Reclamações e Denúncias',
            modoManutencao: false,
            mensagemManutencao: '🛠️ Sistema em manutenção programada. Pedimos desculpa pelo incómodo. Voltaremos em breve!',
            
            maxTentativasLogin: 5,
            tempoBloqueioMinutos: 30,
            forcaSenha: 'media',
            twoFactor: false,
            logsAtividade: true,
            
            maxAnexoTamanhoMB: 5,
            maxAnexosPorSubmissao: 5,
            tiposArquivoPermitidos: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
            
            prazoRespostaDenuncias: 48,
            prazoRespostaReclamacoes: 24,
            arquivamentoAutomaticoDias: 90,
            exclusaoAutomaticaDias: 365,
            
            notificarNovasDenuncias: true,
            notificarNovasReclamacoes: true,
            notificarNovosUsuarios: false,
            
            categoriasDenuncias: ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
            categoriasReclamacoes: ['Infraestrutura', 'Saúde', 'Educação', 'Meio Ambiente', 'Segurança', 'Saneamento', 'Outro'],
            
            backupAutomatico: true,
            frequenciaBackup: 'weekly',
            horarioBackup: '02:00',
            ultimoBackup: null
        };
    }

    try {
        const response = await fetch('/api/configuracoes');
        if (response.ok) {
            const body = await response.json();
            if (body.success && body.data) {
                configuracoes = { ...configuracoes, ...body.data };
                localStorage.setItem('sistema_configuracoes', JSON.stringify(configuracoes));
            }
        }
    } catch (error) {
        console.log('Backend de configurações não disponível, usando valores locais.');
    }
    
    aplicarConfiguracoesFormulario();
    
    // Mostrar/Esconder mensagem de manutenção no formulário
    const mensagemDiv = document.getElementById('mensagemManutencaoDiv');
    if (configuracoes.modoManutencao) {
        if (mensagemDiv) mensagemDiv.classList.remove('hidden');
        // NÃO ativar o overlay aqui! Só quando salvar e se não estiver na página de config
    } else {
        if (mensagemDiv) mensagemDiv.classList.add('hidden');
    }
    
    console.log('✅ Configurações carregadas. Modo manutenção:', configuracoes.modoManutencao);
}

// ============================================
// APLICAR CONFIGURAÇÕES AO FORMULÁRIO
// ============================================

function aplicarConfiguracoesFormulario() {
    const elementos = {
        nomeSistema: configuracoes.nomeSistema || '',
        modoManutencao: configuracoes.modoManutencao || false,
        mensagemManutencao: configuracoes.mensagemManutencao || '',
        maxTentativas: configuracoes.maxTentativasLogin || 5,
        tempoBloqueio: configuracoes.tempoBloqueioMinutos || 30,
        forcaSenha: configuracoes.forcaSenha || 'media',
        twoFactor: configuracoes.twoFactor || false,
        logsAtividade: configuracoes.logsAtividade !== false,
        maxAnexoTamanho: configuracoes.maxAnexoTamanhoMB || 5,
        maxAnexos: configuracoes.maxAnexosPorSubmissao || 5,
        prazoDenuncias: configuracoes.prazoRespostaDenuncias || 48,
        prazoReclamacoes: configuracoes.prazoRespostaReclamacoes || 24,
        arquivamentoAutomatico: configuracoes.arquivamentoAutomaticoDias || 90,
        exclusaoAutomatica: configuracoes.exclusaoAutomaticaDias || 365,
        notifDenuncias: configuracoes.notificarNovasDenuncias !== false,
        notifReclamacoes: configuracoes.notificarNovasReclamacoes !== false,
        notifUsuarios: configuracoes.notificarNovosUsuarios || false,
        backupAutomatico: configuracoes.backupAutomatico || false,
        frequenciaBackup: configuracoes.frequenciaBackup || 'weekly',
        horarioBackup: configuracoes.horarioBackup || '02:00'
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            if (elemento.type === 'checkbox') {
                elemento.checked = valor;
            } else {
                elemento.value = valor;
            }
        }
    }
    
    if (configuracoes.tiposArquivoPermitidos) {
        document.querySelectorAll('.tipoArquivo').forEach(checkbox => {
            checkbox.checked = configuracoes.tiposArquivoPermitidos.includes(checkbox.value);
        });
    }
    
    if (configuracoes.categoriasDenuncias) {
        renderizarCategorias('denuncia', configuracoes.categoriasDenuncias);
    }
    if (configuracoes.categoriasReclamacoes) {
        renderizarCategorias('reclamacao', configuracoes.categoriasReclamacoes);
    }
    
    const ultimoBackupInfo = document.getElementById('ultimoBackupInfo');
    if (ultimoBackupInfo && configuracoes.ultimoBackup) {
        const dataBackup = new Date(configuracoes.ultimoBackup);
        ultimoBackupInfo.innerHTML = `<i class="fas fa-clock mr-1"></i>Último backup: ${dataBackup.toLocaleString('pt-PT')}`;
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
        div.className = 'flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition';
        div.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas fa-tag text-orange-500 text-sm"></i>
                <span class="text-gray-700">${escapeHtml(cat)}</span>
            </div>
            <button type="button" onclick="removerCategoria('${tipo}', '${escapeHtml(cat)}')" class="text-red-500 hover:text-red-700 transition">
                <i class="fas fa-trash-alt"></i>
            </button>
        `;
        container.appendChild(div);
    });
    
    atualizarPreviewCategorias();
}

// ============================================
// ADICIONAR CATEGORIA
// ============================================

function adicionarCategoria(tipo) {
    const inputId = `novaCategoria${tipo === 'denuncia' ? 'Denuncia' : 'Reclamacao'}`;
    const input = document.getElementById(inputId);
    const novaCategoria = input.value.trim();
    
    if (!novaCategoria) {
        showToast('⚠️ Digite o nome da categoria', 'warning');
        return;
    }
    
    if (novaCategoria.length < 3) {
        showToast('⚠️ A categoria deve ter no mínimo 3 caracteres', 'warning');
        return;
    }
    
    const categoriasArray = tipo === 'denuncia' ? configuracoes.categoriasDenuncias : configuracoes.categoriasReclamacoes;
    
    if (categoriasArray.includes(novaCategoria)) {
        showToast('❌ Esta categoria já existe!', 'error');
        return;
    }
    
    categoriasArray.push(novaCategoria);
    renderizarCategorias(tipo, categoriasArray);
    input.value = '';
    showToast('✅ Categoria adicionada com sucesso!', 'success');
    salvarConfiguracoes();
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
        showToast('✅ Categoria removida com sucesso!', 'success');
        salvarConfiguracoes();
    }
}

// ============================================
// ATUALIZAR PREVIEW DAS CATEGORIAS
// ============================================

function atualizarPreviewCategorias() {
    const previewDenuncias = document.getElementById('previewCategoriasDenuncias');
    const previewReclamacoes = document.getElementById('previewCategoriasReclamacoes');
    
    if (previewDenuncias && configuracoes.categoriasDenuncias) {
        previewDenuncias.innerHTML = configuracoes.categoriasDenuncias.map(cat => 
            `<span class="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs mr-1 mb-1">${escapeHtml(cat)}</span>`
        ).join('');
    }
    
    if (previewReclamacoes && configuracoes.categoriasReclamacoes) {
        previewReclamacoes.innerHTML = configuracoes.categoriasReclamacoes.map(cat => 
            `<span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs mr-1 mb-1">${escapeHtml(cat)}</span>`
        ).join('');
    }
}

// ============================================
// SALVAR CONFIGURAÇÕES (CORRIGIDO)
// ============================================

async function salvarConfiguracoes(event) {
    if (event) event.preventDefault();
    
    const tiposArquivo = [];
    document.querySelectorAll('.tipoArquivo:checked').forEach(checkbox => {
        tiposArquivo.push(checkbox.value);
    });
    
    const novoModoManutencao = document.getElementById('modoManutencao')?.checked || false;
    const modoManutencaoAnterior = configuracoes.modoManutencao;
    
    const novasConfiguracoes = {
        ...configuracoes,
        nomeSistema: document.getElementById('nomeSistema')?.value || '',
        modoManutencao: novoModoManutencao,
        mensagemManutencao: document.getElementById('mensagemManutencao')?.value || '',
        maxTentativasLogin: parseInt(document.getElementById('maxTentativas')?.value) || 5,
        tempoBloqueioMinutos: parseInt(document.getElementById('tempoBloqueio')?.value) || 30,
        forcaSenha: document.getElementById('forcaSenha')?.value || 'media',
        twoFactor: document.getElementById('twoFactor')?.checked || false,
        logsAtividade: document.getElementById('logsAtividade')?.checked || false,
        maxAnexoTamanhoMB: parseInt(document.getElementById('maxAnexoTamanho')?.value) || 5,
        maxAnexosPorSubmissao: parseInt(document.getElementById('maxAnexos')?.value) || 5,
        tiposArquivoPermitidos: tiposArquivo,
        prazoRespostaDenuncias: parseInt(document.getElementById('prazoDenuncias')?.value) || 48,
        prazoRespostaReclamacoes: parseInt(document.getElementById('prazoReclamacoes')?.value) || 24,
        arquivamentoAutomaticoDias: parseInt(document.getElementById('arquivamentoAutomatico')?.value) || 90,
        exclusaoAutomaticaDias: parseInt(document.getElementById('exclusaoAutomatica')?.value) || 365,
        notificarNovasDenuncias: document.getElementById('notifDenuncias')?.checked || false,
        notificarNovasReclamacoes: document.getElementById('notifReclamacoes')?.checked || false,
        notificarNovosUsuarios: document.getElementById('notifUsuarios')?.checked || false,
        backupAutomatico: document.getElementById('backupAutomatico')?.checked || false,
        frequenciaBackup: document.getElementById('frequenciaBackup')?.value || 'weekly',
        horarioBackup: document.getElementById('horarioBackup')?.value || '02:00'
    };
    
    configuracoes = novasConfiguracoes;
    localStorage.setItem('sistema_configuracoes', JSON.stringify(configuracoes));
    
    // Enviar para o backend se existir endpoint
    try {
        await fetch('/api/configuracoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configuracoes)
        });
    } catch (error) {
        console.log('Backend de configurações não disponível, salvando apenas localmente');
    }
    
    // Só aplicar o modo manutenção se mudou e se NÃO estiver na página de configurações
    if (novoModoManutencao !== modoManutencaoAnterior) {
        const isConfigPage = window.location.pathname.includes('configuracoes.html');
        if (!isConfigPage) {
            aplicarModoManutencao(novoModoManutencao);
        }
    }
    
    inicializarBackupAutomatico();
    
    showToast('✅ Configurações salvas com sucesso!', 'success');
    registrarLog(`Configurações atualizadas - Modo manutenção: ${novoModoManutencao ? 'ATIVADO' : 'DESATIVADO'}`);
}

// ============================================
// REGISTRAR LOG DE ATIVIDADE
// ============================================

function registrarLog(acao) {
    const usuario = JSON.parse(sessionStorage.getItem('usuarioLogado') || '{}');
    const logs = JSON.parse(localStorage.getItem('sistema_logs') || '[]');
    logs.unshift({
        data: new Date().toISOString(),
        acao: acao,
        usuario: usuario.nome || 'Administrador',
        ip: '127.0.0.1'
    });
    
    if (logs.length > 1000) logs.pop();
    localStorage.setItem('sistema_logs', JSON.stringify(logs));
}

// ============================================
// CARREGAR LOGS DE ATIVIDADE
// ============================================

function carregarLogsAtividade() {
    const logsContainer = document.getElementById('logsAtividadeContainer');
    if (!logsContainer) return;
    
    const logs = JSON.parse(localStorage.getItem('sistema_logs') || '[]');
    const logsRecentes = logs.slice(0, 10);
    
    if (logsRecentes.length === 0) {
        logsContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhuma atividade registrada</div>';
        return;
    }
    
    logsContainer.innerHTML = logsRecentes.map(log => `
        <div class="flex items-start space-x-3 p-3 border-b border-gray-100 hover:bg-gray-50">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-history text-blue-600 text-xs"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-800">${escapeHtml(log.acao)}</p>
                <p class="text-xs text-gray-500">${new Date(log.data).toLocaleString('pt-PT')} • ${escapeHtml(log.usuario)}</p>
            </div>
        </div>
    `).join('');
}

// ============================================
// RESETAR CONFIGURAÇÕES
// ============================================

function resetConfiguracoes() {
    showConfirmDialog(
        'Restaurar Configurações',
        'Tem certeza que deseja restaurar todas as configurações para o padrão?',
        () => {
            localStorage.removeItem('sistema_configuracoes');
            carregarConfiguracoes();
            showToast('✅ Configurações restauradas para o padrão!', 'success');
            registrarLog('Configurações restauradas para padrão');
        }
    );
}

// ============================================
// GERAR BACKUP
// ============================================

async function gerarBackup() {
    const data = new Date();
    const dataStr = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
    
    let denuncias = [], reclamacoes = [], usuarios = [];
    try {
        [denuncias, reclamacoes, usuarios] = await Promise.all([
            fetch('/api/denuncias').then(r => r.json()),
            fetch('/api/reclamacoes').then(r => r.json()),
            fetch('/api/usuarios').then(r => r.json())
        ]);
    } catch (error) {
        console.log('Erro ao buscar dados para backup');
    }
    
    const backup = {
        data: data.toISOString(),
        versao: '2.0.0',
        configuracoes: configuracoes,
        estatisticas: {
            totalDenuncias: Array.isArray(denuncias) ? denuncias.length : 0,
            totalReclamacoes: Array.isArray(reclamacoes) ? reclamacoes.length : 0,
            totalUsuarios: Array.isArray(usuarios) ? usuarios.length : 0
        },
        timestamp: Date.now()
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
    
    configuracoes.ultimoBackup = data.toISOString();
    localStorage.setItem('sistema_configuracoes', JSON.stringify(configuracoes));
    
    showToast('✅ Backup gerado com sucesso!', 'success');
    registrarLog('Backup manual gerado');
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
                    showConfirmDialog(
                        'Restaurar Backup',
                        'Isso substituirá todas as configurações atuais. Deseja continuar?',
                        () => {
                            localStorage.setItem('sistema_configuracoes', JSON.stringify(backup.configuracoes));
                            carregarConfiguracoes();
                            showToast('✅ Backup restaurado com sucesso!', 'success');
                            registrarLog('Backup restaurado');
                        }
                    );
                } else {
                    showToast('❌ Arquivo de backup inválido!', 'error');
                }
            } catch (error) {
                showToast('❌ Erro ao ler o arquivo de backup!', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ============================================
// BACKUP AUTOMÁTICO
// ============================================

function inicializarBackupAutomatico() {
    if (backupInterval) clearInterval(backupInterval);
    if (!configuracoes.backupAutomatico) return;
    
    let intervaloMs = 24 * 60 * 60 * 1000;
    switch(configuracoes.frequenciaBackup) {
        case 'daily': intervaloMs = 24 * 60 * 60 * 1000; break;
        case 'weekly': intervaloMs = 7 * 24 * 60 * 60 * 1000; break;
        case 'monthly': intervaloMs = 30 * 24 * 60 * 60 * 1000; break;
    }
    
    const agora = new Date();
    const [horaBackup, minutoBackup] = configuracoes.horarioBackup.split(':').map(Number);
    const proximoBackup = new Date(agora);
    proximoBackup.setHours(horaBackup, minutoBackup, 0, 0);
    
    if (proximoBackup <= agora) proximoBackup.setDate(proximoBackup.getDate() + 1);
    
    setTimeout(() => {
        realizarBackupAutomatico();
        backupInterval = setInterval(realizarBackupAutomatico, intervaloMs);
    }, proximoBackup - agora);
}

function realizarBackupAutomatico() {
    const backup = {
        data: new Date().toISOString(),
        versao: '2.0.0',
        configuracoes: configuracoes,
        tipo: 'automatico'
    };
    
    const backups = JSON.parse(localStorage.getItem('sistema_backups') || '[]');
    backups.unshift(backup);
    if (backups.length > 10) backups.pop();
    localStorage.setItem('sistema_backups', JSON.stringify(backups));
    
    configuracoes.ultimoBackup = new Date().toISOString();
    localStorage.setItem('sistema_configuracoes', JSON.stringify(configuracoes));
    
    console.log('🔄 Backup automático realizado em:', new Date().toLocaleString('pt-PT'));
}

// ============================================
// EXPORTAR LOGS
// ============================================

function exportarLogs() {
    const logs = JSON.parse(localStorage.getItem('sistema_logs') || '[]');
    const data = new Date();
    const dataStr = `${data.getFullYear()}-${String(data.getMonth()+1).padStart(2,'0')}-${String(data.getDate()).padStart(2,'0')}`;
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs_ipil_${dataStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('✅ Logs exportados com sucesso!', 'success');
}

// ============================================
// LIMPAR CACHE
// ============================================

function limparCache() {
    showConfirmDialog(
        'Limpar Cache',
        'Isso limpará todos os dados temporários e logs. Deseja continuar?',
        () => {
            localStorage.removeItem('sistema_logs');
            localStorage.removeItem('sistema_backups');
            showToast('✅ Cache limpo com sucesso!', 'success');
            registrarLog('Cache do sistema limpo');
            carregarLogsAtividade();
        }
    );
}

// ============================================
// CONFIRM DIALOG
// ============================================

function showConfirmDialog(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div class="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <i class="fas fa-question-circle text-orange-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-white">${title}</h3>
                </div>
            </div>
            <div class="px-6 py-6">
                <p class="text-gray-600">${message}</p>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button id="confirmCancelBtn" class="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition">
                    Cancelar
                </button>
                <button id="confirmOkBtn" class="px-5 py-2 bg-orange-500 text-white rounded-lg transition hover:bg-orange-600">
                    Confirmar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('confirmCancelBtn')?.addEventListener('click', () => modal.remove());
    document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
        onConfirm();
        modal.remove();
    });
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
    toast.className = `custom-toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${current.bg} text-white`;
    toast.style.animation = 'slideInRight 0.3s ease';
    toast.innerHTML = `<i class="fas ${current.icon} mr-2"></i>${message}`;
    
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
// CONFIGURAR EVENTOS
// ============================================

function configurarEventos() {
    const form = document.getElementById('configForm');
    if (form) form.addEventListener('submit', salvarConfiguracoes);
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    showConfirmDialog('Sair do Sistema', 'Tem certeza que deseja sair?', () => {
        sessionStorage.removeItem('usuarioLogado');
        sessionStorage.removeItem('token');
        window.location.href = '../login.html';
    });
}

// ============================================
// EXPORTAR FUNÇÕES
// ============================================

window.adicionarCategoria = adicionarCategoria;
window.removerCategoria = removerCategoria;
window.resetConfiguracoes = resetConfiguracoes;
window.gerarBackup = gerarBackup;
window.restaurarBackup = restaurarBackup;
window.exportarLogs = exportarLogs;
window.limparCache = limparCache;
window.logout = logout;