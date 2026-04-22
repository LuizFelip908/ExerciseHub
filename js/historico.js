let selectedHistoricoIndices = new Set();

function getFilteredHistorico(returnWithIndex = false) {
  const from = document.getElementById('histFrom').value;
  const to = document.getElementById('histTo').value;
  const search = document.getElementById('histSearch').value.toLowerCase().trim();
  const type = document.getElementById('histType').value;
  const equip = document.getElementById('histEquip') ? document.getElementById('histEquip').value : '';
  const intensity = document.getElementById('histIntensity').value;
  let filtered = exercises.map((e, i) => ({ e, i }));
  if (from) filtered = filtered.filter(o => o.e.date >= from);
  if (to) filtered = filtered.filter(o => o.e.date <= to);
  if (search) {
    filtered = filtered.filter(o => {
      const typeLabel = getExerciseTypeLabel(o.e);
      const haystack = `${typeLabel} ${o.e.equip || 'nenhum'} ${o.e.intensity} ${o.e.date} ${o.e.sessionGoal || ''} ${o.e.notes || ''}`.toLowerCase();
      return haystack.includes(search);
    });
  }
  if (type) filtered = filtered.filter(o => getExerciseActivities(o.e).includes(type));
  if (equip) filtered = filtered.filter(o => o.e.equip === equip);
  if (intensity) filtered = filtered.filter(o => o.e.intensity === intensity);
  const sort = document.getElementById('histSort').value;
  if (sort === 'recent') filtered.sort((a, b) => b.e.date.localeCompare(a.e.date));
  else if (sort === 'oldest') filtered.sort((a, b) => a.e.date.localeCompare(b.e.date));
  else if (sort === 'longest') filtered.sort((a, b) => b.e.duration - a.e.duration);
  else if (sort === 'shortest') filtered.sort((a, b) => a.e.duration - b.e.duration);
  if (returnWithIndex) return filtered;
  return filtered.map(o => o.e);
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
    const activities = getExerciseActivities(ex);
    const safeActivities = activities.length ? activities : [ex.type || 'Não informado'];
    safeActivities.forEach(activity => {
      typeCount[activity] = (typeCount[activity] || 0) + 1;
    });
  });
  const topType = Object.keys(typeCount).sort((a, b) => typeCount[b] - typeCount[a])[0] || 'N/A';
  return { totalMin, avgMin, longest, uniqueDays, topType };
}

function getIntensityClass(intensity) {
  if (intensity === 'Baixa') return 'int-baixa';
  if (intensity === 'Alta') return 'int-alta';
  return 'int-media';
}

function pruneHistoricoSelection() {
  const maxIndex = exercises.length - 1;
  selectedHistoricoIndices = new Set(
    [...selectedHistoricoIndices].filter(index => Number.isInteger(index) && index >= 0 && index <= maxIndex)
  );
}

function getVisibleHistoricoIndices() {
  return getFilteredHistorico(true).map(item => item.i);
}

function updateHistoricoSelectionBar(visibleIndices) {
  const bar = document.getElementById('historicoSelectionBar');
  const countEl = document.getElementById('historicoSelectionCount');
  const hintEl = document.getElementById('historicoSelectionHint');
  const selectAllBtn = document.getElementById('historicoSelectAllBtn');
  const clearBtn = document.getElementById('historicoClearSelectionBtn');
  const deleteBtn = document.getElementById('historicoDeleteSelectedBtn');
  if (!bar || !countEl || !hintEl || !selectAllBtn || !clearBtn || !deleteBtn) return;

  const visibleSet = new Set(visibleIndices);
  const selectedVisibleCount = [...selectedHistoricoIndices].filter(index => visibleSet.has(index)).length;
  const hasVisibleItems = visibleIndices.length > 0;
  const allVisibleSelected = hasVisibleItems && selectedVisibleCount === visibleIndices.length;

  bar.classList.toggle('d-none', !hasVisibleItems);
  countEl.textContent = `${selectedHistoricoIndices.size} selecionado(s)`;
  hintEl.textContent = hasVisibleItems
    ? `${visibleIndices.length} treino(s) visível(is) com os filtros atuais.`
    : 'Selecione os treinos que deseja remover.';
  selectAllBtn.textContent = allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis';
  clearBtn.disabled = selectedHistoricoIndices.size === 0;
  deleteBtn.disabled = selectedHistoricoIndices.size === 0;
}

