let currentUser = null;
let exercises = [];
let goals = [];
let favorites = [];
let dashboardChart = null;
let activityChart = null;
let dashboardRange = '7d';
let selectedMuscle = null;
let muscleView = 'both';
let activeOverlayId = null;

function createDefaultUserProfile() {
  return {
    name: 'Luiz Felipe',
    email: 'luiz@email.com',
    age: null,
    gender: '',
    weight: null,
    height: null,
    goal: '',
    unit: 'metric',
    notificationsEnabled: true,
    joinDate: new Date().toISOString(),
    password: '123456'
  };
}

let userProfile = createDefaultUserProfile();

// ==================== LOCALSTORAGE FUNCTIONS ====================
function saveToStorage() {
  localStorage.setItem('exerciseHub_exercises', JSON.stringify(exercises));
  localStorage.setItem('exerciseHub_goals', JSON.stringify(goals));
  localStorage.setItem('exerciseHub_favorites', JSON.stringify(favorites));
  localStorage.setItem('exerciseHub_userProfile', JSON.stringify(userProfile));
}

function loadFromStorage() {
  const storedExercises = localStorage.getItem('exerciseHub_exercises');
  const storedGoals = localStorage.getItem('exerciseHub_goals');
  const storedFavorites = localStorage.getItem('exerciseHub_favorites');
  const storedProfile = localStorage.getItem('exerciseHub_userProfile');
  
  if (storedExercises) exercises = JSON.parse(storedExercises);
  if (storedGoals) goals = JSON.parse(storedGoals);
  if (storedFavorites) favorites = JSON.parse(storedFavorites);
  if (storedProfile) userProfile = { ...createDefaultUserProfile(), ...JSON.parse(storedProfile) };
}

