import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

import { uploadToR2 } from "./uploadToR2.js";

dotenv.config();

const app = express();

app.use(cors({
    origin: "https://marcia-py.github.io"
}));

app.use(express.json({
    limit: "25mb"
}));

app.get("/", (req, res) => {
    res.send("Backend alive");
});

app.post("/tryon", async (req, res) => {

    try {

        console.log("=================================");
        console.log("New Try-On Request");
        console.log("=================================");

        const { person_image, cloth_image, type } = req.body.inputs;

        if (!person_image || !cloth_image) {
            return res.status(400).json({
                error: "Missing images."
            });
        }

        console.log("Converting images...");

        const personBuffer = Buffer.from(person_image, "base64");
        const clothBuffer = Buffer.from(cloth_image, "base64");

        console.log("Uploading person image...");
        const personUrl = await uploadToR2(personBuffer);

        console.log("Uploading garment image...");
        const garmentUrl = await uploadToR2(clothBuffer);

        console.log("Images uploaded.");

        console.log("Calling RunPod...");

        const response = await axios.post(

            `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/runsync`,

            {
                input: {
                    person_url: personUrl,
                    garment_url: garmentUrl,
                    category: type === "auto" ? "top" : type
                }
            },

            {
                headers: {
                    Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 600000
            }

        );

        console.log("RunPod Response:");
        console.log(response.data);

        if (
            !response.data.output ||
            !response.data.output.success
        ) {

            throw new Error("RunPod returned an invalid response.");

        }

        res.json({
            image: response.data.output.image_url
        });

    }

    catch (error) {

        console.error("=================================");
        console.error("BACKEND ERROR");
        console.error("=================================");

        if (error.response) {

            console.error(error.response.data);

        } else {

            console.error(error.message);

        }

        res.status(500).json({
            error: "Virtual try-on failed."
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

});