function toggleHistoricoSelection(index) {
  if (selectedHistoricoIndices.has(index)) selectedHistoricoIndices.delete(index);
  else selectedHistoricoIndices.add(index);
  loadHistorico();
}

function clearHistoricoSelection() {
  if (selectedHistoricoIndices.size === 0) return;
  selectedHistoricoIndices.clear();
  loadHistorico();
}

function toggleSelectAllHistoricoVisible() {
  const visibleIndices = getVisibleHistoricoIndices();
  if (visibleIndices.length === 0) return;

  const allVisibleSelected = visibleIndices.every(index => selectedHistoricoIndices.has(index));
  if (allVisibleSelected) {
    visibleIndices.forEach(index => selectedHistoricoIndices.delete(index));
  } else {
    visibleIndices.forEach(index => selectedHistoricoIndices.add(index));
  }
  loadHistorico();
}

function loadHistorico() {
  const container = document.getElementById('historicoList');
  const summaryText = document.getElementById('histSummary');
  const summaryCards = document.getElementById('histSummaryCards');
  const listWithIndex = getFilteredHistorico(true);
  const list = listWithIndex.map(o => o.e);
  pruneHistoricoSelection();
  const visibleIndices = listWithIndex.map(item => item.i);

  const kpi = getHistoricoKpis(list);
  summaryCards.innerHTML = `
    <div class="historico-kpi"><p>Total de minutos</p><strong>${kpi.totalMin}</strong></div>
    <div class="historico-kpi"><p>Registros</p><strong>${list.length}</strong></div>
    <div class="historico-kpi"><p>Média por treino</p><strong>${kpi.avgMin} min</strong></div>
    <div class="historico-kpi"><p>Maior sessão</p><strong>${kpi.longest} min</strong></div>
  `;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon"><i class="fa-solid fa-inbox"></i></span>
        <h3>Nenhum treino registrado</h3>
        <p>Assim que você salvar sessões no app, o histórico vai aparecer aqui com filtros, resumo e opção de exportação.</p>
      </div>
    `;
    summaryText.innerHTML = '<small class="text-muted">Sem dados para o filtro atual.</small>';
    updateHistoricoSelectionBar([]);
    return;
  }

  summaryText.innerHTML =
    `<strong>Dias ativos:</strong> ${kpi.uniqueDays} &nbsp;|&nbsp; <strong>Atividade mais frequente:</strong> ${escapeHTML(kpi.topType)}`;

  container.innerHTML = listWithIndex.map(o => {
    const ex = o.e;
    const formatted = formatExerciseDate(ex.date);
    const safeType = escapeHTML(getExerciseTypeLabel(ex));
    const safeEquip = escapeHTML(ex.equip || 'Nenhum');
    const safeIntensity = escapeHTML(ex.intensity);
    const isSelected = selectedHistoricoIndices.has(o.i);

    return `
    <div class="historico-item${isSelected ? ' is-selected' : ''}">
      <div class="historico-select">
        <input type="checkbox" class="historico-checkbox" aria-label="Selecionar treino de ${formatted.full}" ${isSelected ? 'checked' : ''} onclick="toggleHistoricoSelection(${o.i})">
      </div>
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

  updateHistoricoSelectionBar(visibleIndices);
}