// Biblioteca de exercícios pré-cadastrados (inspirado no MuscleWiki)
const biblioteca = [
  // ========== PEITO ==========
  { id: 1, name: "Flexão de Braço", muscle: "Peito", secondary: "Tríceps, Ombros", equip: "Corpo Livre", difficulty: "Média", level: "Intermediário", instructions: "1. Deite-se de bruços\n2. Mãos embaixo dos ombros\n3. Suba o corpo dobrando os braços\n4. Desça controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2021/04/flexao-de-bracos.gif", tips: "Mantenha o corpo reto, evite ceder a cintura" },
  { id: 13, name: "Supino com Barra", muscle: "Peito", secondary: "Tríceps, Ombros", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. Deite-se em um banco\n2. Barra ao nível do peito\n3. Empurre a barra para cima\n4. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-reto.gif", tips: "Mantenha as omoplatas retraídas" },
  { id: 14, name: "Supino com Halteres", muscle: "Peito", secondary: "Tríceps, Ombros", equip: "Halteres", difficulty: "Alta", level: "Avançado", instructions: "1. Deite-se em um banco\n2. Halteres ao nível do peito\n3. Empurre os halteres para cima\n4. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/supino-reto-com-halteres.gif", tips: "Mantenha os ombros retraídos" },
  { id: 15, name: "Crucifixo com Halteres", muscle: "Peito", secondary: "Ombros", equip: "Halteres", difficulty: "Média", level: "Intermediário", instructions: "1. Deite-se em um banco\n2. Halteres acima do peito com braços semi-flexionados\n3. Abra os braços em movimento de arco\n4. Volte à posição inicial", gif: "https://www.hipertrofia.org/blog/wp-content/uploads/2020/06/dumbbell-incline-fly.gif", tips: "Não estenda totalmente os cotovelos" },

  // ========== COSTAS ==========
  { id: 5, name: "Rosca Invertida", muscle: "Costas", secondary: "Braços", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. Pegue a barra com as mãos em supinação\n2. Puxe o corpo para cima\n3. Desça controlado", gif: "https://i0.wp.com/omelhortreino.com.br/wp-content/uploads/2025/04/Rosca-Inversa.gif?resize=550%2C550&ssl=1", tips: "Pegada mais estreita facilita mais o trabalho de braços" },
  { id: 6, name: "Puxada Frontal", muscle: "Costas", secondary: "Braços", equip: "Máquina", difficulty: "Média", level: "Intermediário", instructions: "1. Sente-se na máquina\n2. Pegue a barra com pegada pronada\n3. Puxe para baixo até o peito\n4. Suba controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-puxada-aberta-com-barra-no-pulley.gif", tips: "Incline o tronco ligeiramente para trás" },
  { id: 16, name: "Remada Inclinada", muscle: "Costas", secondary: "Braços", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. Incline-se para frente (90 graus)\n2. Pegue a barra com mãos pronadas\n3. Puxe em direção ao abdômen\n4. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/costas-remada-curvada-.gif", tips: "Mantenha a coluna neutra" },
  { id: 17, name: "Remada com Halteres", muscle: "Costas", secondary: "Braços", equip: "Halteres", difficulty: "Média", level: "Intermediário", instructions: "1. Incline-se para frente\n2. Segure um halter em cada mão\n3. Puxe até a cintura\n4. Abaixe controlado", gif: "https://www.hipertrofia.org/blog/wp-content/uploads/2023/11/dumbbell-bent-over-row.gif", tips: "Evite arredondar a coluna" },

  // ========== BRÁÇOS ==========
  { id: 3, name: "Rosca Direta", muscle: "Braços", secondary: "Antebraço", equip: "Halteres", difficulty: "Fácil", level: "Iniciante", instructions: "1. Em pé com halteres nas mãos\n2. Cotovelos fixos ao corpo\n3. Dobre os cotovelos levantando os halteres\n4. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2022/09/rosca-biceps-direta-com-halteres.gif", tips: "Evite balancear o corpo" },
  { id: 9, name: "Rosca Tríceps", muscle: "Braços", secondary: "Peito", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. Prenda a barra com as mãos pronadas\n2. Abaixe a barra até atrás da cabeça\n3. Suba estendendo os braços", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2021/07/triceps-puxada-no-pulley.gif", tips: "Cotovelos devem ficar fixos" },
  { id: 18, name: "Extensão Tríceps com Halter", muscle: "Braços", secondary: "", equip: "Halteres", difficulty: "Fácil", level: "Iniciante", instructions: "1. Segure um halter acima da cabeça com as duas mãos\n2. Abaixe o halter flexionando os cotovelos\n3. Estenda os braços para voltar", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2021/03/extensao-de-triceps-com-halteres-no-banco.gif", tips: "Mantenha os cotovelos apontados para frente" },
  { id: 19, name: "Rosca Martelo", muscle: "Braços", secondary: "Antebraço", equip: "Halteres", difficulty: "Fácil", level: "Iniciante", instructions: "1. Em pé com halteres nas mãos (pegada neutra)\n2. Cotovelos fixos\n3. Dobre os cotovelos\n4. Abaixe controlado", gif: "https://image.tuasaude.com/media/article/kr/cn/rosca-martelo_75628.gif?width=686&height=487", tips: "Ótima para desenvolvimento do antebraço" },

  // ========== OMBROS ==========
  { id: 8, name: "Desenvolvimento", muscle: "Ombros", secondary: "Tríceps", equip: "Halteres", difficulty: "Média", level: "Intermediário", instructions: "1. Em pé com halteres na altura dos ombros\n2. Empurre para cima até estender os braços\n3. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/desenvolvimento-para-ombros-com-halteres.gif", tips: "Evite arquear a coluna" },
  { id: 20, name: "Encolhimento de Ombros", muscle: "Ombros", secondary: "Trapézio", equip: "Halteres", difficulty: "Fácil", level: "Iniciante", instructions: "1. Em pé com halteres nas mãos\n2. Levante os ombros em direção às orelhas\n3. Abaixe controlado", gif: "https://static.wixstatic.com/media/2edbed_ccbd8070639b4539ac2331b17f690d27~mv2.gif", tips: "Não rode os ombros, apenas levante" },
  { id: 21, name: "Elevação Lateral", muscle: "Ombros", secondary: "", equip: "Halteres", difficulty: "Fácil", level: "Iniciante", instructions: "1. Em pé com halteres nas mãos\n2. Levante os braços lateralmente até a altura dos ombros\n3. Abaixe controlado", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/ombros-elevacao-lateral-de-ombros-com-halteres.gif", tips: "Ótima para deltoide medial" },

  // ========== PERNAS ==========
  { id: 2, name: "Agachamento", muscle: "Pernas", secondary: "Glúteos, Quadríceps", equip: "Corpo Livre", difficulty: "Média", level: "Intermediário", instructions: "1. Em pé, pés na largura dos ombros\n2. Abaixe o corpo como se fosse sentar\n3. Mantenha o tronco reto\n4. Suba voltando à posição inicial", gif: "https://image.tuasaude.com/media/article/pf/wf/como-fazer-agachamentos-corretamente_75594.gif?width=686&height=487", tips: "Joelhos devem ficar acima dos tornozelos" },
  { id: 7, name: "Leg Press", muscle: "Pernas", secondary: "Glúteos", equip: "Máquina", difficulty: "Média", level: "Intermediário", instructions: "1. Sente-se e coloque os pés na plataforma\n2. Abaixe o corpo dobrando os joelhos\n3. Suba em seguida", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/pernas-leg-press-45-tradicional.gif", tips: "Mantenha a coluna em contato com o encosto" },
  { id: 11, name: "Afundo", muscle: "Pernas", secondary: "Glúteos", equip: "Corpo Livre", difficulty: "Média", level: "Intermediário", instructions: "1. Em pé, dê um passo à frente\n2. Abaixe o corpo dobrando os joelhos\n3. Volte à posição inicial", gif: "https://www.hipertrofia.org/blog/wp-content/uploads/2024/09/Static-Lunge.gif", tips: "Mantenha o tronco reto" },
  { id: 22, name: "Extensão de Perna", muscle: "Pernas", secondary: "Quadríceps", equip: "Máquina", difficulty: "Fácil", level: "Iniciante", instructions: "1. Sente-se na máquina\n2. Encaixe os pés embaixo da alavanca\n3. Estenda as pernas\n4. Abaixe controlado", gif: "https://grandeatleta.com.br/wp-content/uploads/2018/05/cadeira-extensora-execucao.gif", tips: "Excelente para isolamento do quadríceps" },
  { id: 23, name: "Flexão de Perna", muscle: "Pernas", secondary: "Isquiotibial", equip: "Máquina", difficulty: "Fácil", level: "Iniciante", instructions: "1. Sente-se na máquina\n2. Encaixe os pés embaixo da alavanca\n3. Flexione as pernas\n4. Estenda controlado", gif: "https://i.pinimg.com/originals/6b/aa/56/6baa56db563127e0cd7eb954ccf0ad9f.gif", tips: "Trabalha especificamente o isquiotibial" },

  // ========== GLÚTEOS ==========
  { id: 24, name: "Hip Thrust", muscle: "Glúteos", secondary: "Pernas", equip: "Corpo Livre", difficulty: "Média", level: "Intermediário", instructions: "1. Sente-se no chão com costas em um banco\n2. Pés apoiados no chão\n3. Levante os quadris contraindo os glúteos\n4. Abaixe controlado", gif: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif", tips: "Ótimo exercício para ativar os glúteos" },
  { id: 25, name: "Agachamento Búlgaro", muscle: "Glúteos", secondary: "Pernas", equip: "Corpo Livre", difficulty: "Alta", level: "Avançado", instructions: "1. De costas para um banco\n2. Coloque um pé atrás de você no banco\n3. Abaixe o corpo\n4. Suba", gif: "https://image.tuasaude.com/media/article/dv/bw/agachamento-bulgaro_62764.gif?width=686&height=487", tips: "Excelente para força unilateral" },

  // ========== ABDÔMEN ==========
  { id: 10, name: "Abdominal", muscle: "Abdômen", secondary: "Oblíquos", equip: "Corpo Livre", difficulty: "Fácil", level: "Iniciante", instructions: "1. Deite-se com os joelhos flexionados\n2. Levante o tronco contraindo o abdômen\n3. Abaixe controlado", gif: "https://treinototal.com.br/wp-content/uploads/2024/12/abdominal-no-solo-crunch.gif", tips: "Não puxe pelo pescoço" },
  { id: 26, name: "Prancha", muscle: "Abdômen", secondary: "Costas, Ombros", equip: "Corpo Livre", difficulty: "Fácil", level: "Iniciante", instructions: "1. Posição de flexão\n2. Desça até apoiar nos antebraços\n3. Mantenha o corpo reto\n4. Sustente por 30+ segundos", gif: "https://lh3.googleusercontent.com/proxy/gyHoFwrUjqEjVOtKN5yvlDDm08v355PbidwiUm9g7pabGtdOYxxp5C77p3gR9WCBDejutmOi3lswk82lShHNqHKuGKZZzn1_AXJUVdkRCbWRGtUkx1A", tips: "Isométrico excelente para core" },
  { id: 27, name: "Rosca Direta no Banco", muscle: "Abdômen", secondary: "", equip: "Máquina", difficulty: "Fácil", level: "Iniciante", instructions: "1. Sente-se na máquina\n2. Abrace a barra/almofada\n3. Flexione contraindo o abdômen\n4. Retorne", gif: "https://www.mundoboaforma.com.br/wp-content/uploads/2020/12/rosca-biceps-com-halteres-no-banco-inclinado.gif", tips: "Ótima forma controlada" },

  // ========== CARDIO/OUTROS ==========
  { id: 12, name: "Rosca Convencional", muscle: "Braços", secondary: "Peito", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. De pé segurando uma barra no solo\n2. Levante a barra com os braços estendidos\n3. Abaixe controlado até a coxa", gif: "https://i.pinimg.com/originals/67/b9/7a/67b97ad79f373c490263d1dea8c31e38.gif", tips: "Mantenha a coluna neutra" },
  { id: 28, name: "Stiff", muscle: "Pernas", secondary: "Costas", equip: "Barra", difficulty: "Média", level: "Intermediário", instructions: "1. Em pé com a barra nas mãos\n2. Mantenha as pernas com leve flexão\n3. Incline o tronco para frente\n4. Retorne", gif: "https://i.pinimg.com/originals/82/4d/fd/824dfd405284597cd20e8a55233e2d77.gif", tips: "Ótimo para isquiotibial e costas" },
  { id: 29, name: "Rosca na Máquina", muscle: "Braços", secondary: "Peito", equip: "Máquina", difficulty: "Fácil", level: "Iniciante", instructions: "1. Sente-se na máquina\n2. Segure as barras\n3. Flexione os cotovelos\n4. Estenda controlado", gif: "https://www.hipertrofia.org/blog/wp-content/uploads/2024/10/lever-hammer-grip-preacher-curl.gif", tips: "Forma segura e controlada" },
  { id: 30, name: "Corrida na Esteira", muscle: "Pernas", secondary: "Cardio", equip: "Máquina", difficulty: "Fácil", level: "Iniciante", instructions: "1. Entre na esteira\n2. Comece a caminhar\n3. Aumente a velocidade gradualmente\n4. Mantenha a postura reta", gif: "https://i.pinimg.com/originals/2c/87/4b/2c874b1b5b30a07eeee1e3002d2e52b4.gif", tips: "Aquecimento e cardio essencial" }
];

const VALID_ACTIVITY_TYPES = ['Musculação', 'Corrida', 'Natação', 'Ioga', 'Crossfit'];
const VALID_INTENSITIES = ['Baixa', 'Média', 'Alta'];
const STORAGE_KEYS = ['exerciseHub_currentUser', 'exerciseHub_exercises', 'exerciseHub_goals', 'exerciseHub_favorites', 'exerciseHub_userProfile'];
const THEME_STORAGE_KEY = 'exerciseHub_theme';
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'exerciseHub_sidebarCollapsed';
const SIDEBAR_MOBILE_QUERY = '(max-width: 768px)';

function getExerciseActivities(exercise) {
  if (!exercise || typeof exercise !== 'object') return [];
  if (Array.isArray(exercise.activities)) {
    const normalized = exercise.activities
      .map(value => String(value || '').trim())
      .filter(value => VALID_ACTIVITY_TYPES.includes(value));
    if (normalized.length) return [...new Set(normalized)];
  }
  const singleType = String(exercise.type || '').trim();
  return VALID_ACTIVITY_TYPES.includes(singleType) ? [singleType] : [];
}

function getTodayISODate() {
  return new Date().toISOString().split('T')[0];
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function updateThemeToggleButton(theme) {
  const btn = document.getElementById('themeToggleBtn');
  const icon = document.getElementById('themeToggleIcon');
  const text = document.getElementById('themeToggleText');
  if (!btn || !icon || !text) return;

  const isDark = theme === 'dark';
  text.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
  icon.classList.toggle('fa-sun', isDark);
  icon.classList.toggle('fa-moon', !isDark);
}

function applyTheme(theme, persist = true) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  if (persist) localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  updateThemeToggleButton(normalizedTheme);
  if (dashboardChart) updateDashboardChart();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function validateExercisePayload(payload) {
  const date = (payload.date || '').trim();
  const type = (payload.type || '').trim();
  const equip = (payload.equip || '').trim();
  const intensity = (payload.intensity || '').trim();
  const duration = Number.parseInt(payload.duration, 10);
  const sessionGoal = (payload.sessionGoal || '').trim();
  const notes = (payload.notes || '').trim();

  if (!date) return { valid: false, message: 'Informe a data do exercício' };
  if (date > getTodayISODate()) return { valid: false, message: 'A data do exercício não pode ser no futuro' };
  if (!VALID_ACTIVITY_TYPES.includes(type)) return { valid: false, message: 'Selecione um tipo de atividade válido' };
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    return { valid: false, message: 'A duração deve ficar entre 5 e 480 minutos' };
  }
  if (!VALID_INTENSITIES.includes(intensity)) return { valid: false, message: 'Selecione uma intensidade válida' };
  if (sessionGoal.length > 90) return { valid: false, message: 'Objetivo da sessão deve ter no máximo 90 caracteres' };
  if (notes.length > 280) return { valid: false, message: 'Anotações devem ter no máximo 280 caracteres' };

  return {
    valid: true,
    data: { date, type, equip, duration, intensity, sessionGoal, notes }
  };
}

function openOverlayById(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  if (activeOverlayId && activeOverlayId !== id) {
    closeOverlayById(activeOverlayId);
  }
  overlay.style.display = 'flex';
  overlay.setAttribute('aria-hidden', 'false');
  activeOverlayId = id;
  const dialog = overlay.querySelector('.card-auth');
  if (dialog) {
    window.requestAnimationFrame(() => dialog.focus());
  }
}

function closeOverlayById(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
  if (activeOverlayId === id) {
    activeOverlayId = null;
  }
}

function showOverlay(type) {
  openOverlayById(`overlay-${type}`);
}

function closeOverlay(type) {
  closeOverlayById(`overlay-${type}`);
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!isValidEmail(email)) {
    toastr.error('Informe um e-mail válido');
    return;
  }
  if (!password) {
    toastr.error('Informe sua senha');
    return;
  }

  loadFromStorage();
  if (email !== userProfile.email || password !== userProfile.password) {
    toastr.error('E-mail ou senha inválidos');
    return;
  }

  currentUser = { name: userProfile.name || 'Usuário', email: userProfile.email };
  localStorage.setItem('exerciseHub_currentUser', JSON.stringify(currentUser));
  toastr.success('Login realizado!');
  closeOverlay('login');
  enterApp();
}

function register() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;

  if (name.length < 3) {
    toastr.error('Informe um nome com pelo menos 3 caracteres');
    return;
  }
  if (!isValidEmail(email)) {
    toastr.error('Informe um e-mail válido');
    return;
  }
  if (password.length < 6) {
    toastr.error('A senha deve ter no mínimo 6 caracteres');
    return;
  }

  userProfile = {
    ...userProfile,
    name,
    email,
    password,
    joinDate: userProfile.joinDate || new Date().toISOString()
  };
  currentUser = { name, email };
  saveToStorage();
  localStorage.setItem('exerciseHub_currentUser', JSON.stringify(currentUser));
  toastr.success('Cadastro realizado! Entrando...');
  closeOverlay('register');
  enterApp();
}

function enterApp() {
  loadFromStorage();
  setupNovoRegistroEnhancements();
  document.getElementById('home').classList.add('d-none');
  document.getElementById('app').classList.remove('d-none');
  applySidebarStateForViewport();
  document.getElementById('userName').textContent = currentUser?.name || userProfile.name;
  showAppPage('dashboard');
  loadBiblioteca();
  loadFavoritos();
  updateDashboardChart();
  carregarPerfil();
}

function logout() {
  closeMobileSidebar();
  document.body.classList.remove('sidebar-open');
  if (activeOverlayId) closeOverlayById(activeOverlayId);
  currentUser = null;
  localStorage.removeItem('exerciseHub_currentUser');
  document.getElementById('app').classList.add('d-none');
  document.getElementById('home').classList.remove('d-none');
}

function showAppPage(page) {
  document.querySelectorAll('.app-content').forEach(el => el.classList.remove('active'));
  document.getElementById('app-' + page).classList.add('active');
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  closeMobileSidebar();

  // load dynamic data when switching pages
  if (page === 'historico') loadHistorico();
  if (page === 'metas') loadMetas();
  if (page === 'novo') updateNovoRegistroPreview();
  if (page === 'dashboard') updateDashboardChart();
  if (page === 'perfil') carregarPerfil();
  if (page === 'mapa') setupMuscleMaps();
}

function isMobileViewport() {
  return window.matchMedia(SIDEBAR_MOBILE_QUERY).matches;
}

function getSidebarElements() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggleBtn = document.getElementById('toggleBtn');
  const icon = toggleBtn ? toggleBtn.querySelector('i') : null;
  return { sidebar, mainContent, toggleBtn, icon };
}

function getSavedSidebarCollapsedState() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
}

function updateSidebarToggleButton({ mobileOpen = false, desktopCollapsed = false } = {}) {
  const { toggleBtn, icon } = getSidebarElements();
  if (!toggleBtn || !icon) return;

  const mobile = isMobileViewport();
  icon.classList.remove('fa-bars', 'fa-xmark', 'fa-chevron-right');

  if (mobile) {
    icon.classList.add(mobileOpen ? 'fa-xmark' : 'fa-bars');
  } else {
    icon.classList.add('fa-chevron-right');
  }

  toggleBtn.classList.toggle('is-open', mobile && mobileOpen);
  toggleBtn.classList.toggle('is-collapsed', !mobile && desktopCollapsed);
  const expanded = mobile ? mobileOpen : !desktopCollapsed;
  toggleBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  const label = mobile
    ? (mobileOpen ? 'Fechar menu lateral' : 'Abrir menu lateral')
    : (desktopCollapsed ? 'Expandir menu lateral' : 'Retrair menu lateral');
  toggleBtn.setAttribute('aria-label', label);
  toggleBtn.setAttribute('title', label);
}

function setDesktopSidebarCollapsed(collapsed, persist = true) {
  if (isMobileViewport()) return;
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  sidebar.classList.remove('open');
  sidebar.classList.toggle('collapsed', collapsed);
  mainContent.classList.toggle('sidebar-collapsed', collapsed);
  document.body.classList.remove('sidebar-open');

  if (persist) {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  }
  updateSidebarToggleButton({ desktopCollapsed: collapsed });
}

function applySidebarStateForViewport() {
  const { sidebar, mainContent } = getSidebarElements();
  if (!sidebar || !mainContent) return;

  if (isMobileViewport()) {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('sidebar-collapsed');
    const isOpen = sidebar.classList.contains('open');
    document.body.classList.toggle('sidebar-open', isOpen);
    updateSidebarToggleButton({ mobileOpen: isOpen });
    return;
  }

  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  setDesktopSidebarCollapsed(getSavedSidebarCollapsedState(), false);
}

function closeMobileSidebar() {
  if (!isMobileViewport()) return;
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  updateSidebarToggleButton({ mobileOpen: false });
}

function toggleSidebar() {
  const { sidebar } = getSidebarElements();
  if (!sidebar) return;

  if (isMobileViewport()) {
    const isOpen = sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', isOpen);
    updateSidebarToggleButton({ mobileOpen: isOpen });
    return;
  }

  const collapsed = !sidebar.classList.contains('collapsed');
  setDesktopSidebarCollapsed(collapsed, true);
}

function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.toggle('collapsed');
  }
}

// ==================== MAPA MUSCULAR ====================
function setupMuscleMaps() {
  const frontMap = document.getElementById('muscleMapFront');
  const backMap = document.getElementById('muscleMapBack');
  
  if (frontMap && !frontMap.dataset.bound) {
    frontMap.querySelectorAll('.muscle-zone').forEach(zone => {
      const muscle = zone.getAttribute('data-muscle');
      zone.setAttribute('role', 'button');
      zone.setAttribute('tabindex', '0');
      zone.setAttribute('aria-label', `Selecionar ${muscle}`);
      zone.addEventListener('click', () => filterByMuscle(muscle));
      zone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          filterByMuscle(muscle);
        }
      });
    });
    frontMap.dataset.bound = 'true';
  }
  
  if (backMap && !backMap.dataset.bound) {
    backMap.querySelectorAll('.muscle-zone').forEach(zone => {
      const muscle = zone.getAttribute('data-muscle');
      zone.setAttribute('role', 'button');
      zone.setAttribute('tabindex', '0');
      zone.setAttribute('aria-label', `Selecionar ${muscle}`);
      zone.addEventListener('click', () => filterByMuscle(muscle));
      zone.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          filterByMuscle(muscle);
        }
      });
    });
    backMap.dataset.bound = 'true';
  }

  setMuscleView(muscleView);
  updateMuscleSelectionUI();
}

