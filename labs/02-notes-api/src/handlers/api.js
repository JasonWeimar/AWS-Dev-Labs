// src/handlers/api.js

// Import DynamoDB DocumentClient commands (high-level wrapper over DynamoDB)
// These map to the core CRUD operations you’ll perform on the table.
const {
    PutCommand,   // Create/insert an item
    GetCommand,   // Read a single item by primary key
    QueryCommand, // Read multiple items by partition key (and sort-key conditions)
    UpdateCommand,// Update attributes on an item
    DeleteCommand // Delete an item
} = require("@aws-sdk/lib-dynamodb");

// Import UUID generator so each new note gets a unique ID.
const { randomUUID } = require("crypto");

// Import pre-configured DynamoDB DocumentClient instance.
const { ddb } = require("../lib/ddb");

// Read the table name from the Lambda environment variables.
// (set this during `create-function` / `update-function-configuration`.)
const TABLE_NAME = process.env.TABLE_NAME;

// Helper: build a proper API Gateway/Lambda proxy response.
// API Gateway expects `statusCode`, `headers`, and a string `body`.
function json(statusCode, body) {
    return {
        statusCode, // HTTP status code to return to the client
        headers: { "content-type": "application/json" }, // declare JSON response
        body: JSON.stringify(body), // body MUST be a string in proxy integration
    };
}

// Helper: standardized 400 response.
// Keeps handler logic cleaner (don’t repeat response formatting).
function badRequest(msg) { return json(400, { message: msg }); }

// Helper: standardized 404 response.
function notFound() { return json(404, { message: "Not found" }); }

// Lambda handler entry point.
// API Gateway (HTTP API) invokes this and passes the request as `event`.
module.exports.handler = async (event) => {

    // Extract the HTTP method from the HTTP API v2 event shape.
    // Optional chaining avoids crashing if requestContext/http is missing.
    const method = event.requestContext?.http?.method;

    // Extract the request path.
    // `requestContext.http.path` is typical for HTTP API v2,
    // but `rawPath` is a good fallback.
    const path = event.requestContext?.http?.path || event.rawPath || "";

    // Extract the {noteId} path parameter if present (for routes like /notes/{noteId}).
    const noteId = event.pathParameters?.noteId;

    // Implement basic routing in-code:
    // - /notes
    // - /notes/{noteId}
    // This keeps the lab lean (one Lambda handles all endpoints).
    try {

        // -----------------------------
        // POST /notes  => Create a note
        // -----------------------------
        if (method === "POST" && path === "/notes") {

            // Parse JSON body if it exists; otherwise use an empty object.
            // NOTE: JSON.parse can throw if invalid JSON (you later added safe parsing).
            const body = event.body ? JSON.parse(event.body) : {};

            // Normalize inputs: default to empty string then trim whitespace.
            const title = (body.title || "").trim();
            const content = (body.content || "").trim();

            // Validate: title is required. If missing, respond 400.
            if (!title) return badRequest("title is required");

            // Generate a unique note id.
            const id = randomUUID();

            // Capture a timestamp so items have audit fields.
            const now = new Date().toISOString();

            // Build the DynamoDB item.
            // PK/SK form a single-table pattern:
            // - PK: groups items (here, all notes)
            // - SK: uniquely identifies each note and enables prefix queries
            const item = {
                PK: "NOTE",           // Partition key: all notes live under PK = "NOTE"
                SK: `NOTE#${id}`,     // Sort key: prefix + id (easy begins_with queries)
                noteId: id,           // Convenience attribute for clients
                title,                // Note title
                content,              // Note body/content
                createdAt: now,       // When created
                updatedAt: now,       // When last updated (same at create)
            };

            // Write the item to DynamoDB.
            // ConditionExpression prevents accidental overwrite if PK/SK already exists.
            await ddb.send(new PutCommand({
                TableName: TABLE_NAME, // target table
                Item: item,            // item to insert
                ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            }));

            // Return 201 Created + the created item.
            return json(201, item);
        }

        // -----------------------------
        // GET /notes => List notes
        // -----------------------------
        if (method === "GET" && path === "/notes") {

            // Query all items under PK="NOTE" with SK prefix "NOTE#".
            // Query is efficient because it uses the partition key.
            const res = await ddb.send(new QueryCommand({
                TableName: TABLE_NAME, // target table
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": "NOTE",  // partition key value
                    ":sk": "NOTE#"  // sort key prefix
                },
                ScanIndexForward: false, // false => descending order by SK (not super meaningful with UUIDs)
            }));

            // Return items (or empty list).
            return json(200, { items: res.Items || [] });
        }

        // -----------------------------
        // GET /notes/{noteId} => Get one note
        // -----------------------------
        if (method === "GET" && noteId) {

            // Get a single item by full primary key (PK + SK).
            const res = await ddb.send(new GetCommand({
                TableName: TABLE_NAME,                     // target table
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },  // exact key
            }));

            // If no item exists, return 404.
            if (!res.Item) return notFound();

            // Return the item.
            return json(200, res.Item);
        }

        // -----------------------------
        // PUT /notes/{noteId} => Update a note
        // -----------------------------
        if (method === "PUT" && noteId) {

            // Parse request JSON body.
            const body = event.body ? JSON.parse(event.body) : {};

            // Read optional fields and trim if present.
            const title = body.title?.trim();
            const content = body.content?.trim();

            // Update timestamp.
            const now = new Date().toISOString();

            // Build a dynamic UpdateExpression so we only update provided fields.
            // This avoids overwriting fields with undefined.
            const sets = [];             // holds "field = :value" fragments
            const values = { ":now": now }; // holds expression attribute values

            // If title was provided, add it to the update.
            if (title !== undefined) {
                sets.push("title = :t");
                values[":t"] = title;
            }

            // If content was provided, add it to the update.
            if (content !== undefined) {
                sets.push("content = :c");
                values[":c"] = content;
            }

            // Always update updatedAt timestamp.
            sets.push("updatedAt = :now");

            // Execute UpdateItem.
            // ConditionExpression ensures the item exists (otherwise treat as 404).
            try {
                const updated = await ddb.send(new UpdateCommand({
                    TableName: TABLE_NAME,
                    Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
                    UpdateExpression: `SET ${sets.join(", ")}`,
                    ExpressionAttributeValues: values,
                    ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
                    ReturnValues: "ALL_NEW",
                }));
                return json(200, updated.Attributes);
            } catch (err) {
                if (err.name === "ConditionalCheckFailedException") return notFound();
                throw err;
            }

            // Re-fetch the item to return it.
            // (Slightly redundant because UpdateCommand returns ALL_NEW, but this keeps it straightforward.)
            const res = await ddb.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
            }));

            // If still missing, return 404.
            if (!res.Item) return notFound();

            // Return updated item.
            return json(200, res.Item);
        }

        // -----------------------------
        // DELETE /notes/{noteId} => Delete a note
        // -----------------------------
        if (method === "DELETE" && noteId) {
            try {
                await ddb.send(new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
                    ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
                }));

                return { statusCode: 204, headers: { "content-type": "application/json" }, body: "" };
            } catch (err) {
                if (err.name === "ConditionalCheckFailedException") return notFound();
                throw err;
            }
        }

        // If none of the routes matched, return a 404 route-not-found.
        return json(404, { message: "Route not found" });

    } catch (err) {
        // Log the raw error so CloudWatch contains the stack/context.
        console.error("Unhandled error:", err);

        // Return generic 500 to clients (don’t leak internal details).
        return json(500, { message: "Internal Server Error" });
    }
};