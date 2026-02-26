import type { S3Event } from "aws-lambda";
import { writeMetadataFromS3Object } from "../lib/metadata.js";

/**
 * S3 can batch multiple object-created records into one invocation.
 * We must loop over Records and process each.
 */
export const handler = async (event: S3Event): Promise<void> => {
    console.log("Received S3 event records:", event.Records.length);

    for (const record of event.Records) {
        // Pull bucket + key from the event record.
        const bucket = record.s3.bucket.name;

        // Keys are URL-encoded in events; decode to actual key string.
        // Replace '+' with space first (common encoding in S3 notifications).
        const encodedKey = record.s3.object.key;
        const key = decodeURIComponent(encodedKey.replaceAll("+", " "));

        const eventTime = record.eventTime;

        console.log("Processing object:", { bucket, key, eventTime });

        try {
            const item = await writeMetadataFromS3Object({ bucket, key, eventTime });
            console.log("Wrote DynamoDB item:", item.PK, item.SK);
        } catch (err: any) {
            /**
             * IMPORTANT: For async S3 triggers, throwing causes retries.
             * We *want* retries for transient failures, but we must be idempotent.
             */
            console.error("Failed processing record:", { bucket, key, err: err?.message ?? err });
            throw err; // cause retry (safe due to conditional write)
        }
    }
};