function setMuscleView(view) {
  muscleView = ['front', 'back', 'both'].includes(view) ? view : 'both';

  document.querySelectorAll('[data-view-btn]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.viewBtn === muscleView);
  });

  document.querySelectorAll('[data-view-panel]').forEach(panel => {
    const panelView = panel.dataset.viewPanel;
    const visible = muscleView === 'both' || panelView === muscleView;
    panel.classList.toggle('hidden', !visible);
  });
}

function getExercisesByMuscle(muscle) {
  return biblioteca.filter(ex => ex.muscle === muscle || ex.secondary.includes(muscle));
}

function updateMuscleSelectionUI() {
  const selectedNameEl = document.getElementById('selectedMuscleName');
  const selectedCountEl = document.getElementById('selectedMuscleCount');
  const hasSelection = Boolean(selectedMuscle);
  const filtered = hasSelection ? getExercisesByMuscle(selectedMuscle) : [];

  if (selectedNameEl) selectedNameEl.textContent = hasSelection ? selectedMuscle : 'Nenhum';
  if (selectedCountEl) selectedCountEl.textContent = String(filtered.length);

  document.querySelectorAll('.muscle-zone').forEach(zone => {
    const isActive = hasSelection && zone.getAttribute('data-muscle') === selectedMuscle;
    zone.classList.toggle('active-zone', isActive);
    zone.classList.toggle('dimmed-zone', hasSelection && !isActive);
  });

  document.querySelectorAll('[data-muscle-chip]').forEach(chip => {
    const chipMuscle = chip.dataset.muscleChip;
    const isActive = hasSelection ? chipMuscle === selectedMuscle : chipMuscle === '';
    chip.classList.toggle('active', isActive);
  });
}

function clearMuscleSelection() {
  selectedMuscle = null;
  updateMuscleSelectionUI();
  const container = document.getElementById('muscleExercises');
  if (container) {
    container.innerHTML = '<p class="text-muted text-center">Selecione um músculo para ver os exercícios</p>';
  }
}

