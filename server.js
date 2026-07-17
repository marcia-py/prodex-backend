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

// Função auxiliar para esperar X milissegundos (usada no polling)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

        console.log("Calling RunPod (Initiating job)...");

        // Alterado de /runsync para /run para evitar timeouts imediatos do RunPod
        const runResponse = await axios.post(
            `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/run`,
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
                }
            }
        );

        const jobId = runResponse.data.id;
        let jobStatus = runResponse.data.status;

        console.log(`Job iniciado no RunPod. ID: ${jobId}. Status inicial: ${jobStatus}`);

        let runpodResult = null;
        const MAX_ATTEMPTS = 60; // Limite de tentativas (60 * 4 segundos = 240 segundos / 4 minutos)
        let attempts = 0;

        // Loop de Polling: Continua a perguntar enquanto estiver na fila ou em progresso
        while ((jobStatus === 'IN_QUEUE' || jobStatus === 'IN_PROGRESS') && attempts < MAX_ATTEMPTS) {
            console.log(`[Tentativa ${attempts + 1}/${MAX_ATTEMPTS}] Status atual: ${jobStatus}. Aguardando 4 segundos...`);
            await delay(4000); // Aguarda 4 segundos antes da próxima verificação

            const statusResponse = await axios.get(
                `https://api.runpod.ai/v2/${process.env.RUNPOD_ENDPOINT_ID}/status/${jobId}`,
                {
                    headers: { 
                        Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` 
                    }
                }
            );

            jobStatus = statusResponse.data.status;

            if (jobStatus === 'COMPLETED') {
                runpodResult = statusResponse.data.output;
                console.log("RunPod completou o processamento com sucesso!");
                break;
            }

            if (jobStatus === 'FAILED' || jobStatus === 'CANCELLED') {
                console.error("Erro reportado pelo RunPod:", statusResponse.data);
                throw new Error(`O RunPod falhou com o status: ${jobStatus}`);
            }

            attempts++;
        }

        console.log("RunPod Final Output Data:", runpodResult);

        // Validação do formato de resposta do seu fashn-vton-1.5 no RunPod
        if (!runpodResult || !runpodResult.success || !runpodResult.image_url) {
            throw new Error("RunPod terminou mas retornou um formato de resposta inválido ou sem sucesso.");
        }

        // Devolve o resultado esperado pelo seu frontend
        res.json({
            image: runpodResult.image_url
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

// Configuração do servidor express para aguentar conexões longas no Render
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

server.timeout = 300000; // Define o timeout do servidor para 5 minutos (evita quedas no Render)
