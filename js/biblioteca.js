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
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="empty-state">
          <span class="empty-state-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          <h3>Nenhum exercício encontrado</h3>
          <p>Tente ajustar os filtros ou buscar por outro grupo muscular, equipamento ou nível de dificuldade.</p>
        </div>
      </div>
    `;
    return;
  }
  container.innerHTML = filtered.map(ex => {
    const badgeClass = ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard';
    const safeName = escapeHTML(ex.name);
    const safeMuscle = escapeHTML(ex.muscle);
    const safeEquip = escapeHTML(ex.equip);
    return `
    <div class="col-md-4 col-lg-3">
      <div class="exercise-card" onclick="abrirModalExercicio(${ex.id})">
        <img src="${ex.gif}" alt="${safeName}">
        <h5 class="mt-2 mb-1">${safeName}</h5>
        <div class="exercise-tags">
          <span class="badge ${badgeClass}">${ex.difficulty}</span>
          <span class="badge bg-info">${safeMuscle}</span>
          <span class="badge bg-secondary">${safeEquip}</span>
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
  const safeName = escapeHTML(ex.name);
  const safeMuscle = escapeHTML(ex.muscle);
  const safeSecondary = escapeHTML(ex.secondary);
  const safeEquip = escapeHTML(ex.equip);
  const safeLevel = escapeHTML(ex.level);
  const safeInstructions = escapeHTML(ex.instructions);
  const safeTips = escapeHTML(ex.tips);
  document.getElementById('modalExerciseContent').innerHTML = `
    <div class="text-center mb-3">
      <img src="${ex.gif}" alt="${safeName}" class="exercise-modal-image">
    </div>
    <h3 id="exerciseModalTitle" class="mb-2">${safeName}</h3>
    <div class="mb-3">
      <span class="badge ${ex.difficulty === 'Fácil' ? 'badge-easy' : ex.difficulty === 'Média' ? 'badge-medium' : 'badge-hard'}">${ex.difficulty}</span>
      <span class="badge bg-info">${safeMuscle}</span>
      <span class="badge bg-secondary">${safeEquip}</span>
      <span class="badge bg-success">${safeLevel}</span>
    </div>
    <div class="mb-3">
      <h5>Músculo Principal</h5>
      <p>${safeMuscle}</p>
      <h5>Músculos Secundários</h5>
      <p>${safeSecondary}</p>
    </div>
    <div class="mb-3" style="background:#052e16;padding:12px;border-radius:8px;">
      <h5>Instruções</h5>
      <p style="white-space:pre-wrap;">${safeInstructions}</p>
    </div>
    <div class="mb-3" style="background:#1a3a1a;padding:12px;border-radius:8px;">
      <h5>Dicas</h5>
      <p>${safeTips}</p>
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
    `<div class="col-12">
      <div class="empty-state">
        <span class="empty-state-icon"><i class="fa-regular fa-heart"></i></span>
        <h3>Sua lista de favoritos está vazia</h3>
        <p>Use o coração na biblioteca ou no mapa muscular para montar um atalho com os exercícios que você mais usa.</p>
      </div>
    </div>` : 
    favEx.map(ex => `
      <div class="col-md-4">
        <div class="exercise-card">
          <img src="${ex.gif}" alt="${escapeHTML(ex.name)}">
          <h5 class="mt-2">${escapeHTML(ex.name)}</h5>
          <p class="text-muted">Músculo: ${escapeHTML(ex.muscle)}</p>
          <button onclick="toggleFavorite(${ex.id})" class="btn btn-sm btn-outline-warning"><i class="fas fa-heart"></i> Remover</button>
        </div>
      </div>
    `).join('');
}

// ==================== OUTRAS FUNÇÕES (MESMO DE ANTES) ====================