function filterByMuscle(muscle) {
  selectedMuscle = muscle;
  const filtered = getExercisesByMuscle(muscle);
  const container = document.getElementById('muscleExercises');
  updateMuscleSelectionUI();
  
  if (filtered.length === 0) {
    container.innerHTML = `<div class="text-center py-5"><i class="fas fa-info-circle" style="font-size:48px;color:#666;"></i><p class="text-muted mt-3">Nenhum exercício encontrado para ${muscle}</p></div>`;
    return;
  }
  
  container.innerHTML = `
    <h5 class="mb-2">Exercícios para <span class="text-success">${muscle}</span></h5>
    <p class="text-muted mb-3">${filtered.length} exercício(s) relacionado(s)</p>
    <div class="row g-3" id="muscleExercisesList">
      ${filtered.map(ex => {
        const badgeClass = ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard';
        return `
          <div class="col-md-4 col-lg-3">
            <div class="exercise-card" onclick="abrirModalExercicio(${ex.id})">
              <img src="${ex.gif}" alt="${ex.name}">
              <h5 class="mt-2 mb-1">${ex.name}</h5>
              <div class="exercise-tags">
                <span class="badge ${badgeClass}">${ex.difficulty}</span>
                <span class="badge bg-info">${ex.muscle}</span>
                <span class="badge bg-secondary">${ex.equip}</span>
              </div>
              <button class="btn btn-sm btn-outline-warning mt-2 w-100" onclick="event.stopPropagation(); toggleFavorite(${ex.id})">
                <i class="fa${favorites.includes(ex.id) ? 's' : 'r'} fa-heart"></i> Favorito
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ==================== BIBLIOTECA + FILTROS + FAVORITOS ====================
function loadBiblioteca() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const muscle = document.getElementById('muscleFilter').value;
  const equip = document.getElementById('equipFilter').value;
  const difficulty = document.getElementById('difficultyFilter').value;
  const sort = document.getElementById('sortFilter').value;

  let filtered = biblioteca.filter(ex => {
    return (search === '' || ex.name.toLowerCase().includes(search) || ex.muscle.toLowerCase().includes(search)) &&
           (muscle === '' || ex.muscle === muscle) &&
           (equip === '' || ex.equip === equip) &&
           (difficulty === '' || ex.difficulty === difficulty);
  });

  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'difficulty') {
    const diffOrder = { 'Fácil': 1, 'Média': 2, 'Alta': 3 };
    filtered.sort((a, b) => diffOrder[a.difficulty] - diffOrder[b.difficulty]);
  }

  document.getElementById('exerciseCount').textContent = `Exercícios encontrados: ${filtered.length}`;
  const container = document.getElementById('bibliotecaList');
  container.innerHTML = filtered.map(ex => {
    const badgeClass = ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard';
    return `
    <div class="col-md-4 col-lg-3">
      <div class="exercise-card" onclick="abrirModalExercicio(${ex.id})">
        <img src="${ex.gif}" alt="${ex.name}">
        <h5 class="mt-2 mb-1">${ex.name}</h5>
        <div class="exercise-tags">
          <span class="badge ${badgeClass}">${ex.difficulty}</span>
          <span class="badge bg-info">${ex.muscle}</span>
          <span class="badge bg-secondary">${ex.equip}</span>
        </div>
        <button class="btn btn-sm btn-outline-warning mt-2 w-100" onclick="event.stopPropagation(); toggleFavorite(${ex.id})">
          <i class="fa${favorites.includes(ex.id) ? 's' : 'r'} fa-heart"></i> Favorito
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function resetBibliotecaFiltros() {
  document.getElementById('searchInput').value = '';
  document.getElementById('muscleFilter').value = '';
  document.getElementById('equipFilter').value = '';
  document.getElementById('difficultyFilter').value = '';
  loadBiblioteca();
}

function abrirModalExercicio(id) {
  const ex = biblioteca.find(e => e.id === id);
  if (!ex) return;
  const isFav = favorites.includes(ex.id);
  document.getElementById('modalExerciseContent').innerHTML = `
    <div class="text-center mb-3">
      <img src="${ex.gif}" alt="${ex.name}" class="exercise-modal-image">
    </div>
    <h3 id="exerciseModalTitle" class="mb-2">${ex.name}</h3>
    <div class="mb-3">
      <span class="badge ${ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard'}">${ex.difficulty}</span>
      <span class="badge bg-info">${ex.muscle}</span>
      <span class="badge bg-secondary">${ex.equip}</span>
      <span class="badge bg-success">${ex.level}</span>
    </div>
    <div class="mb-3">
      <h5>Músculo Principal</h5>
      <p>${ex.muscle}</p>
      <h5>Músculos Secundários</h5>
      <p>${ex.secondary}</p>
    </div>
    <div class="mb-3" style="background:#052e16;padding:12px;border-radius:8px;">
      <h5>Instruções</h5>
      <p style="white-space:pre-wrap;">${ex.instructions}</p>
    </div>
    <div class="mb-3" style="background:#1a3a1a;padding:12px;border-radius:8px;">
      <h5>Dicas</h5>
      <p>${ex.tips}</p>
    </div>
    <button onclick="toggleFavorite(${ex.id}); fecharModalExercicio();" class="btn btn-emerald w-100">
      <i class="fa${isFav ? 's' : 'r'} fa-heart"></i> ${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
    </button>
  `;
  openOverlayById('exerciseModal');
}

function fecharModalExercicio() {
  closeOverlayById('exerciseModal');
}

document.getElementById('searchInput').addEventListener('input', loadBiblioteca);
document.getElementById('muscleFilter').addEventListener('change', loadBiblioteca);
document.getElementById('equipFilter').addEventListener('change', loadBiblioteca);
document.getElementById('difficultyFilter').addEventListener('change', loadBiblioteca);
document.getElementById('sortFilter').addEventListener('change', loadBiblioteca);

function toggleFavorite(id) {
  const index = favorites.indexOf(id);
  if (index > -1) {
    favorites.splice(index, 1);
    toastr.info("Removido dos favoritos");
  } else {
    favorites.push(id);
    toastr.success("Adicionado aos favoritos");
  }
  saveToStorage();
  loadFavoritos();
  loadBiblioteca(); // Atualiza os corações na biblioteca
  if (selectedMuscle) filterByMuscle(selectedMuscle);
}

function loadFavoritos() {
  const container = document.getElementById('favoritosList');
  const favEx = biblioteca.filter(ex => favorites.includes(ex.id));
  container.innerHTML = favEx.length === 0 ? 
    '<div class="text-center py-5"><i class="far fa-heart" style="font-size:48px;color:#666;"></i><p class="text-muted mt-3">Nenhum favorito adicionado ainda.<br>Clique no coração para adicionar!</p></div>' : 
    favEx.map(ex => `
      <div class="col-md-4">
        <div class="exercise-card">
          <img src="${ex.gif}" alt="${ex.name}">
          <h5 class="mt-2">${ex.name}</h5>
          <p class="text-muted">Músculo: ${ex.muscle}</p>
          <button onclick="toggleFavorite(${ex.id})" class="btn btn-sm btn-outline-warning"><i class="fas fa-heart"></i> Remover</button>
        </div>
      </div>
    `).join('');
}

// ==================== OUTRAS FUNÇÕES (MESMO DE ANTES) ====================
function getWeightForCalorieEstimate() {
  const inputWeight = Number.parseFloat(document.getElementById('userWeight')?.value || '');
  if (Number.isFinite(inputWeight) && inputWeight > 0) return inputWeight;
  if (Number.isFinite(userProfile.weight) && userProfile.weight > 0) return userProfile.weight;
  return 70;
}

function estimateSessionCalories(duration, intensity) {
  const metMap = { Baixa: 4, 'Média': 6, Alta: 8 };
  const met = metMap[intensity] || 6;
  const weight = getWeightForCalorieEstimate();
  const calories = (met * 3.5 * weight / 200) * duration;
  return Math.round(calories);
}

function getSessionWorkload(duration, intensity) {
  const intensityFactor = intensity === 'Alta' ? 3 : intensity === 'Média' ? 2 : 1;
  const score = duration * intensityFactor;
  if (score >= 240) return 'Muito alta';
  if (score >= 150) return 'Alta';
  if (score >= 90) return 'Moderada';
  return 'Leve';
}

function updateNovoRegistroPreview() {
  const date = document.getElementById('exDate')?.value || '';
  const type = document.getElementById('exType')?.value || '--';
  const equip = document.getElementById('exEquip')?.value || 'Nenhum';
  const intensity = document.getElementById('exIntensity')?.value || '--';
  const duration = Number.parseInt(document.getElementById('exDuration')?.value || '0', 10) || 0;

  const dateLabel = date ? formatExerciseDate(date).full : '--';
  const calories = estimateSessionCalories(duration, intensity);
  const workload = getSessionWorkload(duration, intensity);

  const map = {
    nrPreviewDate: dateLabel,
    nrPreviewType: type,
    nrPreviewDuration: `${duration} min`,
    nrPreviewIntensity: intensity,
    nrPreviewEquip: equip,
    nrPreviewCalories: `${calories} kcal`,
    nrPreviewWorkload: workload
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function syncDurationFromNumberInput() {
  const durationInput = document.getElementById('exDuration');
  const rangeInput = document.getElementById('exDurationRange');
  if (!durationInput || !rangeInput) return;
  const value = Math.max(5, Math.min(480, Number.parseInt(durationInput.value || '60', 10) || 60));
  durationInput.value = value;
  rangeInput.value = Math.max(5, Math.min(180, value));
  updateNovoRegistroPreview();
}

function syncDurationFromRangeInput() {
  const durationInput = document.getElementById('exDuration');
  const rangeInput = document.getElementById('exDurationRange');
  if (!durationInput || !rangeInput) return;
  durationInput.value = rangeInput.value;
  updateNovoRegistroPreview();
}

function setExDatePreset(preset) {
  const dateInput = document.getElementById('exDate');
  if (!dateInput) return;
  const base = new Date();
  if (preset === 'yesterday') base.setDate(base.getDate() - 1);
  dateInput.value = base.toISOString().split('T')[0];
  updateNovoRegistroPreview();
}

function applyDurationPreset(minutes) {
  const durationInput = document.getElementById('exDuration');
  if (!durationInput) return;
  durationInput.value = String(minutes);
  syncDurationFromNumberInput();
}

function applyIntensityPreset(intensity) {
  const intensityInput = document.getElementById('exIntensity');
  if (!intensityInput) return;
  intensityInput.value = intensity;
  updateNovoRegistroPreview();
}

function resetNovoRegistroForm() {
  const exDate = document.getElementById('exDate');
  if (exDate) exDate.value = getTodayISODate();
  document.getElementById('exType').value = 'Musculação';
  document.getElementById('exEquip').value = '';
  document.getElementById('exDuration').value = 60;
  document.getElementById('exIntensity').value = 'Média';
  const sessionGoal = document.getElementById('exSessionGoal');
  const notes = document.getElementById('exNotes');
  if (sessionGoal) sessionGoal.value = '';
  if (notes) notes.value = '';
  syncDurationFromNumberInput();
  updateNovoRegistroPreview();
}

function setupNovoRegistroEnhancements() {
  const fieldsToWatch = ['exDate', 'exType', 'exEquip', 'exDuration', 'exIntensity', 'exSessionGoal', 'exNotes'];
  fieldsToWatch.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound === 'true') return;
    el.addEventListener('input', updateNovoRegistroPreview);
    el.addEventListener('change', updateNovoRegistroPreview);
    el.dataset.bound = 'true';
  });

  const durationInput = document.getElementById('exDuration');
  if (durationInput && durationInput.dataset.syncBound !== 'true') {
    durationInput.addEventListener('input', syncDurationFromNumberInput);
    durationInput.addEventListener('change', syncDurationFromNumberInput);
    durationInput.dataset.syncBound = 'true';
  }

  const rangeInput = document.getElementById('exDurationRange');
  if (rangeInput && rangeInput.dataset.syncBound !== 'true') {
    rangeInput.addEventListener('input', syncDurationFromRangeInput);
    rangeInput.dataset.syncBound = 'true';
  }

  syncDurationFromNumberInput();
  updateNovoRegistroPreview();
}

function adicionarExercicio() {
  const payload = {
    date: document.getElementById('exDate').value,
    type: document.getElementById('exType').value,
    equip: document.getElementById('exEquip').value,
    duration: document.getElementById('exDuration').value,
    intensity: document.getElementById('exIntensity').value,
    sessionGoal: document.getElementById('exSessionGoal')?.value || '',
    notes: document.getElementById('exNotes')?.value || ''
  };
  const validation = validateExercisePayload(payload);
  if (!validation.valid) {
    toastr.error(validation.message);
    return;
  }

  validation.data.calories = estimateSessionCalories(validation.data.duration, validation.data.intensity);
  exercises.push(validation.data);
  saveToStorage();
  toastr.success('Exercício registrado!');
  resetNovoRegistroForm();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
}

function getFilteredHistorico(returnWithIndex = false) {
  const from = document.getElementById('histFrom').value;
  const to = document.getElementById('histTo').value;
  const search = document.getElementById('histSearch').value.toLowerCase().trim();
  const type = document.getElementById('histType').value;
  const equip = document.getElementById('histEquip') ? document.getElementById('histEquip').value : '';
  const intensity = document.getElementById('histIntensity').value;
  let filtered = exercises.map((e,i)=>({ e, i }));
  if (from) filtered = filtered.filter(o => o.e.date >= from);
  if (to) filtered = filtered.filter(o => o.e.date <= to);
  if (search) {
    filtered = filtered.filter(o => {
      const haystack = `${o.e.type} ${o.e.equip || 'nenhum'} ${o.e.intensity} ${o.e.date} ${o.e.sessionGoal || ''} ${o.e.notes || ''}`.toLowerCase();
      return haystack.includes(search);
    });
  }
  if (type) filtered = filtered.filter(o => o.e.type === type);
  if (equip) filtered = filtered.filter(o => o.e.equip === equip);
  if (intensity) filtered = filtered.filter(o => o.e.intensity === intensity);
  const sort = document.getElementById('histSort').value;
  if (sort === 'recent') filtered.sort((a,b)=> b.e.date.localeCompare(a.e.date));
  else if (sort === 'oldest') filtered.sort((a,b)=> a.e.date.localeCompare(b.e.date));
  else if (sort === 'longest') filtered.sort((a,b)=> b.e.duration - a.e.duration);
  else if (sort === 'shortest') filtered.sort((a,b)=> a.e.duration - b.e.duration);
  if (returnWithIndex) return filtered;
  return filtered.map(o=>o.e);
}

function clearHistoricoFiltros() {
  document.getElementById('histFrom').value = '';
  document.getElementById('histTo').value = '';
  document.getElementById('histSearch').value = '';
  document.getElementById('histType').value = '';
  document.getElementById('histEquip').value = '';
  document.getElementById('histIntensity').value = '';
  document.getElementById('histSort').value = 'recent';
  loadHistorico();
}

function formatExerciseDate(dateISO) {
  const dateObj = new Date(`${dateISO}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) {
    return { full: dateISO, weekday: '' };
  }
  const full = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  return { full, weekday };
}

function getHistoricoKpis(list) {
  const totalMin = list.reduce((acc, ex) => acc + ex.duration, 0);
  const avgMin = list.length ? (totalMin / list.length).toFixed(1) : '0.0';
  const longest = list.length ? Math.max(...list.map(ex => ex.duration)) : 0;
  const uniqueDays = new Set(list.map(ex => ex.date)).size;
  const typeCount = {};
  list.forEach(ex => {
    typeCount[ex.type] = (typeCount[ex.type] || 0) + 1;
  });
  const topType = Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0] || 'N/A';
  return { totalMin, avgMin, longest, uniqueDays, topType };
}

function getIntensityClass(intensity) {
  if (intensity === 'Baixa') return 'int-baixa';
  if (intensity === 'Alta') return 'int-alta';
  return 'int-media';
}

