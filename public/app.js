// app.js

// Variables
let apiKey = '';
let epics = JSON.parse(localStorage.getItem('epics')) || [];
let currentEpic = '';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const documentInput = document.getElementById('documentInput');
const processButton = document.getElementById('generateStories');
const clearButton = document.getElementById('clearForm');
const fileInput = document.getElementById('fileInput');
const fileNameDisplay = document.getElementById('fileName');
const epicInput = document.getElementById('epicInput');
const epicSelect = document.getElementById('epicSelect');
const addEpicButton = document.getElementById('addEpicButton');
const userStoriesOutput = document.getElementById('storiesOutput');
const copyButton = document.getElementById('copyStories');
const exportButton = document.getElementById('downloadTxt');
const exportJSONButton = document.getElementById('downloadJson');
const loadingSpinner = document.getElementById('loadingSpinner');
const resultsSection = document.getElementById('resultsSection');
const toastContainer = document.querySelector('.toast-container');

// Initialize
loadEpics();

// Event Listeners
processButton.addEventListener('click', processDocument);
clearButton.addEventListener('click', clearInputs);
fileInput.addEventListener('change', handleFileUpload);
addEpicButton.addEventListener('click', addOrSelectEpic);
copyButton.addEventListener('click', copyUserStories);
exportButton.addEventListener('click', exportUserStoriesTXT);
exportJSONButton.addEventListener('click', exportUserStoriesJSON);

// Functions

// Show Toast Notification
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
  toastContainer.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl);
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// Load Epics into Select Dropdown
function loadEpics() {
  epics = JSON.parse(localStorage.getItem('epics')) || [];
  epicSelect.innerHTML = '<option value="">-- Wählen Sie ein bestehendes Thema --</option>';
  epics.forEach(epic => {
    const option = document.createElement('option');
    option.value = epic;
    option.textContent = epic;
    epicSelect.appendChild(option);
  });
}

// Add or Select Epic
function addOrSelectEpic() {
  const epicName = epicInput.value.trim() || epicSelect.value;
  if (epicName === '') {
    showToast('Bitte geben Sie ein Thema ein oder wählen Sie eines aus.', 'danger');
    return;
  }

  currentEpic = epicName;

  if (!epics.includes(epicName)) {
    epics.push(epicName);
    localStorage.setItem('epics', JSON.stringify(epics));
    loadEpics();
    showToast(`Thema "${currentEpic}" hinzugefügt.`);
  } else {
    showToast(`Thema "${currentEpic}" ausgewählt.`);
  }

  epicInput.value = '';
  epicSelect.value = currentEpic;
}

// Process Document to Generate User Stories
async function processDocument() {
  const documentText = documentInput.value.trim();
  apiKey = apiKeyInput.value.trim();

  if (apiKey === '') {
    showToast('Bitte geben Sie Ihren OpenAI API-Schlüssel ein.', 'danger');
    apiKeyInput.focus();
    return;
  }

  if (documentText === '') {
    showToast('Bitte geben Sie einen historischen Text ein.', 'danger');
    documentInput.focus();
    return;
  }

  if (currentEpic === '') {
    showToast('Bitte wählen oder erstellen Sie ein Thema aus.', 'danger');
    epicInput.focus();
    return;
  }

  userStoriesOutput.textContent = '';
  resultsSection.classList.add('d-none');
  loadingSpinner.classList.remove('d-none');

  try {
    const userStories = await extractUserStories(documentText);
    displayUserStories(userStories);
    saveUserStories(userStories);
    showToast('User Stories erfolgreich generiert.', 'success');
    resultsSection.classList.remove('d-none');
  } catch (error) {
    showToast('Fehler beim Generieren der User Stories.', 'danger');
    console.error(error);
  } finally {
    loadingSpinner.classList.add('d-none');
  }
}

