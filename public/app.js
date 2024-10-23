// app.js

let apiKey = '';
let epics = JSON.parse(localStorage.getItem('epics')) || [];
let currentEpic = '';

// Event listener for the "Extract User Stories" button
document.getElementById('processButton').addEventListener('click', () => {
    const documentText = document.getElementById('documentInput').value.trim();
    apiKey = document.getElementById('apiKeyInput').value.trim();

    if (apiKey === '') {
        alert('Bitte geben Sie Ihren OpenAI API-Schlüssel ein.');
        return;
    }

    if (documentText === '') {
        alert('Bitte geben Sie ein historisches Dokument ein.');
        return;
    }

    if (currentEpic === '') {
        alert('Bitte wählen oder erstellen Sie ein Epic aus.');
        return;
    }

    extractUserStories(documentText);
});

// Show/Hide API Key functionality
document.getElementById('toggleApiKey').addEventListener('click', () => {
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleButton = document.getElementById('toggleApiKey');
    if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        toggleButton.textContent = 'Ausblenden';
    } else {
        apiKeyInput.type = 'password';
        toggleButton.textContent = 'Anzeigen';
    }
});

// Function to extract user stories from the historical text
async function extractUserStories(documentText) {
    const outputElement = document.getElementById('userStoriesOutput');
    const loadingSpinner = document.getElementById('loadingSpinner');
    outputElement.textContent = '';
    loadingSpinner.classList.remove('hidden');

    try {
        const maxChunkSize = 2000; // Adjust based on the API's token limit
        const chunks = splitTextIntoChunks(documentText, maxChunkSize);

        // Process chunks in parallel for better performance
        const promises = chunks.map(chunk => {
            const prompt = `
Analysieren Sie den folgenden historischen Text aus der Perspektive verschiedener historischer Forschungsansätze. Erstellen Sie User Stories im Format: "Als [spezifisches historisches Forschungsfeld] möchte ich [konkrete Untersuchung/Analyse], um [wissenschaftliches Forschungsziel] zu erreichen."

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
            return callOpenAIAPI(prompt);
        });

        const responses = await Promise.all(promises);
        const allUserStories = responses.filter(Boolean).join('\n');

        // Split the combined user stories into an array
        const userStoriesArray = allUserStories.split('\n').filter(line => line.trim() !== '');

        // Number the user stories
        const numberedUserStories = userStoriesArray.map((story, index) => `${index + 1}. ${story.trim()}`).join('\n\n');

        outputElement.textContent = numberedUserStories || 'Keine User Stories gefunden.';

        // Store user stories in localStorage under the current epic
        const epicData = JSON.parse(localStorage.getItem('epicData')) || {};
        epicData[currentEpic] = (epicData[currentEpic] || []).concat(userStoriesArray);
        localStorage.setItem('epicData', JSON.stringify(epicData));

        // Update visualization
        updateVisualization();

    } catch (error) {
        outputElement.textContent = 'Fehler: ' + error.message;
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

// Function to call the OpenAI API
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

        // Clear API key if it's invalid
        if (error.message.includes('Invalid API key')) {
            apiKey = '';
        }

        throw error;
    }
}

// Function to split the text into smaller chunks
function splitTextIntoChunks(text, maxChunkSize) {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
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

// Event listener for the "Export User Stories" button (TXT)
document.getElementById('exportButton').addEventListener('click', () => {
    const userStories = document.getElementById('userStoriesOutput').textContent;
    if (userStories.trim() === '') {
        alert('Keine User Stories zum Herunterladen vorhanden.');
        return;
    }
    const blob = new Blob([userStories], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_stories.txt';
    link.click();
});

// Event listener for the "Export User Stories as JSON" button
document.getElementById('exportJSONButton').addEventListener('click', () => {
    const epicData = JSON.parse(localStorage.getItem('epicData')) || {};
    if (Object.keys(epicData).length === 0) {
        alert('Keine User Stories zum Exportieren vorhanden.');
        return;
    }
    const blob = new Blob([JSON.stringify(epicData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'user_stories.json';
    link.click();
});

// Event listener for the "Copy User Stories" button
document.getElementById('copyButton').addEventListener('click', () => {
    const userStories = document.getElementById('userStoriesOutput').textContent;
    if (userStories.trim() === '') {
        alert('Keine User Stories zum Kopieren vorhanden.');
        return;
    }
    navigator.clipboard.writeText(userStories)
        .then(() => {
            alert('User Stories wurden in die Zwischenablage kopiert.');
        })
        .catch(err => {
            alert('Fehler beim Kopieren in die Zwischenablage.');
            console.error('Clipboard error:', err);
        });
});

// Event listener for the file input
document.getElementById('fileInput').addEventListener('change', function () {
    const file = this.files[0];
    const fileNameDisplay = document.getElementById('fileName');
    if (file) {
        fileNameDisplay.textContent = `Ausgewählte Datei: ${file.name}`;
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('documentInput').value = e.target.result;
        };
        reader.readAsText(file);
    } else {
        fileNameDisplay.textContent = '';
    }
});

// Event listener for the "Clear" button
document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('documentInput').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('fileName').textContent = '';
});

// Epic management
const epicInput = document.getElementById('epicInput');
const epicSelect = document.getElementById('epicSelect');
const addEpicButton = document.getElementById('addEpicButton');

// Load epics into the select dropdown
function loadEpics() {
    epics = JSON.parse(localStorage.getItem('epics')) || [];
    epicSelect.innerHTML = '<option value="">-- Wählen Sie ein Epic --</option>';
    epics.forEach(epic => {
        const option = document.createElement('option');
        option.value = epic;
        option.textContent = epic;
        epicSelect.appendChild(option);
    });
}

loadEpics();

// Event listener for adding/selecting an epic
addEpicButton.addEventListener('click', () => {
    const epicName = epicInput.value.trim() || epicSelect.value;
    if (epicName === '') {
        alert('Bitte geben Sie einen Epic-Namen ein oder wählen Sie einen aus.');
        return;
    }

    currentEpic = epicName;

    if (!epics.includes(epicName)) {
        epics.push(epicName);
        localStorage.setItem('epics', JSON.stringify(epics));
        loadEpics();
    }

    alert(`Epic "${currentEpic}" ausgewählt.`);
    epicInput.value = '';
    epicSelect.value = currentEpic;

    // Update visualization
    updateVisualization();
});

// Visualization using Chart.js
let epicChart;

function updateVisualization() {
    const epicData = JSON.parse(localStorage.getItem('epicData')) || {};

    const labels = Object.keys(epicData);
    const data = labels.map(epic => epicData[epic].length);

    const ctx = document.getElementById('epicChart').getContext('2d');

    if (epicChart) {
        epicChart.destroy();
    }

    epicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Anzahl der User Stories',
                data: data,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    integer: true
                }
            }
        }
    });
}

// Initial visualization
updateVisualization();