function loadHistorico() {
  const container = document.getElementById('historicoList');
  const summaryText = document.getElementById('histSummary');
  const summaryCards = document.getElementById('histSummaryCards');
  const listWithIndex = getFilteredHistorico(true);
  const list = listWithIndex.map(o=>o.e);

  const kpi = getHistoricoKpis(list);
  summaryCards.innerHTML = `
    <div class="historico-kpi"><p>Total de minutos</p><strong>${kpi.totalMin}</strong></div>
    <div class="historico-kpi"><p>Registros</p><strong>${list.length}</strong></div>
    <div class="historico-kpi"><p>Média por treino</p><strong>${kpi.avgMin} min</strong></div>
    <div class="historico-kpi"><p>Maior sessão</p><strong>${kpi.longest} min</strong></div>
  `;

  if (list.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><i class="fas fa-inbox" style="font-size:48px;color:#666;"></i><p class="text-muted mt-3">Nenhum exercício registrado ainda.<br>Comece a treinar agora!</p></div>';
    summaryText.innerHTML = '<small class="text-muted">Sem dados para o filtro atual.</small>';
    return;
  }

  summaryText.innerHTML =
    `<strong>Dias ativos:</strong> ${kpi.uniqueDays} &nbsp;|&nbsp; <strong>Atividade mais frequente:</strong> ${escapeHTML(kpi.topType)}`;

  container.innerHTML = listWithIndex.map(o => {
    const ex = o.e;
    const formatted = formatExerciseDate(ex.date);
    const safeType = escapeHTML(ex.type);
    const safeEquip = escapeHTML(ex.equip || 'Nenhum');
    const safeIntensity = escapeHTML(ex.intensity);

    return `
    <div class="historico-item">
      <div class="historico-main">
        <p class="historico-date">${formatted.full} <small>${formatted.weekday}</small></p>
        <p class="historico-type">${safeType}</p>
        <div class="historico-tags">
          <span class="hist-tag"><i class="fa-regular fa-clock"></i> ${ex.duration} min</span>
          <span class="hist-tag"><i class="fa-solid fa-dumbbell"></i> ${safeEquip}</span>
          <span class="hist-tag ${getIntensityClass(ex.intensity)}"><i class="fa-solid fa-bolt"></i> ${safeIntensity}</span>
          ${Number.isFinite(ex.calories) ? `<span class="hist-tag"><i class="fa-solid fa-fire"></i> ${ex.calories} kcal</span>` : ''}
          ${ex.sessionGoal ? `<span class="hist-tag"><i class="fa-solid fa-bullseye"></i> ${escapeHTML(ex.sessionGoal)}</span>` : ''}
        </div>
        ${ex.notes ? `<p class="text-muted small mt-2 mb-0">${escapeHTML(ex.notes)}</p>` : ''}
      </div>
      <div class="historico-actions">
        <button class="btn btn-sm btn-outline-info" onclick="editarEx(${o.i})">Editar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="removerEx(${o.i})">Excluir</button>
      </div>
    </div>
  `;
  }).join('');
}

function removerEx(index) {
  const ex = exercises[index];
  if (!ex) return;
  if (!confirm(`Remover o registro de ${ex.type} do dia ${ex.date}?`)) return;
  exercises.splice(index, 1);
  saveToStorage();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
  carregarEstatisticas();
  toastr.success('Registro removido com sucesso!');
}

function adicionarMeta() {
  const desc = document.getElementById('metaDesc').value.trim();
  const min = parseInt(document.getElementById('metaMin').value, 10);
  const period = document.getElementById('metaPeriod').value;
  const priority = document.getElementById('metaPriority').value;

  if (desc.length < 5) {
    toastr.error('Descreva a meta com pelo menos 5 caracteres');
    return;
  }
  if (!Number.isFinite(min) || min < 30 || min > 5000) {
    toastr.error('Informe minutos entre 30 e 5000');
    return;
  }
  if (!['weekly', 'monthly'].includes(period)) {
    toastr.error('Selecione um período válido');
    return;
  }
  if (!['Alta', 'Média', 'Baixa'].includes(priority)) {
    toastr.error('Selecione uma prioridade válida');
    return;
  }

  goals.push({
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    desc,
    min,
    period,
    priority,
    done: false,
    createdAt: new Date().toISOString(),
    doneAt: null
  });
  saveToStorage();
  toastr.success('Meta adicionada!');
  document.getElementById('metaDesc').value = '';
  document.getElementById('metaMin').value = 300;
  document.getElementById('metaPeriod').value = 'weekly';
  document.getElementById('metaPriority').value = 'Alta';
  loadMetas();
}

function normalizeGoal(goal, index) {
  return {
    id: goal.id || `goal_legacy_${index}`,
    desc: String(goal.desc || '').trim(),
    min: Number.parseInt(goal.min, 10) || 0,
    period: goal.period === 'monthly' ? 'monthly' : 'weekly',
    priority: ['Alta', 'Média', 'Baixa'].includes(goal.priority) ? goal.priority : 'Média',
    done: Boolean(goal.done),
    createdAt: goal.createdAt || new Date().toISOString(),
    doneAt: goal.doneAt || null
  };
}

function ensureGoalSchema() {
  goals = goals.map((goal, index) => normalizeGoal(goal, index));
}

function getPeriodRange(period) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: 'neste mês', periodLabel: 'mês' };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return { start, end, label: 'nos últimos 7 dias', periodLabel: 'semana' };
}

function getMinutesByPeriod(period) {
  const { start, end } = getPeriodRange(period);
  return exercises.reduce((total, ex) => {
    const exDate = new Date(`${ex.date}T00:00:00`);
    if (Number.isNaN(exDate.getTime())) return total;
    return exDate >= start && exDate <= end ? total + ex.duration : total;
  }, 0);
}

function getMetaProgress(goal) {
  const currentMinutes = getMinutesByPeriod(goal.period);
  const minutesDone = Math.max(0, currentMinutes);
  const percent = goal.min > 0 ? Math.min(100, Math.round((minutesDone / goal.min) * 100)) : 0;
  const isCompleted = goal.done || minutesDone >= goal.min;
  let statusText = `Em progresso (${percent}%)`;
  let statusClass = 'pending';

  if (isCompleted) {
    statusText = 'Concluída';
    statusClass = 'done';
  } else if (percent >= 70) {
    statusText = `Quase lá (${percent}%)`;
    statusClass = 'warning';
  }

  return { minutesDone, percent, isCompleted, statusText, statusClass };
}

function getPriorityClass(priority) {
  if (priority === 'Alta') return 'alta';
  if (priority === 'Baixa') return 'baixa';
  return 'media';
}

function toggleMetaDone(metaId) {
  ensureGoalSchema();
  const meta = goals.find(g => g.id === metaId);
  if (!meta) return;
  meta.done = !meta.done;
  meta.doneAt = meta.done ? new Date().toISOString() : null;
  saveToStorage();
  loadMetas();
}

function removerMeta(metaId) {
  ensureGoalSchema();
  const index = goals.findIndex(g => g.id === metaId);
  if (index < 0) return;
  goals.splice(index, 1);
  saveToStorage();
  toastr.info('Meta removida');
  loadMetas();
}

function limparMetasConcluidas() {
  ensureGoalSchema();
  const before = goals.length;
  goals = goals.filter(goal => {
    const progress = getMetaProgress(goal);
    return !progress.isCompleted;
  });
  const removed = before - goals.length;
  saveToStorage();
  if (removed > 0) toastr.success(`${removed} meta(s) concluída(s) removida(s)`);
  else toastr.info('Não há metas concluídas para remover');
  loadMetas();
}

