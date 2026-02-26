import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { s3, ddbDoc } from "./aws.js";

/**
 * Environment variables that Lambda must have at runtime.

 * Validate them early so failures are obvious in logs.
 */

function requireEnv(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
}

const TABLE_NAME = requireEnv("TABLE_NAME");

/**
 * Turn (bucket, key) into a stable, deterministic PK.
 * This is the core of idempotency: same object path => same PK.
 */
export function pkFor(bucket: string, key: string): string {
    return `IMG#${bucket}#${key}`;
}

/**
 * Turn an S3 ETag into a sort key.
 * - If content changes, ETag changes => new SK => you can keep history.
 * - Same upload retried => same ETag => same PK/SK => conditional write prevents dupes.
 */
export function skFor(etag: string): string {
    return `META#${etag}`;
}

export type ImageMetadataItem = {
    PK: string;
    SK: string;
    bucket: string;
    key: string;
    etag: string;
    sizeBytes?: number;
    contentType?: string;
    lastModified?: string;
    eventTime?: string;
};

/**
 * Fetch object metadata from S3 via HeadObject (cheap; does NOT download file contents).
 * Then write a record to DynamoDB with a conditional expression for idempotency.
 */
export async function writeMetadataFromS3Object(params: {
    bucket: string;
    key: string;
    eventTime?: string;
}): Promise<ImageMetadataItem> {
    const { bucket, key, eventTime } = params;

    // 1) Query S3 for object headers/metadata without downloading bytes.
    const head = await s3.send(
        new HeadObjectCommand({
            Bucket: bucket,
            // S3 event keys can be URL-encoded (spaces -> +, etc).
            // We'll decode in the handler before calling this function.
            Key: key
        })
    );

    // ETag often comes with quotes: "\"abc123\""
    // Normalize to raw token.
    const rawEtag = (head.ETag ?? "").replaceAll('"', "");

    if (!rawEtag) {
        // If ETag missing, something is off (permissions, or non-standard response).
        throw new Error(`Missing ETag from HeadObject for s3://${bucket}/${key}`);
    }

    const item: ImageMetadataItem = {
        PK: pkFor(bucket, key),
        SK: skFor(rawEtag),
        bucket,
        key,
        etag: rawEtag,
        sizeBytes: head.ContentLength,
        contentType: head.ContentType,
        lastModified: head.LastModified ? head.LastModified.toISOString() : undefined,
        eventTime
    };

    // 2) Write to DynamoDB.
    // ConditionExpression ensures idempotency:
    // - If the same PK+SK already exists (same key + same etag), this write is rejected.
    await ddbDoc.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
            ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)"
        })
    );

    return item;
}