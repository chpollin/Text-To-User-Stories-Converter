// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/extract', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // Updated API call to use chat/completions
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",  // Using GPT-3.5-turbo as the base model
                messages: [
                    {
                        role: "system",
                        content: "You are an expert at extracting user requirements from historical texts and converting them into user stories."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500,
                response_format: { type: "text" }  // Explicitly requesting text format
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenAI API Error:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        // Updated to correctly access the response from chat completion
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unexpected API response:', data);
            return res.status(500).json({ error: 'No response from OpenAI' });
        }

        // Extract the content from the message
        res.json({ text: data.choices[0].message.content });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});