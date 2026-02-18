"use strict";

/**
 * Sends a few test messages to the source queue.
 * Use this to create: success messages + a poison message.
 *
 * Run:
 *   AWS_PROFILE=dva AWS_REGION=us-west-2 node src/scripts/send-test-messages.js <QUEUE_URL>
 */

const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

async function main() {
    const queueUrl = process.argv[2];
    if (!queueUrl) {
        console.error("Usage: node send-test-messages.js <QUEUE_URL>");
        process.exit(1);
    }

    // Client uses AWS_PROFILE/AWS_REGION environment or default chain.
    const sqs = new SQSClient({});

    const messages = ["hello-1", "hello-2", "FAIL-please-retry-me"];

    for (const body of messages) {
        const res = await sqs.send(
            new SendMessageCommand({
                QueueUrl: queueUrl,
                MessageBody: body,
            })
        );

        console.log("Sent:", { body, messageId: res.MessageId });
    }
}

main().catch((err) => {
    console.error("send-test-messages failed:", err);
    process.exit(1);
});
