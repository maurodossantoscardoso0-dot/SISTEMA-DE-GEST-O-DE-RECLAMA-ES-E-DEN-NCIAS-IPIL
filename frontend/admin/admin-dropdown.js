// Shared admin profile dropdown helper
function setupAdminProfileDropdown() {
    const profileBtn = document.getElementById('adminProfileBtn');
    const profileMenu = document.getElementById('adminProfileMenu');

    if (!profileBtn || !profileMenu) return;

    profileBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        profileMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        if (!profileMenu.classList.contains('hidden')) {
            profileMenu.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !profileMenu.classList.contains('hidden')) {
            profileMenu.classList.add('hidden');
        }
    });
}

document.addEventListener('DOMContentLoaded', setupAdminProfileDropdown);
window.setupAdminProfileDropdown = setupAdminProfileDropdown;
