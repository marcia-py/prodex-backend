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

        const personBase64 = req.body.inputs.person_image;
        const clothBase64 = req.body.inputs.cloth_image;

        const personBuffer = Buffer.from(personBase64, "base64");
        const clothBuffer = Buffer.from(clothBase64, "base64");

        const result = await client.predict("/tryon", {
            dict: {
                background: personBuffer,
                layers: [],
                composite: null
            },
            garm_img: clothBuffer,
            garment_des: "shirt",
            is_checked: true,
            is_checked_crop: false,
            denoise_steps: 40,
            seed: 42
        });

        console.log("SUCCESS:", result);

        res.json({
            image: result.data[0].url
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
    res.send("Backend alive");
});
