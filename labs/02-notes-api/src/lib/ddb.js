// src/lib/ddb.js

// Import the low-level DynamoDB client (talks to the DynamoDB API).
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

// Import the DocumentClient wrapper (lets you use normal JS objects instead of AttributeValue maps).
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

// Create the base DynamoDB client.
// With `{}` it uses the default AWS SDK credential/provider chain:
// - Lambda: execution role credentials
// - Local: AWS_PROFILE / env vars / config files
const client = new DynamoDBClient({});

// Wrap the low-level client with a DocumentClient.
// DocumentClient automatically marshals JS objects <-> DynamoDB AttributeValue format.
const ddb = DynamoDBDocumentClient.from(client, {

    // marshallOptions affect JS -> DynamoDB conversion
    marshallOptions: {
        // Removes keys with `undefined` values instead of throwing an error.
        // This is helpful when you build items/updates from optional fields.
        removeUndefinedValues: true,
    },

    // (Optional) You could also set unmarshallOptions here for DynamoDB -> JS conversion.
});

// Export the configured DocumentClient so all handlers share the same instance.
// Sharing the client is a best practice (connection reuse across invocations).
module.exports = { ddb };