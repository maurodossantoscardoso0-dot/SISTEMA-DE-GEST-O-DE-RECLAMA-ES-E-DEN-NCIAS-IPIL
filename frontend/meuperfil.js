let usuarioLogado = null;
let dadosOriginais = {};

// CONFIGURAÇÕES DA API
const API_URL = 'http://localhost:3000/api';

// Função para obter token de autenticação
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Função para fazer requisições autenticadas
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || 'Erro na requisição');
        }
        
        return data;
    } catch (error) {
        console.error(`Erro na API (${endpoint}):`, error);
        throw error;
    }
}

// FUNÇÕES DE UTILITÁRIO

// Função para verificar autenticação
async function checkAuth() {
    const token = getAuthToken();
    const usuarioSession = sessionStorage.getItem('usuarioLogado');
    
    console.log('Verificando autenticação...');
    
    if (!token || !usuarioSession) {
        console.log('Token ou session não encontrado, redirecionando para login...');
        window.location.href = './login.html';
        return null;
    }
    
    let usuario = JSON.parse(usuarioSession);
    
    // Tentar buscar dados atualizados da API
    try {
        const userId = usuario.id || usuario.id_usuario;
        const response = await apiRequest(`/usuarios/${userId}`, {
            method: 'GET'
        });
        
        if (response.success && response.data) {
            usuarioLogado = response.data;
        } else if (response.id || response.id_usuario) {
            usuarioLogado = response;
        } else {
            usuarioLogado = usuario;
        }
        
        sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        return usuarioLogado;
        
    } catch (error) {
        console.error('Erro ao buscar dados da API, usando dados da session:', error);
        usuarioLogado = usuario;
        return usuarioLogado;
    }
}

// Função para obter iniciais do nome
function getInitials(nome) {
    if (!nome || nome.trim() === '') return 'U';
    
    const partes = nome.trim().split(' ');
    const nomePartes = partes.filter(parte => parte.length > 0);
    
    if (nomePartes.length === 0) return 'U';
    if (nomePartes.length === 1) {
        return nomePartes[0].substring(0, 2).toUpperCase();
    }
    
    const primeiraLetra = nomePartes[0].charAt(0);
    const ultimoNome = nomePartes[nomePartes.length - 1];
    const primeiraLetraSobrenome = ultimoNome.charAt(0);
    
    return (primeiraLetra + primeiraLetraSobrenome).toUpperCase();
}

// Função para obter apenas o primeiro nome
function getPrimeiroNome(nome) {
    if (!nome) return 'Usuário';
    return nome.split(' ')[0];
}

// Função para formatar data apenas (sem hora)
function formatDateOnly(data) {
    if (!data) return '';
    const date = new Date(data);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
}

// FUNÇÕES DE CONTADORES DINÂMICOS

