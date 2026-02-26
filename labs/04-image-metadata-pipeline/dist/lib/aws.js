import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
/**
 * AWS SDK clients created ONCE per Lambda execution environment.
 * - Better performance than recreating per handler invocation.
 * - In Lambda, a single environment can handle many invocations ("warm" starts).
 */
// Region comes from Lambda runtime environment (AWS_REGION) automatically.
// NOT hardcoded here (portable across regions).
export const s3 = new S3Client({});
export const ddb = new DynamoDBClient({});
// Document client makes DynamoDB items feel like normal JS objects:
// - automatically marshals JS <-> DynamoDB AttributeValue types.
export const ddbDoc = DynamoDBDocumentClient.from(ddb);
