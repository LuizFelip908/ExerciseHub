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