// Função para carregar contadores de reclamações e denúncias
async function carregarContadores() {
    if (!usuarioLogado) {
        console.warn('Usuário não logado, não é possível carregar contadores');
        return;
    }
    
    const userId = usuarioLogado.id || usuarioLogado.id_usuario;
    console.log('Carregando contadores para usuário:', userId);
    
    try {
        let reclamacoesData = [];
        let denunciasData = [];
        
        try {
            const reclamacoes = await apiRequest(`/reclamacoes/minhas/${userId}`, {
                method: 'GET'
            });
            if (reclamacoes.success && reclamacoes.data) {
                reclamacoesData = reclamacoes.data;
            } else if (Array.isArray(reclamacoes)) {
                reclamacoesData = reclamacoes;
            }
        } catch (e) {
            console.log('Endpoint /minhas não encontrado, tentando /usuario');
        }
        
        if (reclamacoesData.length === 0) {
            try {
                const reclamacoes = await apiRequest(`/reclamacoes/usuario/${userId}`, {
                    method: 'GET'
                });
                if (reclamacoes.success && reclamacoes.data) {
                    reclamacoesData = reclamacoes.data;
                } else if (Array.isArray(reclamacoes)) {
                    reclamacoesData = reclamacoes;
                }
            } catch (e) {
                console.log('Endpoint /usuario não encontrado');
            }
        }
        
        try {
            const denuncias = await apiRequest(`/denuncias/minhas/${userId}`, {
                method: 'GET'
            });
            if (denuncias.success && denuncias.data) {
                denunciasData = denuncias.data;
            } else if (Array.isArray(denuncias)) {
                denunciasData = denuncias;
            }
        } catch (e) {
            console.log('Endpoint /minhas para denúncias não encontrado, tentando /usuario');
        }
        
        if (denunciasData.length === 0) {
            try {
                const denuncias = await apiRequest(`/denuncias/usuario/${userId}`, {
                    method: 'GET'
                });
                if (denuncias.success && denuncias.data) {
                    denunciasData = denuncias.data;
                } else if (Array.isArray(denuncias)) {
                    denunciasData = denuncias;
                }
            } catch (e) {
                console.log('Endpoint /usuario para denúncias não encontrado');
            }
        }
        
        const reclamacoesCount = document.getElementById('reclamacoesCount');
        const denunciasCount = document.getElementById('denunciasCount');
        
        const totalReclamacoes = reclamacoesData.length || 0;
        const totalDenuncias = denunciasData.length || 0;
        
        if (reclamacoesCount) {
            reclamacoesCount.textContent = totalReclamacoes;
            if (totalReclamacoes > 0) {
                reclamacoesCount.classList.add('bg-orange-500', 'text-white');
                reclamacoesCount.classList.remove('bg-gray-100', 'text-gray-600');
            } else {
                reclamacoesCount.classList.add('bg-gray-100', 'text-gray-600');
                reclamacoesCount.classList.remove('bg-orange-500', 'text-white');
            }
        }
        
        if (denunciasCount) {
            denunciasCount.textContent = totalDenuncias;
            if (totalDenuncias > 0) {
                denunciasCount.classList.add('bg-red-500', 'text-white');
                denunciasCount.classList.remove('bg-red-100', 'text-red-600');
            } else {
                denunciasCount.classList.add('bg-red-100', 'text-red-600');
                denunciasCount.classList.remove('bg-red-500', 'text-white');
            }
        }
        
        console.log(`Contadores atualizados: ${totalReclamacoes} reclamações, ${totalDenuncias} denúncias`);
        
        sessionStorage.setItem('contadoresReclamacoes', totalReclamacoes);
        sessionStorage.setItem('contadoresDenuncias', totalDenuncias);
        
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
        
        const cachedReclamacoes = sessionStorage.getItem('contadoresReclamacoes');
        const cachedDenuncias = sessionStorage.getItem('contadoresDenuncias');
        
        if (cachedReclamacoes) {
            const reclamacoesCount = document.getElementById('reclamacoesCount');
            if (reclamacoesCount) reclamacoesCount.textContent = cachedReclamacoes;
        }
        
        if (cachedDenuncias) {
            const denunciasCount = document.getElementById('denunciasCount');
            if (denunciasCount) denunciasCount.textContent = cachedDenuncias;
        }
    }
}

// Função para atualizar avatar globalmente
// Avatar rendering and modal are delegated to shared/profile.js
// Use the shared implementation if available: window.atualizarAvatarGlobal()

// FUNÇÕES DE CARREGAMENTO E ATUALIZAÇÃO