function removerEx(index) {
  const ex = exercises[index];
  if (!ex) return;
  if (!confirm(`Remover o registro de ${getExerciseTypeLabel(ex)} do dia ${ex.date}?`)) return;
  exercises.splice(index, 1);
  selectedHistoricoIndices.clear();
  saveToStorage();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
  carregarEstatisticas();
  toastr.success('Registro removido com sucesso!');
}

function removerExSelecionados() {
  pruneHistoricoSelection();
  const indexes = [...selectedHistoricoIndices].sort((a, b) => b - a);
  if (indexes.length === 0) {
    toastr.info('Selecione pelo menos um treino para excluir.');
    return;
  }

  const confirmMessage = indexes.length === 1
    ? 'Excluir o treino selecionado?'
    : `Excluir ${indexes.length} treinos selecionados?`;
  if (!confirm(confirmMessage)) return;

  indexes.forEach(index => {
    exercises.splice(index, 1);
  });
  selectedHistoricoIndices.clear();
  saveToStorage();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
  carregarEstatisticas();
  toastr.success(indexes.length === 1 ? 'Treino excluído com sucesso!' : `${indexes.length} treinos excluídos com sucesso!`);
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
    const activities = getExerciseActivities(ex);
    const safeActivities = activities.length ? activities : [ex.type || 'Não informado'];
    const intensityKey = ex.intensity || 'Não informado';
    const dayKey = ex.date || 'Sem data';
    const monthKey = (ex.date && /^\d{4}-\d{2}-\d{2}$/.test(ex.date)) ? ex.date.slice(0, 7) : 'Não informado';
    const calories = Number.isFinite(ex.calories) ? ex.calories : estimateSessionCalories(duration, ex.intensity);
    const workload = duration * toIntensityScore(ex.intensity);
    const durationShare = duration / safeActivities.length;
    const calorieShare = calories / safeActivities.length;
    const dateObj = ex.date ? new Date(`${ex.date}T00:00:00`) : null;
    const hasValidDate = dateObj && !Number.isNaN(dateObj.getTime());
    const jsWeekDay = hasValidDate ? dateObj.getDay() : -1;
    const weekdayOrder = jsWeekDay === -1 ? 8 : (jsWeekDay === 0 ? 7 : jsWeekDay);
    const weekdayName = hasValidDate ? weekdayFormatter.format(dateObj) : 'Não informado';
    const weekdayKey = String(weekdayOrder);

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

    safeActivities.forEach(typeKey => {
      if (!statsByType[typeKey]) statsByType[typeKey] = { count: 0, minutes: 0, calories: 0 };
      statsByType[typeKey].count += 1;
      statsByType[typeKey].minutes += durationShare;
      statsByType[typeKey].calories += calorieShare;
    });

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
    lines.push(toCSVLine(['Maior sessão', `${longestSession.duration} min (${getExerciseTypeLabel(longestSession)} em ${csvDate(longestSession.date)})`]));
  }
  if (shortestSession) {
    lines.push(toCSVLine(['Menor sessão', `${shortestSession.duration} min (${getExerciseTypeLabel(shortestSession)} em ${csvDate(shortestSession.date)})`]));
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
      getExerciseTypeLabel(e),
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
  document.getElementById('editType').value = getExerciseActivities(ex)[0] || ex.type;
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

  const existingActivities = getExerciseActivities(exercises[index]).filter(activity => activity !== validation.data.type);
  const mergedActivities = [...new Set([validation.data.type, ...existingActivities])];

  exercises[index] = {
    ...exercises[index],
    ...validation.data,
    activities: mergedActivities,
    calories: estimateSessionCalories(validation.data.duration, validation.data.intensity)
  };
  saveToStorage();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
  fecharModalEdicao();
  toastr.success('Registro atualizado com sucesso!');
}

['histFrom', 'histTo', 'histSearch', 'histType', 'histEquip', 'histIntensity', 'histSort'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', loadHistorico);
    el.addEventListener('input', loadHistorico);
  }
});
