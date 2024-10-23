// app.js

// Event listener for the "Extract User Stories" button
document.getElementById('processButton').addEventListener('click', () => {
    const documentText = document.getElementById('documentInput').value;
    if (documentText.trim() === '') {
        alert('Please enter a historical document.');
        return;
    }

    extractUserStories(documentText);
});

// Function to extract user stories from the historical text
async function extractUserStories(documentText) {
    // Display a loading message or spinner if desired
    document.getElementById('userStoriesOutput').innerText = 'Processing...';

    // Split the document into chunks if it's too long
    const maxChunkSize = 2000; // Adjust based on the API's token limit
    const chunks = splitTextIntoChunks(documentText, maxChunkSize);
    let allUserStories = '';

    for (const chunk of chunks) {
        const prompt = `
You are an expert at extracting user requirements from texts.
Analyze the following historical text and extract user stories.
For each requirement or need you identify, create a user story in the format:
"As a [user], I want to [action] so that [benefit]."
Focus on actual user needs and requirements, not historical context.

Historical Text:
"""${chunk}"""
`;
        // Call the server API to process the chunk
        const response = await callOpenAIAPI(prompt);
        if (response) {
            allUserStories += response + '\n';
        } else {
            allUserStories += 'An error occurred while processing a chunk.\n';
        }
    }

    // Display the extracted user stories
    document.getElementById('userStoriesOutput').innerText = allUserStories;
}

// Function to call the server API
async function callOpenAIAPI(prompt) {
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: prompt }),
        });

        const result = await response.json();

        if (result.text) {
            return result.text.trim();
        } else {
            console.error('No text found in the server response.', result);
            return null;
        }
    } catch (error) {
        console.error('Error calling server API:', error);
        return null;
    }
}

// Function to split text into smaller chunks
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
