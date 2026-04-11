import express from 'express';
import fetch from 'node-fetch';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/tryon', async (req, res) => {
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/yisol/IDM-VTON', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        const buffer = await response.arrayBuffer();
        res.set('Content-Type', 'image/png');
        res.send(Buffer.from(buffer));

    } catch (error) {
        console.error(error);
        res.status(500).send("Error processing the image.");
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));