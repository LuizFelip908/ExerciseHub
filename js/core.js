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
  
  if (storedExercises) {
    const parsedExercises = JSON.parse(storedExercises);
    exercises = Array.isArray(parsedExercises) ? parsedExercises.map(normalizeStoredExercise) : [];
  }
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
const AUTH_BUTTON_LABELS = {
  login: 'Entrar',
  register: 'Criar conta gratuita',
  forgot: 'Atualizar senha'
};

function normalizeActivityArray(values) {
  if (!Array.isArray(values)) return [];
  const normalized = values
    .map(value => String(value || '').trim())
    .filter(value => VALID_ACTIVITY_TYPES.includes(value));
  return [...new Set(normalized)];
}

function getExerciseActivities(exercise) {
  if (!exercise || typeof exercise !== 'object') return [];
  const fromArray = normalizeActivityArray(exercise.activities);
  if (fromArray.length) return fromArray;
  const singleType = String(exercise.type || '').trim();
  return VALID_ACTIVITY_TYPES.includes(singleType) ? [singleType] : [];
}

function getExerciseTypeLabel(exercise) {
  const activities = getExerciseActivities(exercise);
  if (activities.length) return activities.join(' + ');
  const fallback = String(exercise?.type || '').trim();
  return fallback || 'Não informado';
}

function normalizeStoredExercise(exercise) {
  const normalized = exercise && typeof exercise === 'object' ? { ...exercise } : {};
  const activities = getExerciseActivities(normalized);
  const primaryType = activities[0] || String(normalized.type || '').trim();
  return {
    ...normalized,
    type: primaryType,
    activities
  };
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
  const activities = normalizeActivityArray(payload.activities);
  const equip = (payload.equip || '').trim();
  const intensity = (payload.intensity || '').trim();
  const duration = Number.parseInt(payload.duration, 10);
  const sessionGoal = (payload.sessionGoal || '').trim();
  const notes = (payload.notes || '').trim();

  if (!date) return { valid: false, message: 'Informe a data do exercício' };
  if (date > getTodayISODate()) return { valid: false, message: 'A data do exercício não pode ser no futuro' };
  if (!VALID_ACTIVITY_TYPES.includes(type)) return { valid: false, message: 'Selecione um tipo de atividade válido' };
  if (activities.length > VALID_ACTIVITY_TYPES.length) return { valid: false, message: 'Atividades extras inválidas' };
  if (!Number.isFinite(duration) || duration < 5 || duration > 480) {
    return { valid: false, message: 'A duração deve ficar entre 5 e 480 minutos' };
  }
  if (!VALID_INTENSITIES.includes(intensity)) return { valid: false, message: 'Selecione uma intensidade válida' };
  if (sessionGoal.length > 90) return { valid: false, message: 'Objetivo da sessão deve ter no máximo 90 caracteres' };
  if (notes.length > 280) return { valid: false, message: 'Anotações devem ter no máximo 280 caracteres' };

  const normalizedActivities = [...new Set([type, ...activities.filter(activity => activity !== type)])];

  return {
    valid: true,
    data: { date, type, activities: normalizedActivities, equip, duration, intensity, sessionGoal, notes }
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
    window.requestAnimationFrame(() => {
      const firstFocusable = overlay.querySelector('input, select, textarea, button:not(.close-btn)');
      if (firstFocusable) firstFocusable.focus();
      else dialog.focus();
    });
  }
}

function closeOverlayById(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.style.display = 'none';
  overlay.setAttribute('aria-hidden', 'true');
  if (id === 'overlay-login') resetAuthSurface('login');
  if (id === 'overlay-register') resetAuthSurface('register');
  if (id === 'overlay-forgot') resetAuthSurface('forgot');
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

function getAuthElements(type) {
  return {
    form: document.getElementById(`${type}Form`),
    feedback: document.getElementById(`${type}Feedback`),
    submitBtn: document.getElementById(`${type}SubmitBtn`)
  };
}

function clearAuthInvalidState(type) {
  const { form } = getAuthElements(type);
  if (!form) return;
  form.querySelectorAll('.is-invalid').forEach(field => field.classList.remove('is-invalid'));
}

function setAuthFeedback(type, message = '', kind = '') {
  const { feedback } = getAuthElements(type);
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle('d-none', !message);
  feedback.classList.remove('is-error', 'is-success');
  if (message && kind) {
    feedback.classList.add(`is-${kind}`);
  }
}

function setAuthBusy(type, busy) {
  const { submitBtn } = getAuthElements(type);
  if (!submitBtn) return;
  submitBtn.disabled = busy;
  submitBtn.innerHTML = busy
    ? '<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Processando...'
    : AUTH_BUTTON_LABELS[type];
}

function markAuthFieldInvalid(input, type, message) {
  if (!input) return;
  input.classList.add('is-invalid');
  input.focus();
  setAuthFeedback(type, message, 'error');
}

function resetAuthSurface(type, { clearValues = false } = {}) {
  const { form } = getAuthElements(type);
  clearAuthInvalidState(type);
  setAuthFeedback(type);
  setAuthBusy(type, false);
  if (!form) return;
  if (clearValues) {
    form.reset();
    form.querySelectorAll('[data-password-toggle]').forEach(button => {
      const targetId = button.getAttribute('data-password-toggle');
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');
      if (!input || !icon) return;
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
      button.setAttribute('aria-label', 'Mostrar senha');
      });
  } else {
    form.querySelectorAll('input[type="password"]').forEach(passwordField => {
      passwordField.value = '';
    });
  }
}

function delayUi(ms = 320) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function setupPasswordToggles() {
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-password-toggle');
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');
      if (!input || !icon) return;

      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      icon.classList.toggle('fa-eye', showing);
      icon.classList.toggle('fa-eye-slash', !showing);
      button.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
    });
  });
}

function setupAuthForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');

  if (loginForm && loginForm.dataset.bound !== 'true') {
    loginForm.dataset.bound = 'true';
    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      login();
    });
    loginForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        setAuthFeedback('login');
      });
    });
  }

  if (registerForm && registerForm.dataset.bound !== 'true') {
    registerForm.dataset.bound = 'true';
    registerForm.addEventListener('submit', event => {
      event.preventDefault();
      register();
    });
    registerForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        setAuthFeedback('register');
      });
    });
  }

  if (forgotForm && forgotForm.dataset.bound !== 'true') {
    forgotForm.dataset.bound = 'true';
    forgotForm.addEventListener('submit', event => {
      event.preventDefault();
      recoverPassword();
    });
    forgotForm.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        setAuthFeedback('forgot');
      });
    });
  }

  setupPasswordToggles();
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const emailField = document.getElementById('loginEmail');
  const passwordField = document.getElementById('loginPassword');

  clearAuthInvalidState('login');
  setAuthFeedback('login');

  if (!isValidEmail(email)) {
    markAuthFieldInvalid(emailField, 'login', 'Informe um e-mail válido para entrar.');
    return;
  }
  if (!password) {
    markAuthFieldInvalid(passwordField, 'login', 'Informe sua senha para continuar.');
    return;
  }

  setAuthBusy('login', true);
  await delayUi();
  loadFromStorage();
  if (email !== userProfile.email || password !== userProfile.password) {
    setAuthBusy('login', false);
    passwordField.classList.add('is-invalid');
    passwordField.focus();
    setAuthFeedback('login', 'E-mail ou senha inválidos. Confira os dados e tente novamente.', 'error');
    return;
  }

  currentUser = { name: userProfile.name || 'Usuário', email: userProfile.email };
  localStorage.setItem('exerciseHub_currentUser', JSON.stringify(currentUser));
  setAuthFeedback('login', 'Login realizado com sucesso.', 'success');
  toastr.success('Login realizado!');
  resetAuthSurface('login', { clearValues: true });
  closeOverlay('login');
  enterApp();
}

async function register() {
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const nameField = document.getElementById('registerName');
  const emailField = document.getElementById('registerEmail');
  const passwordField = document.getElementById('registerPassword');

  clearAuthInvalidState('register');
  setAuthFeedback('register');

  if (name.length < 3) {
    markAuthFieldInvalid(nameField, 'register', 'Informe um nome com pelo menos 3 caracteres.');
    return;
  }
  if (!isValidEmail(email)) {
    markAuthFieldInvalid(emailField, 'register', 'Informe um e-mail válido para criar a conta.');
    return;
  }
  if (password.length < 6) {
    markAuthFieldInvalid(passwordField, 'register', 'A senha deve ter no mínimo 6 caracteres.');
    return;
  }

  setAuthBusy('register', true);
  await delayUi();
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
  setAuthFeedback('register', 'Conta criada com sucesso.', 'success');
  toastr.success('Cadastro realizado! Entrando...');
  resetAuthSurface('register', { clearValues: true });
  closeOverlay('register');
  enterApp();
}

function fillLoginEmail(email) {
  const loginEmail = document.getElementById('loginEmail');
  if (loginEmail) loginEmail.value = email;
}

async function recoverPassword() {
  const emailField = document.getElementById('forgotEmail');
  const passwordField = document.getElementById('forgotPassword');
  const confirmField = document.getElementById('forgotPasswordConfirm');
  const email = emailField?.value.trim() || '';
  const password = passwordField?.value || '';
  const passwordConfirm = confirmField?.value || '';

  clearAuthInvalidState('forgot');
  setAuthFeedback('forgot');

  if (!isValidEmail(email)) {
    markAuthFieldInvalid(emailField, 'forgot', 'Informe um e-mail válido para redefinir a senha.');
    return;
  }
  if (password.length < 6) {
    markAuthFieldInvalid(passwordField, 'forgot', 'A nova senha deve ter no mínimo 6 caracteres.');
    return;
  }
  if (password !== passwordConfirm) {
    markAuthFieldInvalid(confirmField, 'forgot', 'A confirmação da senha não confere.');
    return;
  }

  setAuthBusy('forgot', true);
  await delayUi();
  loadFromStorage();

  if (email !== userProfile.email) {
    setAuthBusy('forgot', false);
    markAuthFieldInvalid(emailField, 'forgot', 'Esse e-mail não corresponde à conta salva neste navegador.');
    return;
  }

  userProfile = {
    ...userProfile,
    password
  };
  saveToStorage();
  setAuthFeedback('forgot', 'Senha atualizada com sucesso.', 'success');
  toastr.success('Senha redefinida com sucesso!');
  resetAuthSurface('forgot', { clearValues: true });
  closeOverlay('forgot');
  resetAuthSurface('login');
  fillLoginEmail(email);
  showOverlay('login');
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