function loadMetas() {
  ensureGoalSchema();
  const container = document.getElementById('metasList');
  const summary = document.getElementById('metasSummary');
  const minutosSemana = getMinutesByPeriod('weekly');
  const minutosMes = getMinutesByPeriod('monthly');

  const completedCount = goals.filter(goal => getMetaProgress(goal).isCompleted).length;
  const activeCount = goals.length - completedCount;

  summary.innerHTML = `
    <div class="metas-summary-card">
      <p>Metas Ativas</p>
      <strong>${activeCount}</strong>
    </div>
    <div class="metas-summary-card">
      <p>Concluídas</p>
      <strong>${completedCount}</strong>
    </div>
    <div class="metas-summary-card">
      <p>Treino na Semana</p>
      <strong>${minutosSemana} min</strong>
    </div>
    <div class="metas-summary-card">
      <p>Treino no Mês</p>
      <strong>${minutosMes} min</strong>
    </div>
    <div class="metas-summary-card">
      <p>Total de Metas</p>
      <strong>${goals.length}</strong>
    </div>
    <div class="metas-summary-card">
      <p>Taxa de Conclusão</p>
      <strong>${goals.length ? Math.round((completedCount / goals.length) * 100) : 0}%</strong>
    </div>
  `;

  if (goals.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><i class="fas fa-target" style="font-size:48px;color:#666;"></i><p class="text-muted mt-3">Nenhuma meta cadastrada ainda.<br>Defina suas metas para melhorar!</p></div>';
    return;
  }

  const priorityOrder = { Alta: 0, 'Média': 1, Baixa: 2 };
  const sortedGoals = [...goals].sort((a, b) => {
    const progressA = getMetaProgress(a);
    const progressB = getMetaProgress(b);
    if (progressA.isCompleted !== progressB.isCompleted) return progressA.isCompleted ? 1 : -1;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  container.innerHTML = `<div class="row g-3">${sortedGoals.map(goal => {
    const progress = getMetaProgress(goal);
    const periodInfo = getPeriodRange(goal.period);
    const safeDesc = escapeHTML(goal.desc);

    return `
    <div class="col-lg-6">
      <div class="meta-card">
        <div class="meta-top">
          <div>
            <p class="meta-title">${safeDesc}</p>
            <p class="meta-subtitle">${goal.min} min por ${periodInfo.periodLabel} (${periodInfo.label})</p>
          </div>
          <span class="meta-priority ${getPriorityClass(goal.priority)}">${goal.priority}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">${progress.minutesDone} / ${goal.min} min</small>
          <small class="text-muted">${progress.percent}%</small>
        </div>
        <div class="progress meta-progress">
          <div class="progress-bar ${progress.isCompleted ? 'bg-success' : 'bg-info'}" style="width:${progress.percent}%"></div>
        </div>
        <div class="meta-footer">
          <span class="meta-status ${progress.statusClass}">${progress.statusText}</span>
          <div class="d-flex gap-2">
            <button class="btn btn-sm ${progress.isCompleted ? 'btn-outline-secondary' : 'btn-outline-success'}" onclick="toggleMetaDone('${goal.id}')">
              ${progress.isCompleted ? 'Reabrir' : 'Concluir'}
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="removerMeta('${goal.id}')">Remover</button>
          </div>
        </div>
      </div>
    </div>
  `;
  }).join('')}</div>`;
}

function exportHistoricoCSV() {
  const list = getFilteredHistorico();
  if (list.length === 0) {
    toastr.info('Nada para exportar');
    return;
  }

  const sortLabels = {
    recent: 'Mais recente',
    oldest: 'Mais antigo',
    longest: 'Maior duração',
    shortest: 'Menor duração'
  };
  const intensityScoreMap = { Baixa: 1, Média: 2, Alta: 3 };
  const toIntensityScore = (intensity) => intensityScoreMap[intensity] || 1;
  const toWorkloadLabel = (workload) => {
    if (workload >= 240) return 'Muito alta';
    if (workload >= 150) return 'Alta';
    if (workload >= 80) return 'Moderada';
    return 'Leve';
  };
  const sanitizeForExcel = (value) => {
    const text = String(value ?? '');
    return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  };
  const escapeCSV = (value) => {
    const text = sanitizeForExcel(value);
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const toCSVLine = (values) => values.map(escapeCSV).join(';');
  const formatDecimalBR = (value, digits = 1) => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return safeValue.toLocaleString('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  };

  const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
  const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const now = new Date();
  const exportDate = now.toLocaleString('pt-BR');

  const from = document.getElementById('histFrom').value;
  const to = document.getElementById('histTo').value;
  const search = document.getElementById('histSearch').value.trim();
  const type = document.getElementById('histType').value;
  const equip = document.getElementById('histEquip') ? document.getElementById('histEquip').value : '';
  const intensity = document.getElementById('histIntensity').value;
  const sort = document.getElementById('histSort').value;

  const csvDate = (isoDate) => {
    if (!isoDate) return '';
    const dateObj = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(dateObj.getTime()) ? isoDate : dateFormatter.format(dateObj);
  };
  const csvWeekday = (isoDate) => {
    if (!isoDate) return '';
    const dateObj = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(dateObj.getTime()) ? '' : weekdayFormatter.format(dateObj);
  };
  const csvMonthLabel = (monthKey) => {
    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) return monthKey || 'Não informado';
    const [year, month] = monthKey.split('-').map(Number);
    const dateObj = new Date(year, month - 1, 1);
    return Number.isNaN(dateObj.getTime())
      ? monthKey
      : dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const allDates = list
    .map(ex => ex.date)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  const periodFrom = from || (allDates[0] || '');
  const periodTo = to || (allDates[allDates.length - 1] || '');
  const filtrosAtivos = [
    from ? `Data inicial: ${csvDate(from)}` : '',
    to ? `Data final: ${csvDate(to)}` : '',
    search ? `Busca: ${search}` : '',
    type ? `Tipo: ${type}` : '',
    equip ? `Equipamento: ${equip}` : '',
    intensity ? `Intensidade: ${intensity}` : ''
  ].filter(Boolean);

  const totalMin = list.reduce((acc, ex) => acc + ex.duration, 0);
  const totalCalories = list.reduce((acc, ex) => {
    const calories = Number.isFinite(ex.calories) ? ex.calories : estimateSessionCalories(ex.duration, ex.intensity);
    return acc + calories;
  }, 0);
  const avgMin = list.length ? totalMin / list.length : 0;
  const uniqueDays = new Set(list.map(ex => ex.date)).size;
  const totalWorkload = list.reduce((acc, ex) => acc + (ex.duration * toIntensityScore(ex.intensity)), 0);
  const avgWorkload = list.length ? totalWorkload / list.length : 0;

  const statsByType = {};
  const statsByIntensity = {};
  const statsByDay = {};
  const statsByMonth = {};
  const statsByWeekday = {};
  list.forEach(ex => {
    const duration = Number.isFinite(ex.duration) ? ex.duration : 0;
    const typeKey = ex.type || 'Não informado';
    const intensityKey = ex.intensity || 'Não informado';
    const dayKey = ex.date || 'Sem data';
    const monthKey = (ex.date && /^\d{4}-\d{2}-\d{2}$/.test(ex.date)) ? ex.date.slice(0, 7) : 'Não informado';
    const calories = Number.isFinite(ex.calories) ? ex.calories : estimateSessionCalories(duration, ex.intensity);
    const workload = duration * toIntensityScore(ex.intensity);
    const dateObj = ex.date ? new Date(`${ex.date}T00:00:00`) : null;
    const hasValidDate = dateObj && !Number.isNaN(dateObj.getTime());
    const jsWeekDay = hasValidDate ? dateObj.getDay() : -1;
    const weekdayOrder = jsWeekDay === -1 ? 8 : (jsWeekDay === 0 ? 7 : jsWeekDay);
    const weekdayName = hasValidDate ? weekdayFormatter.format(dateObj) : 'Não informado';
    const weekdayKey = String(weekdayOrder);

    if (!statsByType[typeKey]) statsByType[typeKey] = { count: 0, minutes: 0, calories: 0 };
    if (!statsByIntensity[intensityKey]) statsByIntensity[intensityKey] = { count: 0, minutes: 0, calories: 0, workload: 0 };
    if (!statsByDay[dayKey]) {
      statsByDay[dayKey] = { count: 0, minutes: 0, calories: 0, workload: 0, weekday: csvWeekday(ex.date), dateBR: csvDate(ex.date) };
    }
    if (!statsByMonth[monthKey]) {
      statsByMonth[monthKey] = { count: 0, minutes: 0, calories: 0, workload: 0 };
    }
    if (!statsByWeekday[weekdayKey]) {
      statsByWeekday[weekdayKey] = { name: weekdayName, order: weekdayOrder, count: 0, minutes: 0, calories: 0, workload: 0 };
    }

    statsByType[typeKey].count += 1;
    statsByType[typeKey].minutes += duration;
    statsByType[typeKey].calories += calories;

    statsByIntensity[intensityKey].count += 1;
    statsByIntensity[intensityKey].minutes += duration;
    statsByIntensity[intensityKey].calories += calories;
    statsByIntensity[intensityKey].workload += workload;

    statsByDay[dayKey].count += 1;
    statsByDay[dayKey].minutes += duration;
    statsByDay[dayKey].calories += calories;
    statsByDay[dayKey].workload += workload;

    statsByMonth[monthKey].count += 1;
    statsByMonth[monthKey].minutes += duration;
    statsByMonth[monthKey].calories += calories;
    statsByMonth[monthKey].workload += workload;

    statsByWeekday[weekdayKey].count += 1;
    statsByWeekday[weekdayKey].minutes += duration;
    statsByWeekday[weekdayKey].calories += calories;
    statsByWeekday[weekdayKey].workload += workload;
  });

  const longestSession = list.reduce((best, ex) => (!best || ex.duration > best.duration ? ex : best), null);
  const shortestSession = list.reduce((best, ex) => (!best || ex.duration < best.duration ? ex : best), null);
  const topType = Object.entries(statsByType)
    .sort(([, a], [, b]) => b.minutes - a.minutes)[0]?.[0] || 'Não informado';

  const lines = [];
  lines.push('sep=;');
  lines.push(toCSVLine(['ExerciseHub - Relatório Profissional de Histórico']));
  lines.push(toCSVLine(['Usuário', userProfile.name || currentUser?.name || 'Usuário']));
  lines.push(toCSVLine(['E-mail', userProfile.email || currentUser?.email || '']));
  lines.push(toCSVLine(['Exportado em', exportDate]));
  lines.push(toCSVLine(['Período', `${csvDate(periodFrom)} até ${csvDate(periodTo)}`]));
  lines.push(toCSVLine(['Ordenação', sortLabels[sort] || sort || 'Mais recente']));
  lines.push(toCSVLine(['Filtros ativos', filtrosAtivos.length ? filtrosAtivos.join(' | ') : 'Nenhum']));
  lines.push(toCSVLine(['Registros', list.length]));
  lines.push(toCSVLine(['Dias ativos', uniqueDays]));
  lines.push(toCSVLine(['Total de minutos', totalMin]));
  lines.push(toCSVLine(['Média por treino (min)', formatDecimalBR(avgMin)]));
  lines.push(toCSVLine(['Calorias estimadas (kcal)', totalCalories]));
  lines.push(toCSVLine(['Carga total da sessão (pontos)', totalWorkload]));
  lines.push(toCSVLine(['Carga média por treino', formatDecimalBR(avgWorkload)]));
  lines.push(toCSVLine(['Atividade mais frequente', topType]));
  if (longestSession) {
    lines.push(toCSVLine(['Maior sessão', `${longestSession.duration} min (${longestSession.type || 'Não informado'} em ${csvDate(longestSession.date)})`]));
  }
  if (shortestSession) {
    lines.push(toCSVLine(['Menor sessão', `${shortestSession.duration} min (${shortestSession.type || 'Não informado'} em ${csvDate(shortestSession.date)})`]));
  }
  lines.push('');
  lines.push(toCSVLine(['Registros detalhados']));
  lines.push(toCSVLine([
    'Registro',
    'Data ISO',
    'Data BR',
    'Dia da semana',
    'Tipo',
    'Equipamento',
    'Duração (min)',
    'Duração (h)',
    'Intensidade',
    'Score de intensidade',
    'Carga da sessão',
    'Nível da sessão',
    '% do tempo total',
    'Calorias Est.',
    'Objetivo da sessão',
    'Anotações',
    'Exportado em'
  ]));

  list.forEach((e, index) => {
    const dateObj = new Date(`${e.date}T00:00:00`);
    const dataBR = Number.isNaN(dateObj.getTime()) ? '' : dateFormatter.format(dateObj);
    const diaSemana = Number.isNaN(dateObj.getTime()) ? '' : weekdayFormatter.format(dateObj);
    const duracaoHoras = e.duration / 60;
    const intensityScore = toIntensityScore(e.intensity);
    const workload = e.duration * intensityScore;
    const calories = Number.isFinite(e.calories) ? e.calories : estimateSessionCalories(e.duration, e.intensity);
    const shareMinutes = totalMin > 0 ? (e.duration / totalMin) * 100 : 0;

    lines.push(toCSVLine([
      index + 1,
      e.date,
      dataBR,
      diaSemana,
      e.type,
      e.equip || 'Nenhum',
      e.duration,
      formatDecimalBR(duracaoHoras, 2),
      e.intensity,
      intensityScore,
      workload,
      toWorkloadLabel(workload),
      `${formatDecimalBR(shareMinutes, 1)}%`,
      calories,
      e.sessionGoal || '',
      e.notes || '',
      exportDate
    ]));
  });

  lines.push('');
  lines.push(toCSVLine(['Resumo por atividade']));
  lines.push(toCSVLine(['Atividade', 'Registros', '% dos registros', 'Minutos', '% do tempo', 'Calorias Est.']));
  Object.entries(statsByType)
    .sort(([, a], [, b]) => b.minutes - a.minutes)
    .forEach(([activity, stat]) => {
      const shareRecords = list.length > 0 ? (stat.count / list.length) * 100 : 0;
      const share = totalMin > 0 ? (stat.minutes / totalMin) * 100 : 0;
      lines.push(toCSVLine([
        activity,
        stat.count,
        `${formatDecimalBR(shareRecords, 1)}%`,
        stat.minutes,
        `${formatDecimalBR(share, 1)}%`,
        stat.calories
      ]));
    });

  lines.push('');
  lines.push(toCSVLine(['Resumo por intensidade']));
  lines.push(toCSVLine(['Intensidade', 'Registros', '% dos registros', 'Minutos', '% do tempo', 'Calorias Est.', 'Carga total']));
  Object.entries(statsByIntensity)
    .sort(([, a], [, b]) => b.minutes - a.minutes)
    .forEach(([level, stat]) => {
      const shareRecords = list.length > 0 ? (stat.count / list.length) * 100 : 0;
      const share = totalMin > 0 ? (stat.minutes / totalMin) * 100 : 0;
      lines.push(toCSVLine([
        level,
        stat.count,
        `${formatDecimalBR(shareRecords, 1)}%`,
        stat.minutes,
        `${formatDecimalBR(share, 1)}%`,
        stat.calories,
        stat.workload
      ]));
    });

  lines.push('');
  lines.push(toCSVLine(['Resumo diário']));
  lines.push(toCSVLine(['Data ISO', 'Data BR', 'Dia da semana', 'Registros', 'Minutos', 'Calorias Est.', 'Carga total']));
  Object.entries(statsByDay)
    .sort(([dayA], [dayB]) => dayA.localeCompare(dayB))
    .forEach(([day, stat]) => {
      lines.push(toCSVLine([
        day,
        stat.dateBR,
        stat.weekday,
        stat.count,
        stat.minutes,
        stat.calories,
        stat.workload
      ]));
    });

  lines.push('');
  lines.push(toCSVLine(['Resumo por mês']));
  lines.push(toCSVLine(['Mês', 'Referência', 'Registros', 'Minutos', 'Calorias Est.', 'Carga total']));
  Object.entries(statsByMonth)
    .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    .forEach(([month, stat]) => {
      lines.push(toCSVLine([
        csvMonthLabel(month),
        month,
        stat.count,
        stat.minutes,
        stat.calories,
        stat.workload
      ]));
    });

  lines.push('');
  lines.push(toCSVLine(['Resumo por dia da semana']));
  lines.push(toCSVLine(['Dia', 'Registros', 'Minutos', '% do tempo', 'Calorias Est.', 'Carga total']));
  Object.values(statsByWeekday)
    .sort((a, b) => a.order - b.order)
    .forEach(stat => {
      const share = totalMin > 0 ? (stat.minutes / totalMin) * 100 : 0;
      lines.push(toCSVLine([
        stat.name,
        stat.count,
        stat.minutes,
        `${formatDecimalBR(share, 1)}%`,
        stat.calories,
        stat.workload
      ]));
    });

  const fileStamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-') + '_' + [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('-');

  const csv = `${lines.join('\n')}\n`;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historico_relatorio_profissional_${fileStamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function editarEx(index) {
  const ex = exercises[index];
  if (!ex) return;

  document.getElementById('editExerciseIndex').value = String(index);
  document.getElementById('editDate').value = ex.date;
  document.getElementById('editType').value = ex.type;
  document.getElementById('editEquip').value = ex.equip || '';
  document.getElementById('editDuration').value = ex.duration;
  document.getElementById('editIntensity').value = ex.intensity;
  openOverlayById('editExerciseModal');
}

function fecharModalEdicao() {
  closeOverlayById('editExerciseModal');
}

function salvarEdicaoExercicio() {
  const index = Number.parseInt(document.getElementById('editExerciseIndex').value, 10);
  if (!Number.isInteger(index) || !exercises[index]) {
    toastr.error('Registro inválido para edição');
    fecharModalEdicao();
    return;
  }

  const payload = {
    date: document.getElementById('editDate').value,
    type: document.getElementById('editType').value,
    equip: document.getElementById('editEquip').value,
    duration: document.getElementById('editDuration').value,
    intensity: document.getElementById('editIntensity').value
  };
  const validation = validateExercisePayload(payload);
  if (!validation.valid) {
    toastr.error(validation.message);
    return;
  }

  exercises[index] = {
    ...exercises[index],
    ...validation.data,
    calories: estimateSessionCalories(validation.data.duration, validation.data.intensity)
  };
  saveToStorage();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
  fecharModalEdicao();
  toastr.success('Registro atualizado com sucesso!');
}

// configura listeners para os filtros do histórico
['histFrom','histTo','histSearch','histType','histEquip','histIntensity','histSort'].forEach(id=>{
  const el=document.getElementById(id);
  if(el){ el.addEventListener('change', loadHistorico); el.addEventListener('input', loadHistorico); }
});

function setDashboardRange(range) {
  if (!['7d', '30d', 'all'].includes(range)) return;
  dashboardRange = range;
  updateDashboardChart();
}

function buildDashboardDailySeries(days) {
  const labels = [];
  const keys = [];
  const data = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    keys.push(key);
    labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    data.push(0);
  }

  const indexByKey = new Map(keys.map((key, idx) => [key, idx]));
  exercises.forEach(ex => {
    const idx = indexByKey.get(ex.date);
    if (idx !== undefined) data[idx] += ex.duration;
  });

  return { labels, keys, data };
}

function buildDashboardMonthlySeries() {
  const totalsByMonth = {};
  exercises.forEach(ex => {
    if (!ex?.date || !/^\d{4}-\d{2}-\d{2}$/.test(ex.date)) return;
    const monthKey = ex.date.slice(0, 7);
    totalsByMonth[monthKey] = (totalsByMonth[monthKey] || 0) + ex.duration;
  });

  const keys = Object.keys(totalsByMonth).sort((a, b) => a.localeCompare(b));
  const labels = keys.map(key => {
    const [year, month] = key.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    if (Number.isNaN(d.getTime())) return key;
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  });
  const data = keys.map(key => totalsByMonth[key]);
  return { labels, keys, data };
}

function getExercisesInDashboardRange(keys) {
  const keySet = new Set(keys);
  return exercises.filter(ex => keySet.has(ex.date));
}

function calculateBestDashboardDay(rangeExercises) {
  if (rangeExercises.length === 0) return '--';
  const totalsByDay = {};
  rangeExercises.forEach(ex => {
    totalsByDay[ex.date] = (totalsByDay[ex.date] || 0) + ex.duration;
  });
  const [bestDay, minutes] = Object.entries(totalsByDay).sort((a, b) => b[1] - a[1])[0];
  const formatted = formatExerciseDate(bestDay).full;
  return `${formatted} (${minutes} min)`;
}

function calculateCurrentStreak() {
  const uniqueDates = [...new Set(exercises.map(ex => ex.date).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  if (uniqueDates.length === 0) return 0;

  const today = getTodayISODate();
  const yesterdayDate = new Date(`${today}T00:00:00`);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(`${uniqueDates[i]}T00:00:00`);
    const next = new Date(`${uniqueDates[i + 1]}T00:00:00`);
    if (Number.isNaN(current.getTime()) || Number.isNaN(next.getTime())) break;
    const diffDays = Math.round((current - next) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) streak += 1;
    else break;
  }
  return streak;
}

function updateDashboardChart() {
  const rootStyles = getComputedStyle(document.documentElement);
  const barColor = rootStyles.getPropertyValue('--brand-accent').trim() || '#10b981';
  const tickColor = rootStyles.getPropertyValue('--chart-text').trim() || '#d4e3dd';
  const gridColor = rootStyles.getPropertyValue('--chart-grid').trim() || 'rgba(167, 187, 178, 0.22)';
  const isAllRange = dashboardRange === 'all';
  const days = dashboardRange === '30d' ? 30 : 7;
  const series = isAllRange ? buildDashboardMonthlySeries() : buildDashboardDailySeries(days);
  const { labels, keys, data } = series;
  const rangeExercises = isAllRange ? exercises : getExercisesInDashboardRange(keys);

  const totalMinutes = rangeExercises.reduce((acc, ex) => acc + ex.duration, 0);
  const sessionCount = rangeExercises.length;
  const avgDuration = sessionCount ? (totalMinutes / sessionCount).toFixed(1) : '0.0';
  const bestDay = calculateBestDashboardDay(rangeExercises);
  const streak = calculateCurrentStreak();

  const dashSubtitle = document.getElementById('dashboardSubtitle');
  if (dashSubtitle) {
    if (isAllRange) {
      dashSubtitle.textContent = 'Seu desempenho em todo o histórico registrado.';
    } else {
      dashSubtitle.textContent = days === 7 ? 'Seu desempenho nos últimos 7 dias.' : 'Seu desempenho nos últimos 30 dias.';
    }
  }
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText('dashTotalMinutes', String(totalMinutes));
  setText('dashSessionCount', String(sessionCount));
  setText('dashAvgDuration', `${avgDuration} min`);
  setText('dashBestDay', bestDay);
  setText('dashStreak', `${streak} dia(s)`);

  document.querySelectorAll('[data-dashboard-range]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dashboardRange === dashboardRange);
  });

  const chartCanvas = document.getElementById('weeklyChart');
  if (!chartCanvas) return;
  const ctx = chartCanvas.getContext('2d');
  const datasetLabel = isAllRange
    ? 'Minutos por mês (histórico completo)'
    : (days === 7 ? 'Minutos por dia (7 dias)' : 'Minutos por dia (30 dias)');
  if (dashboardChart) {
    dashboardChart.data.labels = labels;
    dashboardChart.data.datasets[0].data = data;
    dashboardChart.data.datasets[0].backgroundColor = barColor;
    dashboardChart.data.datasets[0].label = datasetLabel;
    dashboardChart.options.scales.x.ticks.color = tickColor;
    dashboardChart.options.scales.x.grid.color = gridColor;
    dashboardChart.options.scales.y.ticks.color = tickColor;
    dashboardChart.options.scales.y.grid.color = gridColor;
    dashboardChart.update();
  } else {
    dashboardChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: datasetLabel, backgroundColor: barColor, data }]
      },
      options: {
        plugins: { legend: { labels: { color: tickColor } } },
        scales: {
          x: {
            ticks: { color: tickColor },
            grid: { color: gridColor }
          },
          y: {
            beginAtZero: true,
            ticks: { color: tickColor },
            grid: { color: gridColor }
          }
        }
      }
    });
  }

  const activityCanvas = document.getElementById('activityChart');
  const emptyEl = document.getElementById('dashboardActivityEmpty');
  if (!activityCanvas) return;

  const getTotalsByType = (sourceExercises) => {
    const totals = {};
    sourceExercises.forEach(ex => {
      const activities = getExerciseActivities(ex);
      const safeActivities = activities.length ? activities : [ex.type || 'Não informado'];
      const durationShare = ex.duration / safeActivities.length;
      safeActivities.forEach(activity => {
        totals[activity] = (totals[activity] || 0) + durationShare;
      });
    });
    return totals;
  };

  let totalsByType = getTotalsByType(rangeExercises);
  let usingFullHistoryFallback = false;
  if (Object.keys(totalsByType).length === 0 && exercises.length > 0) {
    totalsByType = getTotalsByType(exercises);
    usingFullHistoryFallback = true;
  }

  const activityLabels = Object.keys(totalsByType);
  const activityData = activityLabels.map(label => Number(totalsByType[label].toFixed(1)));
  const activityColorMap = {
    'Musculação': '#10b981',
    'Corrida': '#3b82f6',
    'Natação': '#06b6d4',
    'Ioga': '#8b5cf6',
    'Crossfit': '#ef4444',
    'Não informado': '#94a3b8'
  };
  const fallbackPalette = ['#14b8a6', '#f59e0b', '#f97316', '#ec4899', '#84cc16', '#6366f1'];
  const getActivityColor = (activity, idx) => {
    if (activityColorMap[activity]) return activityColorMap[activity];
    return fallbackPalette[idx % fallbackPalette.length];
  };
  const colors = activityLabels.map((activity, idx) => getActivityColor(activity, idx));

  if (activityLabels.length === 0) {
    if (emptyEl) {
      emptyEl.textContent = 'Sem atividades no período para gerar o gráfico.';
      emptyEl.classList.remove('d-none');
    }
    if (activityChart) {
      activityChart.destroy();
      activityChart = null;
    }
    return;
  }

  if (emptyEl) {
    if (usingFullHistoryFallback) {
      emptyEl.textContent = 'Sem atividades no período selecionado. Exibindo distribuição do histórico completo.';
      emptyEl.classList.remove('d-none');
    } else {
      emptyEl.textContent = 'Sem atividades no período para gerar o gráfico.';
      emptyEl.classList.add('d-none');
    }
  }
  const activityCtx = activityCanvas.getContext('2d');
  if (activityChart) {
    activityChart.data.labels = activityLabels;
    activityChart.data.datasets[0].data = activityData;
    activityChart.data.datasets[0].backgroundColor = colors;
    activityChart.options.plugins.legend.labels.color = tickColor;
    activityChart.update();
  } else {
    activityChart = new Chart(activityCtx, {
      type: 'doughnut',
      data: {
        labels: activityLabels,
        datasets: [{
          data: activityData,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: tickColor, usePointStyle: true, boxWidth: 10 }
          }
        }
      }
    });
  }
}

