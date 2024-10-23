// dashboard.js

// State Management
const state = {
    epics: [],
    stories: {},
    filters: {
      theme: '',
      search: ''
    },
    chart: null
  };
  
  // DOM Elements
  const elements = {
    themeList: document.getElementById('themeList'),
    storiesContainer: document.getElementById('storiesContainer'),
    newThemeInput: document.getElementById('newTheme'),
    addThemeBtn: document.getElementById('addTheme'),
    themeFilter: document.getElementById('themeFilter'),
    searchInput: document.getElementById('storySearch'),
    exportAllBtn: document.getElementById('exportAll'),
    themeChart: document.getElementById('themeChart'),
    toastContainer: document.querySelector('.toast-container'),
    templates: {
      themeCard: document.getElementById('themeCardTemplate'),
      storyCard: document.getElementById('storyCardTemplate')
    }
  };
  
  // Initialize
  document.addEventListener('DOMContentLoaded', initialize);
  
  async function initialize() {
    try {
      await loadData();
      setupEventListeners();
      renderThemes();
      renderStories();
      updateChart();
    } catch (error) {
      showToast('Fehler beim Initialisieren des Dashboards', 'danger');
      console.error('Initialization error:', error);
    }
  }
  
  // Event Listeners
  function setupEventListeners() {
    elements.addThemeBtn.addEventListener('click', handleAddTheme);
    elements.themeFilter.addEventListener('change', handleFilterChange);
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.exportAllBtn.addEventListener('click', handleExportAll);
  
    // Delegate theme list events
    elements.themeList.addEventListener('click', handleThemeActions);
    // Delegate story container events
    elements.storiesContainer.addEventListener('click', handleStoryActions);
  }
  
  // Data Management
  async function loadData() {
    try {
      state.epics = JSON.parse(localStorage.getItem('epics')) || [];
      state.stories = JSON.parse(localStorage.getItem('epicData')) || {};
      updateFilters();
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Fehler beim Laden der Daten', 'danger');
    }
  }
  
  function saveData() {
    try {
      localStorage.setItem('epics', JSON.stringify(state.epics));
      localStorage.setItem('epicData', JSON.stringify(state.stories));
    } catch (error) {
      console.error('Error saving data:', error);
      showToast('Fehler beim Speichern der Daten', 'danger');
    }
  }
  
  // Theme Management
  function handleAddTheme() {
    const themeName = elements.newThemeInput.value.trim();
  
    if (!themeName) {
      showToast('Bitte geben Sie einen Namen für das Thema ein.', 'danger');
      return;
    }
  
    if (state.epics.includes(themeName)) {
      showToast('Thema existiert bereits.', 'danger');
      return;
    }
  
    state.epics.push(themeName);
    state.stories[themeName] = [];
    saveData();
    renderThemes();
    updateChart();
    elements.newThemeInput.value = '';
    showToast('Thema erfolgreich hinzugefügt.');
  }
  
  function handleThemeActions(event) {
    const button = event.target.closest('button');
    if (!button) return;
  
    const themeCard = button.closest('.theme-card');
    const themeName = themeCard.dataset.theme;
  
    if (button.classList.contains('btn-edit')) {
      editTheme(themeName);
    } else if (button.classList.contains('btn-delete')) {
      deleteTheme(themeName);
    }
  }
  
  function editTheme(themeName) {
    const newName = prompt('Neuen Namen für das Thema eingeben:', themeName);
  
    if (!newName || newName.trim() === '' || newName === themeName) return;
  
    if (state.epics.includes(newName)) {
      showToast('Thema mit diesem Namen existiert bereits.', 'danger');
      return;
    }
  
    const index = state.epics.indexOf(themeName);
    state.epics[index] = newName;
    state.stories[newName] = state.stories[themeName];
    delete state.stories[themeName];
  
    saveData();
    renderThemes();
    renderStories();
    updateChart();
    showToast('Thema erfolgreich umbenannt.');
  }
  
  function deleteTheme(themeName) {
    if (!confirm(`Möchten Sie das Thema "${themeName}" und alle zugehörigen User Stories wirklich löschen?`)) return;
  
    const index = state.epics.indexOf(themeName);
    state.epics.splice(index, 1);
    delete state.stories[themeName];
  
    saveData();
    renderThemes();
    renderStories();
    updateChart();
    showToast('Thema erfolgreich gelöscht.');
  }
  
  // Story Management
  function handleStoryActions(event) {
    const button = event.target.closest('button');
    if (!button) return;
  
    const storyCard = button.closest('.story-card');
    const { theme, storyId } = storyCard.dataset;
  
    if (button.classList.contains('btn-edit')) {
      editStory(theme, storyId);
    } else if (button.classList.contains('btn-delete')) {
      deleteStory(theme, storyId);
    }
  }
  
  function editStory(theme, storyId) {
    const story = state.stories[theme][storyId];
    const newText = prompt('Bearbeiten Sie die User Story:', story);
  
    if (!newText || newText.trim() === '' || newText === story) return;
  
    state.stories[theme][storyId] = newText;
    saveData();
    renderStories();
    showToast('User Story erfolgreich aktualisiert.');
  }
  
  function deleteStory(theme, storyId) {
    if (!confirm('Möchten Sie diese User Story wirklich löschen?')) return;
  
    state.stories[theme].splice(storyId, 1);
    saveData();
    renderStories();
    updateChart();
    showToast('User Story erfolgreich gelöscht.');
  }
  
  // Filtering and Search
  function handleFilterChange() {
    state.filters.theme = elements.themeFilter.value;
    renderStories();
  }
  
  function handleSearchInput(event) {
    state.filters.search = event.target.value.toLowerCase();
    renderStories();
  }
  
  function updateFilters() {
    // Update theme filter dropdown
    elements.themeFilter.innerHTML = '<option value="">Alle Themen</option>';
    state.epics.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = theme;
      elements.themeFilter.appendChild(option);
    });
  }
  
  // Rendering
  function renderThemes() {
    elements.themeList.innerHTML = '';
  
    state.epics.forEach(theme => {
      const themeCard = elements.templates.themeCard.content.cloneNode(true);
      const card = themeCard.querySelector('.theme-card');
  
      card.dataset.theme = theme;
      card.querySelector('.theme-title').textContent = theme;
      card.querySelector('.story-count').textContent =
        `${state.stories[theme]?.length || 0} Stories`;
  
      elements.themeList.appendChild(themeCard);
    });
  
    updateFilters();
  }
  
  function renderStories() {
    elements.storiesContainer.innerHTML = '';
    let filteredStories = [];
  
    // Apply filters
    state.epics.forEach(theme => {
      if (!state.filters.theme || state.filters.theme === theme) {
        const stories = state.stories[theme] || [];
        stories.forEach((story, index) => {
          if (!state.filters.search ||
            story.toLowerCase().includes(state.filters.search)) {
            filteredStories.push({ theme, story, index });
          }
        });
      }
    });
  
    if (filteredStories.length === 0) {
      elements.storiesContainer.innerHTML = '<p class="text-muted">Keine User Stories gefunden.</p>';
      return;
    }
  
    // Render filtered stories
    filteredStories.forEach(({ theme, story, index }) => {
      const storyCard = elements.templates.storyCard.content.cloneNode(true);
      const card = storyCard.querySelector('.story-card');
  
      card.dataset.theme = theme;
      card.dataset.storyId = index;
      card.querySelector('.story-title').textContent = `Story ${index + 1}`;
      card.querySelector('.story-text').textContent = story;
      card.querySelector('.story-theme').textContent = `Thema: ${theme}`;
  
      elements.storiesContainer.appendChild(storyCard);
    });
  }
  
  // Chart Visualization
  function updateChart() {
    if (state.chart) {
      state.chart.destroy();
    }
  
    const data = {
      labels: state.epics,
      datasets: [{
        label: 'Stories per Thema',
        data: state.epics.map(theme => state.stories[theme]?.length || 0),
        backgroundColor: generateChartColors(state.epics.length),
        borderWidth: 1
      }]
    };
  
    const config = {
      type: 'bar',
      data: data,
      options: {
        indexAxis: 'y',
        responsive: true,
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    };
  
    state.chart = new Chart(elements.themeChart, config);
  }
  
  // Utility Functions
  function generateChartColors(count) {
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];
    return Array(count).fill().map((_, i) => colors[i % colors.length]);
  }
  
  function showToast(message, type = 'success') {
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${type} border-0 show`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
  
    const toastBody = document.createElement('div');
    toastBody.className = 'd-flex';
  
    const toastContent = document.createElement('div');
    toastContent.className = 'toast-body';
    toastContent.textContent = message;
  
    const closeButton = document.createElement('button');
    closeButton.className = 'btn-close me-2 m-auto';
    closeButton.setAttribute('type', 'button');
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
  
    toastBody.appendChild(toastContent);
    toastBody.appendChild(closeButton);
    toastEl.appendChild(toastBody);
    elements.toastContainer.appendChild(toastEl);
  
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
  }
  
  // Export Functionality
  function handleExportAll() {
    try {
      const data = {
        themes: state.epics,
        stories: state.stories,
        exportDate: new Date().toISOString()
      };
  
      const blob = new Blob([JSON.stringify(data, null, 2)],
        { type: 'application/json' });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.download = 'user_stories_export.json';
      link.click();
  
      URL.revokeObjectURL(url);
      showToast('Daten erfolgreich exportiert.');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Fehler beim Exportieren der Daten.', 'danger');
    }
  }
  