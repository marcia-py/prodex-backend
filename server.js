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
        console.log("Starting try-on...");

        const client = await Client.connect("yisol/IDM-VTON");

        const result = await client.predict("/tryon", {
            dict: {
                background: req.body.inputs.person_image,
                layers: [],
                composite: null
            },
            garm_img: req.body.inputs.cloth_image,
            garment_des: "shirt",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 30,
            seed: 42
        });

        console.log("Result received:", result);

        // IMPORTANT: Space returns array of outputs
        const outputImage = result.data[0];

        res.json({
            image: outputImage
        });

    } catch (error) {
        console.error("ERROR:", error);
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
