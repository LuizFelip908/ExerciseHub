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
