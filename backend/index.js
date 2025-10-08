require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

app.post('/api/gemini', async (req, res) => {
    try {
        const { model, contents, config } = req.body;

        if (!model || !contents || !config) {
            return res.status(400).json({ error: 'Missing required parameters: model, contents, config' });
        }

        const response = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        res.json(response);
    } catch (error) {
        console.error('Error proxying to Gemini:', error);
        res.status(500).json({ error: 'Failed to proxy request to Gemini API' });
    }
});

app.listen(port, () => {
    console.log(`Backend proxy server listening at http://localhost:${port}`);
});
