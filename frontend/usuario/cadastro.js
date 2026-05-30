// Funções de validação
function validarApenasLetrasEspacos(valor) {
    const regex = /^[A-Za-zÀ-ÿ\s]+$/;
    return regex.test(valor);
}

function validarApenasLetrasNumeros(valor) {
    const regex = /^[A-Za-z0-9]+$/;
    return regex.test(valor);
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validarTelefone(telefone) {
    const regex = /^[0-9]{9}$/;
    return regex.test(telefone);
}

// Função para validar campo em tempo real
function validarCampo(input, tipo, warningIcon, errorMsg) {
    let valor = input.value.trim();
    let valido = false;
    
    if (tipo === 'letrasEspacos') {
        valido = valor === '' || validarApenasLetrasEspacos(valor);
    } else if (tipo === 'letrasNumeros') {
        valido = valor === '' || validarApenasLetrasNumeros(valor);
    }
    
    if (valor !== '' && !valido) {
        input.classList.add('border-red-500');
        input.classList.remove('border-gray-300');
        if (warningIcon) warningIcon.classList.remove('hidden');
        if (errorMsg) errorMsg.classList.remove('hidden');
        return false;
    } else {
        input.classList.remove('border-red-500');
        input.classList.add('border-gray-300');
        if (warningIcon) warningIcon.classList.add('hidden');
        if (errorMsg) errorMsg.classList.add('hidden');
        return true;
    }
}

// Função para validar o formulário completo
function validarFormulario(dados) {
    // Validar nome (apenas letras e espaços)
    if (!validarApenasLetrasEspacos(dados.nome)) {
        alert(' Nome inválido! Use apenas letras e espaços.');
        return false;
    }
    
    // Validar curso (não pode estar vazio)
    if (!dados.curso) {
        alert(' Por favor, selecione um curso.');
        return false;
    }
    
    // Validar turma (apenas letras e números)
    if (!validarApenasLetrasNumeros(dados.turma)) {
        alert(' Turma inválida! Use apenas letras e números.');
        return false;
    }
    
    // Validar sala (apenas letras e números)
    if (!validarApenasLetrasNumeros(dados.sala)) {
        alert(' Sala inválida! Use apenas letras e números.');
        return false;
    }
    
    // Validar email
    if (!validarEmail(dados.email)) {
        alert(' Email inválido! Digite um email válido (ex: usuario@dominio.com).');
        return false;
    }
    
    // Validar telefone (9 dígitos)
    if (!validarTelefone(dados.telefone)) {
        alert(' Telefone inválido! O telefone deve conter exatamente 9 dígitos numéricos.');
        return false;
    }
    
    // Validar senha (mínimo 6 caracteres)
    if (dados.senha.length < 6) {
        alert(' Senha inválida! A senha deve ter no mínimo 6 caracteres.');
        return false;
    }
    
    // Validar confirmação de senha
    if (dados.senha !== dados.confirmarSenha) {
        alert(' As senhas não coincidem!');
        return false;
    }
    
    return true;
}

// Função de cadastro de usuário
async function cadastrarUsuario(dados) {
    try {
        const formData = new FormData();
        formData.append('nome', dados.nome);
        formData.append('email', dados.email);
        formData.append('nascimento', dados.nascimento);
        formData.append('sexo', dados.sexo);
        formData.append('senha', dados.senha);
        formData.append('telefone', dados.telefone);
        formData.append('curso', dados.curso);
        formData.append('processo', dados.processo);
        formData.append('classe', dados.classe);
        formData.append('turma', dados.turma);
        formData.append('sala', dados.sala);
        
        // Se tiver foto, adiciona
        if (dados.foto) {
            formData.append('foto', dados.foto);
        }

        const resposta = await fetch('http://localhost:3000/api/auth/registro', {
            method: 'POST',
            body: formData
        });

        const dadosResposta = await resposta.json();
        
        if (dadosResposta.sucesso) {
            console.log(' Cadastro realizado:', dadosResposta.usuario);
            localStorage.setItem('token', dadosResposta.token);
            return dadosResposta;
        } else {
            console.error(' Erro:', dadosResposta.erro);
            throw new Error(dadosResposta.erro);
        }
    } catch (erro) {
        console.error('Erro na requisição:', erro);
        throw erro;
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos do formulário
    const nomeInput = document.getElementById('nome');
    const turmaInput = document.getElementById('turma');
    const salaInput = document.getElementById('sala');
    const form = document.getElementById('registerForm');
    
    // Elementos de validação visual
    const nomeWarning = document.getElementById('nomeWarning');
    const nomeError = document.getElementById('nomeError');
    const turmaWarning = document.getElementById('turmaWarning');
    const turmaError = document.getElementById('turmaError');
    const salaWarning = document.getElementById('salaWarning');
    const salaError = document.getElementById('salaError');
    
    // Validação em tempo real para o campo Nome
    if (nomeInput) {
        nomeInput.addEventListener('input', function() {
            validarCampo(nomeInput, 'letrasEspacos', nomeWarning, nomeError);
        });
        
        // Prevenir colagem de caracteres inválidos
        nomeInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasEspacos(pastedText)) {
                this.value = pastedText;
                validarCampo(this, 'letrasEspacos', nomeWarning, nomeError);
            } else {
                alert(' Não é permitido colar caracteres especiais ou números neste campo!');
            }
        });
    }
    
    // Validação em tempo real para o campo Turma
    if (turmaInput) {
        turmaInput.addEventListener('input', function() {
            validarCampo(turmaInput, 'letrasNumeros', turmaWarning, turmaError);
        });
        
        turmaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText;
                validarCampo(this, 'letrasNumeros', turmaWarning, turmaError);
            } else {
                alert(' Não é permitido colar caracteres especiais neste campo! Use apenas letras e números.');
            }
        });
    }
    
    // Validação em tempo real para o campo Sala
    if (salaInput) {
        salaInput.addEventListener('input', function() {
            validarCampo(salaInput, 'letrasNumeros', salaWarning, salaError);
        });
        
        salaInput.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            if (validarApenasLetrasNumeros(pastedText)) {
                this.value = pastedText;
                validarCampo(this, 'letrasNumeros', salaWarning, salaError);
            } else {
                alert(' Não é permitido colar caracteres especiais neste campo! Use apenas letras e números.');
            }
        });
    }
    
    // Validação do telefone
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function() {
            if (this.value.length > 9) {
                this.value = this.value.slice(0, 9);
            }
        });
    }
    
    // Mostrar/Esconder senha
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    // Envio do formulário
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Coletar dados do formulário
            const dados = {
                nome: document.getElementById('nome').value.trim(),
                email: document.getElementById('email').value.trim(),
                nascimento: document.getElementById('anoNascimento').value,
                sexo: document.getElementById('sexo').value,
                senha: document.getElementById('password').value,
                confirmarSenha: document.getElementById('confirmPassword').value,
                telefone: document.getElementById('telefone').value.trim(),
                curso: document.getElementById('curso').value,
                processo: document.getElementById('processo').value,
                classe: document.getElementById('classe').value,
                turma: document.getElementById('turma').value.trim().toUpperCase(),
                sala: document.getElementById('sala').value.trim().toUpperCase(),
                foto: document.getElementById('foto')?.files[0]
            };
            
            // Validar termos
            const termsCheckbox = document.getElementById('terms');
            if (!termsCheckbox.checked) {
                alert(' Você deve aceitar os termos e condições para continuar!');
                return;
            }
            
            // Validar todos os campos
            if (!validarFormulario(dados)) {
                return;
            }
            
            // Desabilitar botão para evitar múltiplos envios
            const submitBtn = document.getElementById('submitBTN');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cadastrando...';
            
            try {
                const resultado = await cadastrarUsuario(dados);
                alert(' Cadastro realizado com sucesso!');
                window.location.href = './dashboard.html';
            } catch (erro) {
                alert(' Erro ao cadastrar: ' + erro.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// Bloquear teclas especiais nos campos
function bloquearTeclasInvalidas(event, tipo) {
    const tecla = event.key;
    
    if (tipo === 'letrasEspacos') {
        // Permitir apenas letras, espaços, backspace, delete, tab, enter, etc.
        const regex = /^[A-Za-zÀ-ÿ\s]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && 
            tecla !== 'Delete' && 
            tecla !== 'Tab' && 
            tecla !== 'Enter' && 
            tecla !== 'ArrowLeft' && 
            tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && 
            tecla !== 'ArrowDown' &&
            tecla !== 'Home' &&
            tecla !== 'End') {
            event.preventDefault();
            return false;
        }
    } else if (tipo === 'letrasNumeros') {
        // Permitir apenas letras, números, backspace, delete, tab, enter, etc.
        const regex = /^[A-Za-z0-9]$/;
        if (!regex.test(tecla) && 
            tecla !== 'Backspace' && 
            tecla !== 'Delete' && 
            tecla !== 'Tab' && 
            tecla !== 'Enter' && 
            tecla !== 'ArrowLeft' && 
            tecla !== 'ArrowRight' && 
            tecla !== 'ArrowUp' && 
            tecla !== 'ArrowDown' &&
            tecla !== 'Home' &&
            tecla !== 'End') {
            event.preventDefault();
            return false;
        }
    }
    return true;
}

// Adicionar bloqueio de teclas nos campos
document.addEventListener('DOMContentLoaded', function() {
    const nomeInput = document.getElementById('nome');
    const turmaInput = document.getElementById('turma');
    const salaInput = document.getElementById('sala');
    
    if (nomeInput) {
        nomeInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasEspacos'));
    }
    
    if (turmaInput) {
        turmaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
    }
    
    if (salaInput) {
        salaInput.addEventListener('keydown', (e) => bloquearTeclasInvalidas(e, 'letrasNumeros'));
    }
});