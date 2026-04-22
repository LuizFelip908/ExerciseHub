// Inicialização
toastr.options = { positionClass: 'toast-bottom-right', timeOut: 2500, preventDuplicates: true, closeButton: true };

// Verifica se o usuário estava logado e restaura a sessão
function initializeApp() {
  applyTheme(getInitialTheme(), false);
  configureDateLimits();
  setupAuthForms();
  setupOverlayAccessibility();
  setupMobileSidebarCloseBehavior();
  setupNovoRegistroEnhancements();
  applySidebarStateForViewport();

  const storedUser = localStorage.getItem('exerciseHub_currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    enterApp();
  } else {
    resetNovoRegistroForm();
  }
}

// Inicializa o app quando a página carrega
document.addEventListener('DOMContentLoaded', initializeApp);





















