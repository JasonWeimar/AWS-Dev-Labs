const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const { ddb } = require("../lib/ddb");

const TABLE_NAME = process.env.TABLE_NAME;

function json(statusCode, body) {
    return {
        statusCode,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    };
}

function badRequest(msg) { return json(400, { message: msg }); }
function notFound() { return json(404, { message: "Not found" }); }

module.exports.handler = async (event) => {
    const method = event.requestContext?.http?.method;
    const path = event.requestContext?.http?.path || event.rawPath || "";
    const noteId = event.pathParameters?.noteId;

    // Basic routing: /notes and /notes/{noteId}
    try {
        if (method === "POST" && path === "/notes") {
            const body = event.body ? JSON.parse(event.body) : {};
            const title = (body.title || "").trim();
            const content = (body.content || "").trim();
            if (!title) return badRequest("title is required");

            const id = uuidv4();
            const now = new Date().toISOString();

            const item = {
                PK: "NOTE",
                SK: `NOTE#${id}`,
                noteId: id,
                title,
                content,
                createdAt: now,
                updatedAt: now,
            };

            await ddb.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: item,
                ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
            }));

            return json(201, item);
        }

        if (method === "GET" && path === "/notes") {
            const res = await ddb.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
                ExpressionAttributeValues: { ":pk": "NOTE", ":sk": "NOTE#" },
                ScanIndexForward: false,
            }));
            return json(200, { items: res.Items || [] });
        }

        if (method === "GET" && noteId) {
            const res = await ddb.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
            }));
            if (!res.Item) return notFound();
            return json(200, res.Item);
        }

        if (method === "PUT" && noteId) {
            const body = event.body ? JSON.parse(event.body) : {};
            const title = body.title?.trim();
            const content = body.content?.trim();
            const now = new Date().toISOString();

            // Only update provided fields (keep it simple)
            const sets = [];
            const values = { ":now": now };
            if (title !== undefined) { sets.push("title = :t"); values[":t"] = title; }
            if (content !== undefined) { sets.push("content = :c"); values[":c"] = content; }
            sets.push("updatedAt = :now");

            await ddb.send(new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
                UpdateExpression: `SET ${sets.join(", ")}`,
                ExpressionAttributeValues: values,
                ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
                ReturnValues: "ALL_NEW",
            }).catch((err) => {
                if (err.name === "ConditionalCheckFailedException") return null;
                throw err;
            }));

            // Re-fetch to return the item (simple + readable)
            const res = await ddb.send(new GetCommand({
                TableName: TABLE_NAME,
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
            }));
            if (!res.Item) return notFound();
            return json(200, res.Item);
        }

        if (method === "DELETE" && noteId) {
            await ddb.send(new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { PK: "NOTE", SK: `NOTE#${noteId}` },
                ConditionExpression: "attribute_exists(PK) AND attribute_exists(SK)",
            }).catch((err) => {
                if (err.name === "ConditionalCheckFailedException") return null;
                throw err;
            }));
            return json(204, {});
        }

        return json(404, { message: "Route not found" });
    } catch (err) {
        console.error("Unhandled error:", err);
        return json(500, { message: "Internal Server Error" });
    }
};