// Initialize data from localStorage or use default data
let stories = JSON.parse(localStorage.getItem('stories')) || [
    {
        id: 1,
        title: "User Story 1",
        description: "As a user, I want to create an account to access personalized features.",
        epic: "User Management"
    },
    {
        id: 2,
        title: "User Story 2",
        description: "As an admin, I want to view all user accounts to manage access.",
        epic: "Administration"
    },
    {
        id: 3,
        title: "User Story 3",
        description: "As a user, I want to generate reports of my activity.",
        epic: "Reporting"
    }
];

let epics = JSON.parse(localStorage.getItem('epics')) || ["User Management", "Administration", "Reporting"];

// Save data to localStorage
function saveData() {
    localStorage.setItem('stories', JSON.stringify(stories));
    localStorage.setItem('epics', JSON.stringify(epics));
}

// Function to render stories on the dashboard
function renderStories(filterText = '', filterEpic = '') {
    const container = $("#stories-container");
    container.empty();

    let filteredStories = stories.filter(story => {
        const matchesText = story.title.toLowerCase().includes(filterText.toLowerCase()) ||
                            story.description.toLowerCase().includes(filterText.toLowerCase());
        const matchesEpic = filterEpic === '' || story.epic === filterEpic;
        return matchesText && matchesEpic;
    });

    filteredStories.forEach((story) => {
        const storyCard = `
            <div class="col-md-6 story-card" data-id="${story.id}">
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${story.title}</h5>
                        <p class="card-text">${story.description}</p>
                        <p><strong>Epic:</strong> ${story.epic}</p>
                        <a href="edit_story.html?id=${story.id}" class="btn btn-secondary">Edit</a>
                    </div>
                </div>
            </div>
        `;
        container.append(storyCard);
    });

    // Make stories draggable
    $(".story-card").draggable({
        revert: "invalid",
        helper: "clone",
        start: function() {
            $(this).css('opacity', '0.5');
        },
        stop: function() {
            $(this).css('opacity', '1');
        }
    });
}

// Function to load epics into the filter dropdown
function loadEpics() {
    const epicFilter = $("#filter-epic");
    epicFilter.empty();
    epicFilter.append(`<option value="">All Epics</option>`);
    epics.forEach((epic) => {
        const option = `<option value="${epic}">${epic}</option>`;
        epicFilter.append(option);
    });
}

// Function to load epics into the story form
function loadEpicsIntoForm(selectedEpic = '') {
    const epicSelect = $("#story-epic");
    epicSelect.empty();
    epics.forEach(epic => {
        const isSelected = epic === selectedEpic ? 'selected' : '';
        const option = `<option value="${epic}" ${isSelected}>${epic}</option>`;
        epicSelect.append(option);
    });
}

// Function to load stories into epics drop zones
function loadStoriesInEpics() {
    $(".story-list").empty();
    stories.forEach(story => {
        const storyItem = `
            <div class="card mb-2">
                <div class="card-body">
                    <h5 class="card-title">${story.title}</h5>
                    <p class="card-text">${story.description}</p>
                </div>
            </div>
        `;
        $(`.epic-drop-zone[data-epic="${story.epic}"] .story-list`).append(storyItem);
    });
}

// Epics Management Functions
function loadEpicsManagement() {
    const epicList = $("#epic-list");
    const epicDropArea = $("#epic-drop-area");
    epicList.empty();
    epicDropArea.empty();

    epics.forEach((epic) => {
        // Add to epics list
        const epicItem = `<li class="list-group-item">${epic}</li>`;
        epicList.append(epicItem);

        // Create drop zone for each epic
        const dropZone = `
            <div class="col-md-6">
                <div class="epic-drop-zone card mb-3" data-epic="${epic}">
                    <div class="card-header">${epic}</div>
                    <div class="card-body">
                        <p>Drag stories here to assign to this epic.</p>
                        <div class="story-list">
                            <!-- Stories assigned to this epic -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        epicDropArea.append(dropZone);
    });

    // Make drop zones droppable
    $(".epic-drop-zone").droppable({
        accept: ".story-card",
        drop: function(event, ui) {
            const storyId = ui.draggable.data("id");
            const epicName = $(this).data("epic");

            // Update the story's epic
            stories = stories.map(story => {
                if (story.id === storyId) {
                    story.epic = epicName;
                }
                return story;
            });

            saveData(); // Save updated data

            // Refresh the stories in the drop zones
            loadStoriesInEpics();
            // Refresh stories on dashboard if needed
            if (typeof renderStories === 'function') {
                renderStories();
            }
        }
    });

    // Load stories into drop zones
    loadStoriesInEpics();
}

// Handle form submission for creating or editing a story
$("#story-form").submit(function(event) {
    event.preventDefault();
    const title = $("#story-title").val();
    const description = $("#story-description").val();
    const epic = $("#story-epic").val();
    const storyId = parseInt($("#story-id").val());

    if (storyId) {
        // Edit existing story
        stories = stories.map(story => {
            if (story.id === storyId) {
                return { id: storyId, title, description, epic };
            }
            return story;
        });
    } else {
        // Assign a new ID to the story
        const newId = stories.length ? stories[stories.length - 1].id + 1 : 1;

        // Save the new story
        stories.push({
            id: newId,
            title: title,
            description: description,
            epic: epic
        });
    }

    saveData(); // Save updated data

    // Redirect to dashboard
    window.location.href = "dashboard.html";
});

// Handle adding a new epic
$("#add-epic-btn").click(function() {
    const newEpic = prompt("Enter the name of the new epic:");
    if (newEpic) {
        epics.push(newEpic);
        saveData(); // Save updated data
        loadEpicsManagement();
        loadEpics(); // Update epics in other parts of the app
        if (typeof loadEpicsIntoForm === 'function') {
            loadEpicsIntoForm(); // Update epics in the story form
        }
    }
});

// Search and filter functionality on the dashboard
$("#search-bar").on("input", function() {
    const searchText = $(this).val();
    const selectedEpic = $("#filter-epic").val();
    renderStories(searchText, selectedEpic);
});

$("#filter-epic").change(function() {
    const searchText = $("#search-bar").val();
    const selectedEpic = $(this).val();
    renderStories(searchText, selectedEpic);
});

// Export functionality
$("#export-btn").click(function() {
    const dataStr = JSON.stringify({ epics, stories }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'user_stories_export.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
});

// Initialize the appropriate page
$(document).ready(function() {
    if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('/')) {
        loadEpics();
        renderStories();

        // Add Export Button
        const exportButton = `<button class="btn btn-success mt-4" id="export-btn">Export Data</button>`;
        $(".container").append(exportButton);
    } else if (window.location.pathname.endsWith('create_story.html')) {
        loadEpicsIntoForm();
    } else if (window.location.pathname.endsWith('edit_story.html')) {
        const params = new URLSearchParams(window.location.search);
        const storyId = parseInt(params.get('id'));
        const story = stories.find(s => s.id === storyId);

        if (story) {
            $("#story-id").val(story.id);
            $("#story-title").val(story.title);
            $("#story-description").val(story.description);
            loadEpicsIntoForm(story.epic);
        } else {
            alert("Story not found.");
            window.location.href = "dashboard.html";
        }
    } else if (window.location.pathname.endsWith('epics.html')) {
        loadEpicsManagement();
    }
});
