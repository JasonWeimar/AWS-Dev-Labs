"use strict";

/**
 * This Lambda is invoked by SQS via an event source mapping.
 * SQS messages come in batches: event.Records is an array.
 *
 * Key DVA concept:
 *   Partial batch response: return batchItemFailures
 *   so ONLY failed messages are retried.
 */
exports.handler = async (event) => {
    // Lambda will retry ONLY the messages whose IDs we put here,
    // as long as ReportBatchItemFailures is enabled on the mapping.
    const failures = [];

    // Loop through each SQS message in the batch.
    for (const record of event.Records ?? []) {
        // messageId uniquely identifies the SQS message in this batch.
        const messageId = record.messageId;

        // body is the message payload (string).
        const body = record.body ?? "";

        // ApproximateReceiveCount tells you how many times this message
        // has been received from the queue (useful for debugging retries).
        const receiveCount = Number(record.attributes?.ApproximateReceiveCount ?? "1");

        try {
            // Log structured info so CloudWatch Logs is actually useful.
            console.log("Processing message:", {
                messageId,
                receiveCount,
                bodyPreview: body.slice(0, 200),
            });

            // Simulate a poison message:
            // any message containing "FAIL" will always fail.
            // This is how we demonstrate retries + DLQ.
            if (body.includes("FAIL")) {
                throw new Error("Simulated processing failure (poison message)");
            }

            // Simulate real work (e.g., calling an API, writing to DB, etc.)
            // This small delay is enough to show log flow.
            await new Promise((r) => setTimeout(r, 200));

            // If we reach here, the message is "successfully processed".
            // Lambda will delete it from SQS automatically after success.
            console.log("Processed OK:", { messageId });
        } catch (err) {
            // If we throw without partial batch response,
            // the entire batch can be retried.
            // Instead, we record ONLY this message as failed.
            console.error("Processed FAILED:", {
                messageId,
                receiveCount,
                errorMessage: err?.message ?? String(err),
            });

            failures.push({ itemIdentifier: messageId });
        }
    }

    // This is the partial batch response format.
    // Lambda uses it to know which messages to retry.
    return { batchItemFailures: failures };
};