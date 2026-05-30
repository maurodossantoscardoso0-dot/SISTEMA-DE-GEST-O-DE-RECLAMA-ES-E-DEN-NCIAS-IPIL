const USER_STORAGE_KEY = 'usuarioLogado';
let profileModalKeydownListener = null;

function addProfileStyles() {
    if (document.getElementById('sharedProfileStyles')) return;
    const style = document.createElement('style');
    style.id = 'sharedProfileStyles';
    style.textContent = `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .profile-modal-img { border-radius: 9999px; }
        #profileImageModalOverlay .modal-content { animation: fadeIn 0.18s ease; }
        #profileImageModalOverlay img { border-radius: 9999px; display: block; }
        #profileImageModalOverlay button:focus { outline: 2px solid rgba(249,115,22,0.5); }
    `;
    document.head.appendChild(style);
}

function getUsuarioLogadoSession() {
    const usuarioJson = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!usuarioJson) return null;
    try {
        return JSON.parse(usuarioJson);
    } catch (error) {
        console.error('Não foi possível parsear usuarioLogado do sessionStorage', error);
        return null;
    }
}

function getInitials(nome) {
    if (!nome) return 'U';
    const partes = nome.trim().split(' ').filter(Boolean);
    if (partes.length === 0) return 'U';
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
}

function atualizarAvatarGlobal() {
    const usuario = getUsuarioLogadoSession();
    if (!usuario) return;

    const fotoPerfil = usuario.foto_perfil || usuario.fotoPerfil || '';
    const initials = getInitials(usuario.nome);
    const avatarIds = ['usuarioAvatar', 'avatarMobile'];

    avatarIds.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;

        if (fotoPerfil) {
            element.style.backgroundImage = `url('${fotoPerfil}')`;
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
            element.style.backgroundColor = '';
            element.textContent = '';
        } else {
            element.style.backgroundImage = '';
            element.style.backgroundColor = '';
            element.textContent = initials;
        }

        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.setAttribute('aria-label', 'Abrir imagem do perfil');
        element.classList.add('cursor-pointer');

        if (!element.dataset.profileListenerAttached) {
            element.addEventListener('click', openProfileImageModal);
            element.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openProfileImageModal();
                }
            });
            element.dataset.profileListenerAttached = 'true';
        }
    });
}

function openProfileImageModal() {
    const usuario = getUsuarioLogadoSession();
    if (!usuario) return;

    const fotoPerfil = usuario.foto_perfil || usuario.fotoPerfil || '';
    const initials = getInitials(usuario.nome);

    const existingModal = document.getElementById('profileImageModalOverlay');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'profileImageModalOverlay';
    overlay.className = 'fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4';
    overlay.style.animation = 'fadeIn 0.2s ease';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'profileImageModalTitle');

    overlay.innerHTML = `
        <div class="relative max-w-full max-h-full w-full sm:w-auto">
            <button id="profileImageModalClose" class="absolute -top-3 -right-3 bg-gray-900 bg-opacity-80 text-white rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-orange-300" aria-label="Fechar pré-visualização da foto do perfil">
                <i class="fas fa-times"></i>
            </button>
            <div class="bg-white rounded-full overflow-hidden w-72 h-72 sm:w-96 sm:h-96 mx-auto shadow-2xl border-4 border-white flex items-center justify-center">
                ${fotoPerfil ? `<img src="${fotoPerfil}" alt="Foto de perfil de ${usuario.nome}" class="w-full h-full object-cover" />` : `<span class="text-5xl font-bold text-gray-800">${initials}</span>`}
            </div>
        </div>
    `;

    overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
            closeProfileImageModal();
        }
    });

    const closeButton = overlay.querySelector('#profileImageModalClose');
    if (closeButton) {
        closeButton.addEventListener('click', closeProfileImageModal);
    }

    profileModalKeydownListener = function (event) {
        if (event.key === 'Escape') {
            closeProfileImageModal();
        }
    };

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    if (closeButton) {
        closeButton.focus();
    }
    document.addEventListener('keydown', profileModalKeydownListener);
}

function closeProfileImageModal() {
    const overlay = document.getElementById('profileImageModalOverlay');
    if (!overlay) return;
    overlay.remove();
    document.body.style.overflow = '';
    if (profileModalKeydownListener) {
        document.removeEventListener('keydown', profileModalKeydownListener);
        profileModalKeydownListener = null;
    }
}

window.atualizarAvatarGlobal = atualizarAvatarGlobal;
window.abrirModalImagemPerfil = openProfileImageModal;
window.fecharModalImagemPerfil = closeProfileImageModal;

document.addEventListener('DOMContentLoaded', function () {
    addProfileStyles();
    atualizarAvatarGlobal();
});
