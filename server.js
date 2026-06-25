import express from 'express';
import cors from 'cors';
import { Client } from "@gradio/client";

const app = express();

app.use(cors({
  origin: 'https://marcia-py.github.io'
}));
app.use(express.json({ limit: '10mb' }));

app.post('/tryon', async (req, res) => {
    try {

        console.log("Connecting to IDM-VTON...");

        const client = await Client.connect("yisol/IDM-VTON");

        console.log("Connected!");

        res.json({
            success: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Backend alive');
});