// ==================== FUNÇÕES DO PERFIL ====================
function calcularIMC() {
  const peso = parseFloat(document.getElementById('userWeight').value);
  const altura = parseFloat(document.getElementById('userHeight').value);
  if (!peso || !altura) {
    document.getElementById('imc_display').textContent = '--';
    document.getElementById('imc_status').textContent = '';
    return;
  }
  const alturaM = altura / 100;
  const imc = (peso / (alturaM * alturaM)).toFixed(1);
  document.getElementById('imc_display').textContent = imc;
  userProfile.weight = peso;
  userProfile.height = altura;
  let status = '';
  if (imc < 18.5) status = '(Baixo peso)';
  else if (imc < 25) status = '(Normal)';
  else if (imc < 30) status = '(Sobrepeso)';
  else status = '(Obeso)';
  document.getElementById('imc_status').textContent = status;
}

function atualizarFoto(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('profilePhoto').src = e.target.result;
      toastr.success('Foto atualizada!');
    };
    reader.readAsDataURL(file);
  }
}

function salvarPerfil() {
  const name = document.getElementById('userName_input').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const age = parseInt(document.getElementById('userAge').value, 10);
  const gender = document.getElementById('userGender').value;
  const weight = parseFloat(document.getElementById('userWeight').value);
  const height = parseFloat(document.getElementById('userHeight').value);
  const goal = document.getElementById('userGoal').value;
  const unit = document.getElementById('userUnit').value;
  const notif = document.getElementById('notificationsEnabled').checked;
  if (!name || !email) {
    toastr.error('Nome e e-mail são obrigatórios');
    return;
  }
  if (!isValidEmail(email)) {
    toastr.error('Informe um e-mail válido');
    return;
  }
  userProfile.name = name;
  userProfile.email = email;
  userProfile.age = age || null;
  userProfile.gender = gender;
  userProfile.weight = weight || null;
  userProfile.height = height || null;
  userProfile.goal = goal;
  userProfile.unit = unit;
  userProfile.notificationsEnabled = notif;
  saveToStorage();
  document.getElementById('userName').textContent = name;
  calcularIMC();
  carregarEstatisticas();
  atualizarResumoPerfil();
  updateNovoRegistroPreview();
  toastr.success('Perfil salvo com sucesso!');
}

