import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

export async function uploadToR2(buffer, mimeType = "image/png") {

    const filename = `${crypto.randomUUID()}.png`;

    await s3.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: filename,
            Body: buffer,
            ContentType: mimeType,
        })
    );

    return `${process.env.R2_PUBLIC_URL}/${filename}`;
}