// Função para carregar dados do perfil
function carregarPerfil() {
    if (!usuarioLogado) {
        console.error('usuarioLogado não está definido em carregarPerfil');
        return;
    }
    
    const nomeCompleto = document.getElementById('nomeCompleto');
    const email = document.getElementById('email');
    const numeroProcesso = document.getElementById('numeroProcesso');
    const telefone = document.getElementById('telefone');
    const dataNascimento = document.getElementById('dataNascimento');
    const sexo = document.getElementById('sexo');
    const curso = document.getElementById('curso');
    const classe = document.getElementById('classe');
    const turma = document.getElementById('turma');
    const sala = document.getElementById('sala');
    const statusConta = document.getElementById('statusConta');
    
    if (nomeCompleto) nomeCompleto.value = usuarioLogado.nome || '';
    if (email) email.value = usuarioLogado.email || '';
    if (numeroProcesso) numeroProcesso.value = usuarioLogado.numero_processo || '';
    if (telefone) telefone.value = usuarioLogado.telefone || '';
    
    const dataNasc = usuarioLogado.ano_nascimento || usuarioLogado.data_nascimento;
    if (dataNascimento) dataNascimento.value = formatDateOnly(dataNasc);
    
    if (sexo) sexo.value = usuarioLogado.sexo || '';
    if (curso) curso.value = usuarioLogado.curso || '';
    if (classe) classe.value = usuarioLogado.classe || '';
    if (turma) turma.value = usuarioLogado.turma || '';
    if (sala) sala.value = usuarioLogado.sala || '';
    if (statusConta) statusConta.value = usuarioLogado.status || 'ativo';
    
    const fotoPerfil = usuarioLogado.foto_perfil || usuarioLogado.fotoPerfil;
    const profilePreview = document.getElementById('profilePreview');
    const profileImage = document.getElementById('profileImage');
    const removePhotoBtn = document.getElementById('removePhoto');
    
    if (fotoPerfil && fotoPerfil !== '') {
        if (profilePreview) {
            profilePreview.classList.remove('hidden');
            profilePreview.src = fotoPerfil;
            if (profileImage) profileImage.classList.add('hidden');
        }
        if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
    } else {
        if (profilePreview) profilePreview.classList.add('hidden');
        if (profileImage) {
            profileImage.classList.remove('hidden');
            profileImage.textContent = getInitials(usuarioLogado.nome);
        }
        if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
    }
    
    dadosOriginais = { ...usuarioLogado };
}

// Função para atualizar interface
function atualizarInterface() {
    if (!usuarioLogado) {
        console.error('usuarioLogado não está definido em atualizarInterface');
        return;
    }
    
    const usuarioNome = document.getElementById('usuarioNome');
    if (usuarioNome) usuarioNome.textContent = usuarioLogado.nome || 'Usuário';
    
    const processoNumero = document.getElementById('processoNumero');
    if (processoNumero) processoNumero.textContent = usuarioLogado.numero_processo || 'Não informado';
    
    const processoNumeroMobile = document.getElementById('processoNumeroMobile');
    if (processoNumeroMobile) processoNumeroMobile.textContent = usuarioLogado.numero_processo || 'Não informado';
    
    const saudacaoNome = document.getElementById('saudacaoNome');
    if (saudacaoNome) saudacaoNome.textContent = getPrimeiroNome(usuarioLogado.nome);
    
    const nomeMobile = document.getElementById('nomeMobile');
    if (nomeMobile) nomeMobile.textContent = usuarioLogado.nome || 'Usuário';
    
    if (window.atualizarAvatarGlobal) window.atualizarAvatarGlobal();
    carregarContadores();
}

// FUNÇÕES DE VALIDAÇÃO DE CAMPO

function setupValidacaoCampos() {
    const nomeInput = document.getElementById('nomeCompleto');
    if (nomeInput) {
        nomeInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
            valor = valor.replace(/\s+/g, ' ');
            this.value = valor;
        });
    }
    
    const turmaInput = document.getElementById('turma');
    if (turmaInput) {
        turmaInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-z0-9]/g, '');
            valor = valor.toUpperCase();
            this.value = valor;
        });
    }
    
    const salaInput = document.getElementById('sala');
    if (salaInput) {
        salaInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^A-Za-z0-9]/g, '');
            valor = valor.toUpperCase();
            this.value = valor;
        });
    }
    
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            let valor = this.value;
            valor = valor.replace(/[^0-9]/g, '');
            if (valor.length > 9) {
                valor = valor.slice(0, 9);
            }
            this.value = valor;
        });
    }
}

// FUNÇÕES DE UPLOAD DE FOTO