function alterarSenha() {
  const atual = document.getElementById('currentPassword').value;
  const nova = document.getElementById('newPassword').value;
  const confirma = document.getElementById('confirmPassword').value;
  if (!atual || !nova || !confirma) {
    toastr.error('Preencha todos os campos');
    return;
  }
  if (atual !== userProfile.password) {
    toastr.error('Senha atual incorreta');
    return;
  }
  if (nova.length < 6) {
    toastr.error('Nova senha deve ter no mínimo 6 caracteres');
    return;
  }
  if (nova !== confirma) {
    toastr.error('As senhas não conferem');
    return;
  }
  userProfile.password = nova;
  saveToStorage();
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  toastr.success('Senha alterada com sucesso!');
}

function confirmarExcluirConta() {
  if (confirm('Tem certeza que deseja excluir sua conta? Essa ação é IRREVERSÍVEL!')) {
    if (confirm('Última confirmação: Todos os seus dados serão perdidos permanentemente. Continuar?')) {
      exercises = [];
      goals = [];
      favorites = [];
      userProfile = createDefaultUserProfile();
      STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      logout();
      toastr.warning('Conta excluída com sucesso.');
    }
  }
}

function obterMetricasPerfil() {
  const totalTreinos = exercises.length;
  let tempoTotal = 0;
  exercises.forEach(ex => tempoTotal += ex.duration);
  const tempoMedio = totalTreinos > 0 ? (tempoTotal / totalTreinos).toFixed(1) : '0';
  const dataInicio = new Date(userProfile.joinDate);
  const dataAtual = new Date();
  const diasMembro = Number.isNaN(dataInicio.getTime()) ? 0 : Math.max(0, Math.floor((dataAtual - dataInicio) / (1000 * 60 * 60 * 24)));
  return { totalTreinos, tempoTotal, tempoMedio, diasMembro };
}

function calcularCompletudePerfil() {
  const campos = [
    userProfile.name,
    userProfile.email,
    userProfile.age,
    userProfile.gender,
    userProfile.weight,
    userProfile.height,
    userProfile.goal
  ];
  const preenchidos = campos.filter(valor => valor !== null && valor !== undefined && String(valor).trim() !== '').length;
  return Math.round((preenchidos / campos.length) * 100);
}

function atualizarResumoPerfil() {
  const nome = userProfile.name || 'Usuário';
  const email = userProfile.email || 'Sem e-mail';
  const objetivo = userProfile.goal || 'Objetivo não definido';
  const completude = calcularCompletudePerfil();
  const metricas = obterMetricasPerfil();

  const nomeEl = document.getElementById('profileDisplayName');
  const emailEl = document.getElementById('profileDisplayEmail');
  const objetivoEl = document.getElementById('profileGoalBadge');
  const completudeEl = document.getElementById('profileCompletionValue');
  const barraEl = document.getElementById('profileCompletionBar');

  if (nomeEl) nomeEl.textContent = nome;
  if (emailEl) emailEl.textContent = email;
  if (objetivoEl) objetivoEl.textContent = objetivo;
  if (completudeEl) completudeEl.textContent = `${completude}%`;
  if (barraEl) {
    barraEl.style.width = `${completude}%`;
    barraEl.setAttribute('aria-valuenow', String(completude));
  }

  const totalTreinosEl = document.getElementById('quickTotalTreinos');
  const tempoTotalEl = document.getElementById('quickTempoTotal');
  const tempoMedioEl = document.getElementById('quickTempoMedio');
  const diasMembroEl = document.getElementById('quickDiasMembro');

  if (totalTreinosEl) totalTreinosEl.textContent = String(metricas.totalTreinos);
  if (tempoTotalEl) tempoTotalEl.textContent = `${metricas.tempoTotal} min`;
  if (tempoMedioEl) tempoMedioEl.textContent = `${metricas.tempoMedio} min`;
  if (diasMembroEl) diasMembroEl.textContent = `${metricas.diasMembro} dias`;
}

function carregarEstatisticas() {
  const container = document.getElementById('profileStats');
  const { totalTreinos, tempoTotal, tempoMedio, diasMembro } = obterMetricasPerfil();
  const treinosSemana = exercises.filter(ex => {
    const dataTreino = new Date(`${ex.date}T00:00:00`);
    const agora = new Date();
    const limite = new Date();
    limite.setDate(agora.getDate() - 7);
    return !Number.isNaN(dataTreino.getTime()) && dataTreino >= limite && dataTreino <= agora;
  }).length;

  container.innerHTML = `
    <div class="col-md-6 col-xl-3">
      <div class="profile-stat-card">
        <div class="profile-stat-top"><p class="profile-stat-label">Total de Treinos</p><span class="profile-stat-icon"><i class="fa-solid fa-dumbbell"></i></span></div>
        <p class="profile-stat-value">${totalTreinos}</p>
      </div>
    </div>
    <div class="col-md-6 col-xl-3">
      <div class="profile-stat-card">
        <div class="profile-stat-top"><p class="profile-stat-label">Tempo Total</p><span class="profile-stat-icon"><i class="fa-regular fa-clock"></i></span></div>
        <p class="profile-stat-value">${tempoTotal} min</p>
      </div>
    </div>
    <div class="col-md-6 col-xl-3">
      <div class="profile-stat-card">
        <div class="profile-stat-top"><p class="profile-stat-label">Média por Treino</p><span class="profile-stat-icon"><i class="fa-solid fa-chart-line"></i></span></div>
        <p class="profile-stat-value">${tempoMedio} min</p>
      </div>
    </div>
    <div class="col-md-6 col-xl-3">
      <div class="profile-stat-card">
        <div class="profile-stat-top"><p class="profile-stat-label">Treinos (7 dias)</p><span class="profile-stat-icon"><i class="fa-solid fa-calendar-week"></i></span></div>
        <p class="profile-stat-value">${treinosSemana}</p>
      </div>
    </div>
    <div class="col-md-12">
      <div class="profile-stat-card">
        <div class="profile-stat-top"><p class="profile-stat-label">Tempo como membro</p><span class="profile-stat-icon"><i class="fa-regular fa-id-badge"></i></span></div>
        <p class="profile-stat-value">${diasMembro} dias</p>
      </div>
    </div>
  `;
  atualizarResumoPerfil();
}

function carregarPerfil() {
  document.getElementById('userName_input').value = userProfile.name;
  document.getElementById('userEmail').value = userProfile.email;
  document.getElementById('userAge').value = userProfile.age || '';
  document.getElementById('userGender').value = userProfile.gender;
  document.getElementById('userWeight').value = userProfile.weight || '';
  document.getElementById('userHeight').value = userProfile.height || '';
  document.getElementById('userGoal').value = userProfile.goal;
  document.getElementById('userUnit').value = userProfile.unit;
  document.getElementById('notificationsEnabled').checked = userProfile.notificationsEnabled;
  calcularIMC();
  carregarEstatisticas();
  atualizarResumoPerfil();
  updateNovoRegistroPreview();
}

function configureDateLimits() {
  const today = getTodayISODate();
  ['exDate', 'editDate', 'histFrom', 'histTo'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.max = today;
  });
  const exDate = document.getElementById('exDate');
  if (exDate && !exDate.value) exDate.value = today;
}

function setupOverlayAccessibility() {
  document.querySelectorAll('.overlay').forEach(overlay => {
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        closeOverlayById(overlay.id);
      }
    });
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && activeOverlayId) {
      closeOverlayById(activeOverlayId);
      return;
    }

    if (event.key !== 'Tab' || !activeOverlayId) return;
    const overlay = document.getElementById(activeOverlayId);
    if (!overlay) return;
    const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setupMobileSidebarCloseBehavior() {
  document.addEventListener('click', event => {
    if (!isMobileViewport()) return;
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleBtn');
    if (!sidebar.classList.contains('open')) return;
    if (sidebar.contains(event.target) || toggleBtn.contains(event.target)) return;
    closeMobileSidebar();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  });

  window.addEventListener('resize', () => {
    applySidebarStateForViewport();
  });
}

// Inicialização
toastr.options = { positionClass: 'toast-bottom-right', timeOut: 2500, preventDuplicates: true, closeButton: true };

// Verifica se o usuário estava logado e restaura a sessão
function initializeApp() {
  applyTheme(getInitialTheme(), false);
  configureDateLimits();
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
















