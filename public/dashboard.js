// dashboard.js

// Load epics and user stories from localStorage
let epics = JSON.parse(localStorage.getItem('epics')) || [];
let epicData = JSON.parse(localStorage.getItem('epicData')) || {};

// Function to display epics
function displayEpics() {
    const epicList = document.getElementById('epicList');
    epicList.innerHTML = '';

    epics.forEach((epic, index) => {
        const li = document.createElement('li');
        li.textContent = epic;

        // Delete epic button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Löschen';
        deleteButton.style.marginLeft = '10px';
        deleteButton.addEventListener('click', () => deleteEpic(epic));
        li.appendChild(deleteButton);

        epicList.appendChild(li);
    });

    // Update epic filter dropdown
    const epicFilter = document.getElementById('epicFilter');
    epicFilter.innerHTML = '<option value="">-- Alle Epics --</option>';
    epics.forEach(epic => {
        const option = document.createElement('option');
        option.value = epic;
        option.textContent = epic;
        epicFilter.appendChild(option);
    });
}

// Function to display user stories
function displayUserStories(epicFilterValue = '') {
    const storiesContainer = document.getElementById('storiesContainer');
    storiesContainer.innerHTML = '';

    let allStories = [];

    if (epicFilterValue) {
        allStories = epicData[epicFilterValue] || [];
    } else {
        Object.values(epicData).forEach(stories => {
            allStories = allStories.concat(stories);
        });
    }

    allStories.forEach((story, index) => {
        const storyCard = document.createElement('div');
        storyCard.className = 'story-card';

        const storyTitle = document.createElement('h3');
        storyTitle.textContent = `User Story ${index + 1}`;
        storyCard.appendChild(storyTitle);

        const storyText = document.createElement('p');
        storyText.textContent = story;
        storyCard.appendChild(storyText);

        const storyActions = document.createElement('div');
        storyActions.className = 'story-actions';

        const editButton = document.createElement('button');
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => editUserStory(epicFilterValue, index));
        storyActions.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => deleteUserStory(epicFilterValue, index));
        storyActions.appendChild(deleteButton);

        storyCard.appendChild(storyActions);
        storiesContainer.appendChild(storyCard);
    });
}

// Function to add a new epic
document.getElementById('addEpicButton').addEventListener('click', () => {
    const newEpicInput = document.getElementById('newEpicInput');
    const newEpic = newEpicInput.value.trim();
    if (newEpic !== '' && !epics.includes(newEpic)) {
        epics.push(newEpic);
        localStorage.setItem('epics', JSON.stringify(epics));
        epicData[newEpic] = [];
        localStorage.setItem('epicData', JSON.stringify(epicData));
        displayEpics();
        newEpicInput.value = '';
        updateVisualization();
    }
});

// Function to delete an epic
function deleteEpic(epicName) {
    if (confirm(`Möchten Sie das Epic "${epicName}" und alle zugehörigen User Stories wirklich löschen?`)) {
        epics = epics.filter(epic => epic !== epicName);
        delete epicData[epicName];
        localStorage.setItem('epics', JSON.stringify(epics));
        localStorage.setItem('epicData', JSON.stringify(epicData));
        displayEpics();
        displayUserStories();
        updateVisualization();
    }
}

// Function to edit a user story
function editUserStory(epicName, index) {
    const currentStory = epicData[epicName][index];
    const newStory = prompt('Bearbeiten Sie die User Story:', currentStory);
    if (newStory !== null && newStory.trim() !== '') {
        epicData[epicName][index] = newStory.trim();
        localStorage.setItem('epicData', JSON.stringify(epicData));
        displayUserStories(epicName);
        updateVisualization();
    }
}

// Function to delete a user story
function deleteUserStory(epicName, index) {
    if (confirm('Möchten Sie diese User Story wirklich löschen?')) {
        epicData[epicName].splice(index, 1);
        localStorage.setItem('epicData', JSON.stringify(epicData));
        displayUserStories(epicName);
        updateVisualization();
    }
}

// Event listener for epic filter
document.getElementById('epicFilter').addEventListener('change', function () {
    const selectedEpic = this.value;
    displayUserStories(selectedEpic);
});

// Visualization using Chart.js
let epicChart;

function updateVisualization() {
    const labels = epics;
    const data = labels.map(epic => (epicData[epic] || []).length);

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
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    integer: true
                }
            }
        }
    });
}

// Initial display
displayEpics();
displayUserStories();
updateVisualization();