async function salvarFotoPerfil(fotoBase64) {
    try {
        const userId = usuarioLogado.id || usuarioLogado.id_usuario;
        const response = await apiRequest(`/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({
                foto_perfil: fotoBase64
            })
        });
        
        if (response.success) {
            usuarioLogado.foto_perfil = fotoBase64;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            if (window.atualizarAvatarGlobal) window.atualizarAvatarGlobal();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao salvar foto:', error);
        return false;
    }
}

async function removerFotoPerfil() {
    try {
        const userId = usuarioLogado.id || usuarioLogado.id_usuario;
        const response = await apiRequest(`/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({
                foto_perfil: null
            })
        });
        
        if (response.success) {
            delete usuarioLogado.foto_perfil;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            if (window.atualizarAvatarGlobal) window.atualizarAvatarGlobal();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao remover foto:', error);
        return false;
    }
}

function setupUploadFoto() {
    const photoUpload = document.getElementById('photoUpload');
    const profileImage = document.getElementById('profileImage');
    const profilePreview = document.getElementById('profilePreview');
    const removePhotoBtn = document.getElementById('removePhoto');
    
    if (!photoUpload) return;
    
    photoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        
        if (file) {
            if (!file.type.match('image.*')) {
                mostrarNotificacao('Por favor, selecione apenas imagens!', 'error');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                mostrarNotificacao('A imagem deve ter no máximo 5MB!', 'error');
                return;
            }
            
            mostrarNotificacao('Enviando foto...', 'info');
            
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                const fotoBase64 = event.target.result;
                const sucesso = await salvarFotoPerfil(fotoBase64);
                
                if (sucesso) {
                    if (profileImage) profileImage.classList.add('hidden');
                    if (profilePreview) {
                        profilePreview.classList.remove('hidden');
                        profilePreview.src = fotoBase64;
                    }
                    if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
                    mostrarNotificacao('Foto carregada com sucesso!', 'success');
                } else {
                    mostrarNotificacao('Erro ao salvar foto!', 'error');
                }
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', async function() {
            const sucesso = await removerFotoPerfil();
            
            if (sucesso) {
                if (photoUpload) photoUpload.value = '';
                if (profilePreview) {
                    profilePreview.classList.add('hidden');
                    profilePreview.src = '#';
                }
                if (profileImage) {
                    profileImage.classList.remove('hidden');
                    profileImage.textContent = getInitials(usuarioLogado.nome);
                }
                if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
                mostrarNotificacao('Foto removida com sucesso!', 'info');
            } else {
                mostrarNotificacao('Erro ao remover foto!', 'error');
            }
        });
    }
}

// FUNÇÕES PRINCIPAIS DO PERFIL