// Extract User Stories using OpenAI API
async function extractUserStories(documentText) {
  const maxChunkSize = 2000; // Adjust based on the API's token limit
  const chunks = splitTextIntoChunks(documentText, maxChunkSize);

  const userStories = [];

  for (const chunk of chunks) {
    const prompt = `
Analysieren Sie den folgenden historischen Text aus der Perspektive verschiedener historischer Forschungsansätze. Erstellen Sie User Stories im Format: "Als [spezifisches historisches Forschungsfeld] möchte ich [konkretes Ziel], um [Nutzen] zu erreichen."

Mögliche Forschungsperspektiven sind:
- Wirtschaftshistoriker (Fokus auf Handelsbeziehungen, Preise, Wirtschaftsstrukturen)
- Sozialhistoriker (Fokus auf soziale Beziehungen, Hierarchien, Arbeitsverhältnisse)
- Agrarhistoriker (Fokus auf landwirtschaftliche Praktiken, Werkzeuge, Produktionsmethoden)
- Historische Demografen (Fokus auf Bevölkerungsstrukturen, Familienbeziehungen)
- Regionalhistoriker (Fokus auf lokale/regionale Entwicklungen)
- Alltagsgeschichtler (Fokus auf materielle Kultur, Konsumpraktiken)
- Technikhistoriker (Fokus auf Werkzeuge, Technologien, Innovationen)
- Umweltgeschichtler (Fokus auf Mensch-Umwelt-Beziehungen)

Berücksichtigen Sie die folgenden Aspekte:
- Wissenschaftliche Relevanz der Erkenntnisse
- Quellenkritische Aspekte
- Methodische Herangehensweisen
- Forschungskontext
- Historiographische Einordnung

Historischer Text:
${chunk}
`;

    try {
      const response = await callOpenAIAPI(prompt);
      const stories = response.split('\n').filter(line => line.trim() !== '');
      userStories.push(...stories);
    } catch (error) {
      throw error;
    }
  }

  return userStories;
}

// Call OpenAI API
async function callOpenAIAPI(prompt) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Fehler beim Aufruf der OpenAI API');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Fehler beim Aufruf der OpenAI API:', error);
    throw error;
  }
}

// Split Text into Chunks
function splitTextIntoChunks(text, maxChunkSize) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let chunk = '';

  for (const sentence of sentences) {
    if ((chunk + sentence).length > maxChunkSize) {
      chunks.push(chunk);
      chunk = sentence;
    } else {
      chunk += sentence;
    }
  }
  if (chunk) {
    chunks.push(chunk);
  }
  return chunks;
}

// Display User Stories
function displayUserStories(stories) {
  if (stories.length === 0) {
    userStoriesOutput.textContent = 'Keine User Stories gefunden.';
    return;
  }

  userStoriesOutput.innerHTML = '';
  stories.forEach((story, index) => {
    const storyElement = document.createElement('p');
    storyElement.textContent = `${index + 1}. ${story.trim()}`;
    userStoriesOutput.appendChild(storyElement);
  });
}

// Save User Stories to LocalStorage
function saveUserStories(stories) {
  const epicData = JSON.parse(localStorage.getItem('epicData')) || {};
  epicData[currentEpic] = (epicData[currentEpic] || []).concat(stories);
  localStorage.setItem('epicData', JSON.stringify(epicData));
}

// Handle File Upload
function handleFileUpload() {
  const file = fileInput.files[0];
  if (file) {
    fileNameDisplay.textContent = `${file.name}`;
    const reader = new FileReader();
    reader.onload = function (e) {
      documentInput.value = e.target.result;
    };
    reader.readAsText(file);
  } else {
    fileNameDisplay.textContent = '';
  }
}

// Clear Inputs
function clearInputs() {
  documentInput.value = '';
  fileInput.value = '';
  fileNameDisplay.textContent = '';
  epicInput.value = '';
  epicSelect.value = '';
  currentEpic = '';
  userStoriesOutput.textContent = '';
  resultsSection.classList.add('d-none');
  showToast('Eingaben gelöscht.', 'info');
}

// Copy User Stories to Clipboard
function copyUserStories() {
  const stories = Array.from(userStoriesOutput.querySelectorAll('p'))
    .map(p => p.textContent)
    .join('\n\n');
  if (stories.trim() === '') {
    showToast('Keine User Stories zum Kopieren vorhanden.', 'danger');
    return;
  }
  navigator.clipboard.writeText(stories)
    .then(() => {
      showToast('User Stories wurden in die Zwischenablage kopiert.');
    })
    .catch(err => {
      showToast('Fehler beim Kopieren in die Zwischenablage.', 'danger');
      console.error('Clipboard error:', err);
    });
}

// Export User Stories as TXT
function exportUserStoriesTXT() {
  const stories = Array.from(userStoriesOutput.querySelectorAll('p'))
    .map(p => p.textContent)
    .join('\n\n');
  if (stories.trim() === '') {
    showToast('Keine User Stories zum Herunterladen vorhanden.', 'danger');
    return;
  }
  const blob = new Blob([stories], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user_stories.txt';
  link.click();
  showToast('User Stories als TXT heruntergeladen.');
}

// Export User Stories as JSON
function exportUserStoriesJSON() {
  const epicData = JSON.parse(localStorage.getItem('epicData')) || {};
  if (Object.keys(epicData).length === 0) {
    showToast('Keine User Stories zum Exportieren vorhanden.', 'danger');
    return;
  }
  const blob = new Blob([JSON.stringify(epicData, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'user_stories.json';
  link.click();
  showToast('User Stories als JSON heruntergeladen.');
}
