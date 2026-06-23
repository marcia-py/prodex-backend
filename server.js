import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'https://marcia-py.github.io'
}));
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
