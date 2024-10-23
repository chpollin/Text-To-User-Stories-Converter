// server.js (Optional - Not needed for GitHub Pages)

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

app.post('/api/extract', async (req, res) => {
    try {
        const { prompt } = req.body;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Sie sind ein Experte darin, Benutzeranforderungen aus historischen Texten zu extrahieren und in User Stories zu verwandeln."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('OpenAI API Fehler:', data.error);
            return res.status(500).json({ error: data.error.message });
        }

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('Unerwartete API-Antwort:', data);
            return res.status(500).json({ error: 'Keine Antwort von OpenAI' });
        }

        res.json({ text: data.choices[0].message.content });

    } catch (error) {
        console.error('Serverfehler:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
