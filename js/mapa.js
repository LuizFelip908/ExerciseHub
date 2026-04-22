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
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon"><i class="fa-solid fa-person-rays"></i></span>
        <h3>Selecione uma região do corpo</h3>
        <p>Use o mapa ou os chips de grupo muscular para abrir sugestões de exercícios relacionadas a cada área.</p>
      </div>
    `;
  }
}

function filterByMuscle(muscle) {
  selectedMuscle = muscle;
  const filtered = getExercisesByMuscle(muscle);
  const container = document.getElementById('muscleExercises');
  updateMuscleSelectionUI();
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon"><i class="fa-solid fa-circle-info"></i></span>
        <h3>Nenhum exercício encontrado</h3>
        <p>Não encontramos itens relacionados a <strong>${escapeHTML(muscle)}</strong> na biblioteca atual.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <h5 class="mb-2">Exercícios para <span class="text-success">${escapeHTML(muscle)}</span></h5>
    <p class="text-muted mb-3">${filtered.length} exercício(s) relacionado(s)</p>
    <div class="row g-3" id="muscleExercisesList">
      ${filtered.map(ex => {
        const badgeClass = ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard';
        return `
          <div class="col-md-4 col-lg-3">
            <div class="exercise-card" onclick="abrirModalExercicio(${ex.id})">
              <img src="${ex.gif}" alt="${escapeHTML(ex.name)}">
              <h5 class="mt-2 mb-1">${escapeHTML(ex.name)}</h5>
              <div class="exercise-tags">
                <span class="badge ${badgeClass}">${ex.difficulty}</span>
                <span class="badge bg-info">${escapeHTML(ex.muscle)}</span>
                <span class="badge bg-secondary">${escapeHTML(ex.equip)}</span>
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

