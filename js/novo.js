const RECURRING_WEEKDAY_OPTIONS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' },
  { value: 0, label: 'Dom' }
];

const ACTIVITIES_WITH_OPTIONAL_EQUIPMENT = ['Corrida', 'Natação', 'Ioga'];
const AUTOMATIC_RECURRING_PLANS = {
  'Musculação': {
    1: 'Peito',
    2: 'Perna',
    3: 'Braços',
    4: 'Perna',
    5: 'Costas',
    6: 'Descanso',
    0: 'Descanso'
  }
};

function getWeightForCalorieEstimate() {
  const inputWeight = Number.parseFloat(document.getElementById('userWeight')?.value || '');
  if (Number.isFinite(inputWeight) && inputWeight > 0) return inputWeight;
  if (Number.isFinite(userProfile.weight) && userProfile.weight > 0) return userProfile.weight;
  return 70;
}

function estimateSessionCalories(duration, intensity) {
  const metMap = { Baixa: 4, Média: 6, Alta: 8 };
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

function getRecurringEnabled() {
  return Boolean(document.getElementById('exRecurringEnabled')?.checked);
}

function getRecurringRangeDays() {
  const value = Number.parseInt(document.getElementById('exRecurringRange')?.value || '30', 10);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

function getSelectedRecurringWeekdays() {
  return Array.from(document.querySelectorAll('.recurrence-weekday-checkbox:checked'))
    .map(input => Number.parseInt(input.value, 10))
    .filter(value => Number.isInteger(value) && value >= 0 && value <= 6);
}

function getAutomaticRecurringPlan(primaryType) {
  return AUTOMATIC_RECURRING_PLANS[primaryType] || null;
}

function getAutomaticRecurringLabel(primaryType, weekday) {
  const automaticPlan = getAutomaticRecurringPlan(primaryType);
  if (!automaticPlan) return '';
  return automaticPlan[weekday] || '';
}

function isAutomaticRestDate(primaryType, isoDate) {
  const dateObj = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return false;
  return getAutomaticRecurringLabel(primaryType, dateObj.getDay()) === 'Descanso';
}

function getDefaultEquipmentForType(primaryType) {
  return ACTIVITIES_WITH_OPTIONAL_EQUIPMENT.includes(primaryType) ? 'Corpo Livre' : '';
}

function buildAutomaticRecurringSessionGoal(primaryType, date, baseGoal = '') {
  const dateObj = new Date(`${date}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return baseGoal.trim();

  const focus = getAutomaticRecurringLabel(primaryType, dateObj.getDay());
  if (!focus || focus === 'Descanso') return baseGoal.trim();

  const normalizedBaseGoal = baseGoal.trim();
  if (!normalizedBaseGoal) return focus;
  if (normalizedBaseGoal.toLowerCase().includes(focus.toLowerCase())) return normalizedBaseGoal;
  return `${focus} • ${normalizedBaseGoal}`;
}

function updateRecurringWeekdayVisualState() {
  document.querySelectorAll('.recurrence-weekday-checkbox').forEach(input => {
    const wrapper = input.closest('.recurrence-weekday-option');
    if (wrapper) wrapper.classList.toggle('is-selected', input.checked);
  });
}

function syncRecurringWeekdaysWithDate() {
  const dateValue = document.getElementById('exDate')?.value;
  const selected = getSelectedRecurringWeekdays();
  if (!dateValue || selected.length > 0) {
    updateRecurringWeekdayVisualState();
    return;
  }

  const dateObj = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return;
  const weekday = dateObj.getDay();
  const defaultCheckbox = document.querySelector(`.recurrence-weekday-checkbox[value="${weekday}"]`);
  if (defaultCheckbox) defaultCheckbox.checked = true;
  updateRecurringWeekdayVisualState();
}

function renderRecurringAutoPlan(primaryType = document.getElementById('exType')?.value || '') {
  const container = document.getElementById('exRecurringAutoPlan');
  if (!container) return;

  const automaticPlan = getAutomaticRecurringPlan(primaryType);
  const shouldShow = getRecurringEnabled() && automaticPlan;
  container.classList.toggle('d-none', !shouldShow);

  if (!shouldShow) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <p>Divisão automática da rotina de musculação:</p>
    <div class="recurrence-auto-list">
      ${RECURRING_WEEKDAY_OPTIONS.map(day => {
        const label = automaticPlan[day.value] || '--';
        const restClass = label === 'Descanso' ? ' is-rest' : '';
        return `
          <div class="recurrence-auto-item${restClass}">
            <span>${day.label}</span>
            <strong>${label}</strong>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRecurringWeekdayOptions() {
  const container = document.getElementById('exRecurringWeekdays');
  if (!container) return;

  container.innerHTML = RECURRING_WEEKDAY_OPTIONS.map(day => `
    <label class="recurrence-weekday-option">
      <input type="checkbox" class="recurrence-weekday-checkbox" value="${day.value}">
      <span>${day.label}</span>
    </label>
  `).join('');

  container.querySelectorAll('.recurrence-weekday-checkbox').forEach(input => {
    input.addEventListener('change', () => {
      updateRecurringWeekdayVisualState();
      updateNovoRegistroPreview();
    });
  });

  syncRecurringWeekdaysWithDate();
  renderRecurringAutoPlan();
}

function updateRecurringVisibility() {
  const options = document.getElementById('exRecurringOptions');
  if (!options) return;
  options.classList.toggle('d-none', !getRecurringEnabled());
  renderRecurringAutoPlan();
}

function buildRecurringDates(startDate, rangeDays, weekdays) {
  if (!startDate) return [];
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return [];

  const normalizedWeekdays = weekdays.length ? weekdays : [start.getDay()];
  const result = [];
  const cursor = new Date(start);

  for (let offset = 0; offset < rangeDays; offset += 1) {
    if (normalizedWeekdays.includes(cursor.getDay())) {
      result.push(cursor.toISOString().split('T')[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function getPlannedSessionDates() {
  const date = document.getElementById('exDate')?.value || '';
  if (!date) return [];
  if (!getRecurringEnabled()) return [date];

  const primaryType = document.getElementById('exType')?.value || '';
  const plannedDates = buildRecurringDates(date, getRecurringRangeDays(), getSelectedRecurringWeekdays());
  return getAutomaticRecurringPlan(primaryType)
    ? plannedDates.filter(item => !isAutomaticRestDate(primaryType, item))
    : plannedDates;
}

function updateRecurringSummary() {
  const summary = document.getElementById('exRecurringSummary');
  if (!summary) return;
  const count = getPlannedSessionDates().length;
  summary.textContent = `${count} ${count === 1 ? 'sessão' : 'sessões'}`;
}

function updateNovoRegistroPreview() {
  const date = document.getElementById('exDate')?.value || '';
  const type = document.getElementById('exType')?.value || '--';
  const intensity = document.getElementById('exIntensity')?.value || '--';
  const duration = Number.parseInt(document.getElementById('exDuration')?.value || '0', 10) || 0;
  const plannedDates = getPlannedSessionDates();
  const planCount = plannedDates.length || (date ? 1 : 0);
  const modeLabel = getRecurringEnabled() ? 'Rotina recorrente' : 'Sessão única';

  const dateLabel = date ? formatExerciseDate(date).full : '--';
  const calories = estimateSessionCalories(duration, intensity);
  const workload = getSessionWorkload(duration, intensity);

  const map = {
    nrPreviewDate: dateLabel,
    nrPreviewType: type,
    nrPreviewDuration: `${duration} min`,
    nrPreviewIntensity: intensity,
    nrPreviewCalories: `${calories} kcal`,
    nrPreviewWorkload: workload,
    nrPreviewMode: modeLabel,
    nrPreviewPlanCount: `${planCount} ${planCount === 1 ? 'registro' : 'registros'}`
  };

  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });

  updateRecurringVisibility();
  updateRecurringSummary();
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
  syncRecurringWeekdaysWithDate();
  updateNovoRegistroPreview();
}

function resetRecurringFormState() {
  const recurringEnabled = document.getElementById('exRecurringEnabled');
  const recurringRange = document.getElementById('exRecurringRange');
  const recurringToggle = document.getElementById('novoRecurringToggle');

  if (recurringEnabled) recurringEnabled.checked = false;
  if (recurringRange) recurringRange.value = '30';
  if (recurringToggle) recurringToggle.open = false;

  document.querySelectorAll('.recurrence-weekday-checkbox').forEach(input => {
    input.checked = false;
  });

  syncRecurringWeekdaysWithDate();
  updateRecurringVisibility();
  updateRecurringSummary();
}

function resetNovoRegistroForm() {
  const exDate = document.getElementById('exDate');
  if (exDate) exDate.value = getTodayISODate();
  document.getElementById('exType').value = 'Musculação';
  document.getElementById('exDuration').value = 60;
  document.getElementById('exIntensity').value = 'Média';
  resetRecurringFormState();
  syncDurationFromNumberInput();
  updateNovoRegistroPreview();
}

function setupNovoRegistroEnhancements() {
  renderRecurringWeekdayOptions();

  const fieldsToWatch = [
    'exDate',
    'exType',
    'exDuration',
    'exIntensity',
    'exRecurringEnabled',
    'exRecurringRange'
  ];

  fieldsToWatch.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.bound === 'true') return;

    const onChange = () => {
      if (id === 'exDate') syncRecurringWeekdaysWithDate();
      updateNovoRegistroPreview();
    };

    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
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

function buildExerciseSignature(exercise) {
  const activities = getExerciseActivities(exercise).slice().sort().join('|');
  return [
    exercise.date || '',
    exercise.type || '',
    activities,
    exercise.equip || '',
    String(exercise.duration || ''),
    exercise.intensity || '',
    exercise.sessionGoal || '',
    exercise.notes || ''
  ].join('::');
}

function createExerciseEntriesFromPayload(basePayload, dates, automaticPlan = null) {
  return dates.map(date => {
    const sessionGoal = automaticPlan
      ? buildAutomaticRecurringSessionGoal(basePayload.type, date, basePayload.sessionGoal)
      : (basePayload.sessionGoal || '').trim();

    return {
      ...basePayload,
      date,
      equip: basePayload.equip || getDefaultEquipmentForType(basePayload.type),
      activities: [...basePayload.activities],
      sessionGoal,
      calories: estimateSessionCalories(basePayload.duration, basePayload.intensity)
    };
  });
}

function adicionarExercicio() {
  const primaryType = document.getElementById('exType').value;
  const automaticPlan = getRecurringEnabled() ? getAutomaticRecurringPlan(primaryType) : null;
  const payload = {
    date: document.getElementById('exDate').value,
    type: primaryType,
    activities: [primaryType],
    equip: getDefaultEquipmentForType(primaryType),
    duration: document.getElementById('exDuration').value,
    intensity: document.getElementById('exIntensity').value,
    sessionGoal: '',
    notes: ''
  };

  const validation = validateExercisePayload(payload);
  if (!validation.valid) {
    toastr.error(validation.message);
    return;
  }

  const plannedDates = getPlannedSessionDates();
  if (plannedDates.length === 0) {
    toastr.error('Defina uma data ou ajuste a rotina para gerar registros válidos.');
    return;
  }

  const generatedEntries = createExerciseEntriesFromPayload(validation.data, plannedDates, automaticPlan);
  const existingSignatures = new Set(exercises.map(buildExerciseSignature));
  const newEntries = generatedEntries.filter(entry => !existingSignatures.has(buildExerciseSignature(entry)));
  const skippedEntries = generatedEntries.length - newEntries.length;

  if (newEntries.length === 0) {
    toastr.info('Esses registros já existem no histórico.');
    return;
  }

  exercises.push(...newEntries);
  saveToStorage();

  if (newEntries.length === 1) {
    toastr.success('Exercício registrado!');
  } else if (skippedEntries > 0) {
    toastr.success(`${newEntries.length} registros criados e ${skippedEntries} duplicados ignorados.`);
  } else {
    toastr.success(`${newEntries.length} registros criados para a rotina.`);
  }

  resetNovoRegistroForm();
  loadHistorico();
  updateDashboardChart();
  loadMetas();
}