function setupSalvarPerfil() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!usuarioLogado) {
            mostrarNotificacao('Usuário não autenticado!', 'error');
            return;
        }
        
        const nome = document.getElementById('nomeCompleto').value.trim();
        if (!nome) {
            mostrarNotificacao('O nome completo é obrigatório!', 'error');
            return;
        }
        
        const dadosAtualizados = {
            nome: nome,
            telefone: document.getElementById('telefone').value.trim(),
            ano_nascimento: document.getElementById('dataNascimento').value,
            sexo: document.getElementById('sexo').value,
            curso: document.getElementById('curso').value,
            classe: document.getElementById('classe').value,
            turma: document.getElementById('turma').value.trim().toUpperCase(),
            sala: document.getElementById('sala').value.trim().toUpperCase()
        };
        
        const btnSubmit = profileForm.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Salvando...';
        btnSubmit.disabled = true;
        
        try {
            const userId = usuarioLogado.id || usuarioLogado.id_usuario;
            const response = await apiRequest(`/usuarios/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(dadosAtualizados)
            });
            
            if (response.success) {
                usuarioLogado = { ...usuarioLogado, ...dadosAtualizados };
                sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                atualizarInterface();
                carregarPerfil();
                mostrarNotificacao('Perfil atualizado com sucesso!', 'success');
            } else {
                mostrarNotificacao(response.error || 'Erro ao salvar alterações!', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            mostrarNotificacao('Erro ao salvar alterações!', 'error');
        } finally {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        }
    });
}

function resetForm() {
    if (!dadosOriginais) return;
    
    document.getElementById('nomeCompleto').value = dadosOriginais.nome || '';
    document.getElementById('telefone').value = dadosOriginais.telefone || '';
    document.getElementById('dataNascimento').value = formatDateOnly(dadosOriginais.ano_nascimento || dadosOriginais.data_nascimento);
    document.getElementById('sexo').value = dadosOriginais.sexo || '';
    document.getElementById('curso').value = dadosOriginais.curso || '';
    document.getElementById('classe').value = dadosOriginais.classe || '';
    document.getElementById('turma').value = dadosOriginais.turma || '';
    document.getElementById('sala').value = dadosOriginais.sala || '';
    
    mostrarNotificacao('Alterações descartadas', 'info');
}

// FUNÇÕES DE SEGURANÇA

async function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarNotificacao('Preencha todos os campos de senha!', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarNotificacao('As senhas não coincidem!', 'error');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarNotificacao('A nova senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    if (novaSenha === senhaAtual) {
        mostrarNotificacao('A nova senha deve ser diferente da atual!', 'error');
        return;
    }
    
    const btnAlterar = event.target;
    const textoOriginal = btnAlterar.innerHTML;
    btnAlterar.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Alterando...';
    btnAlterar.disabled = true;
    
    try {
        const userId = usuarioLogado.id || usuarioLogado.id_usuario;
        const response = await apiRequest(`/usuarios/${userId}`, {
            method: 'PUT',
            body: JSON.stringify({
                senhaAtual: senhaAtual,
                novaSenha: novaSenha
            })
        });
        
        if (response.success) {
            mostrarNotificacao('Senha alterada com sucesso!', 'success');
            document.getElementById('senhaAtual').value = '';
            document.getElementById('novaSenha').value = '';
            document.getElementById('confirmarSenha').value = '';
        } else {
            mostrarNotificacao(response.error || 'Erro ao alterar senha!', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao alterar senha! Verifique sua senha atual.', 'error');
    } finally {
        btnAlterar.innerHTML = textoOriginal;
        btnAlterar.disabled = false;
    }
}

async function excluirContaPermanentemente() {
    try {
        const userId = usuarioLogado.id || usuarioLogado.id_usuario;
        const response = await apiRequest(`/usuarios/${userId}/completo`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            sessionStorage.removeItem('usuarioLogado');
            localStorage.removeItem('token');
            mostrarNotificacao('Conta excluída com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 2000);
        } else {
            throw new Error(response.error || 'Erro ao excluir conta');
        }
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        mostrarNotificacao('Erro ao excluir conta! Tente novamente.', 'error');
    }
}

function confirmarExclusao() {
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível!')) {
        if (confirm('Todos os seus dados serão permanentemente removidos. Deseja continuar?')) {
            excluirContaPermanentemente();
        }
    }
}

// FUNÇÃO DE NOTIFICAÇÃO

function mostrarNotificacao(mensagem, tipo) {
    const notificacoesAntigas = document.querySelectorAll('.notification-toast');
    notificacoesAntigas.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-toast fixed top-20 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-0 ${
        tipo === 'success' ? 'bg-green-500' : 
        tipo === 'error' ? 'bg-red-500' : 
        'bg-orange-500'
    } text-white`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${mensagem}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// FUNÇÃO DE LOGOUT

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
            window.location.href = './login.html';
        }, 500);
    });
    
    document.getElementById('logoutCancelBtn')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

// FUNÇÃO PARA ATUALIZAR CONTADORES PERIODICAMENTE

function iniciarAtualizacaoPeriodica() {
    setInterval(() => {
        if (usuarioLogado) {
            console.log('Atualizando contadores periodicamente...');
            carregarContadores();
        }
    }, 30000);
}

// INICIALIZAÇÃO

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inicializando página de perfil...');
    
    usuarioLogado = await checkAuth();
    
    if (!usuarioLogado) {
        console.error('Falha na autenticação');
        return;
    }
    
    console.log('Usuário logado:', usuarioLogado);
    
    carregarPerfil();
    atualizarInterface();
    setupValidacaoCampos();
    setupUploadFoto();
    setupSalvarPerfil();
    iniciarAtualizacaoPeriodica();
    
    console.log('Perfil inicializado com sucesso!');
});

// EXPORTAR FUNÇÕES GLOBAIS
window.logout = logout;
window.resetForm = resetForm;
window.alterarSenha = alterarSenha;
window.confirmarExclusao = confirmarExclusao;