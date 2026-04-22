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
