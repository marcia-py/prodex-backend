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
        const response = await fetch(
            'https://yisol-idm-vton.hf.space/run/predict',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: [
                        req.body.inputs.person_image,
                        req.body.inputs.cloth_image
                    ]
                })
            }
        );

        const text = await response.text();
console.log(text);
return res.status(500).send(text);

        // The output image is usually here:
        const image = result.data[0];

        // Return base64 or URL directly
        res.json({ image });

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
