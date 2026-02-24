02-notes-api/
  src/
    handlers/
      api.js
    lib/
      ddb.js
  infra/
    lambda-trust.json
    lambda-ddb-policy.json
  docs/
    architecture/
      architecture-at-a-glance.png
    screenshots/
      (see Screenshot Index below)
  package.json


## Screenshot Index
All screenshots live in: docs/screenshots/
**01) DynamoDB Table Overview (Table created with PK/SK schema and On-Demand billing mode for serverless scaling)**



**02) Lambda Handler Routing (Single handler reads HTTP method/path and routes requests to the correct CRUD branch)**



**03) Lambda Endpoint Routing (CRUD endpoints implemented in one Lambda with correct status codes and route fallback behavior)**



**04) DynamoDB Persistence Pattern (PK/SK single-table model + conditional writes + Query pattern to avoid scans)**



**05) DynamoDB Client Wrapper (Centralized DynamoDB DocumentClient setup for reuse and safer marshalling behavior)**



**06) Lambda Config Proof - CLI (CLI verification of runtime, handler, role, and environment variables)**



**07) IAM Role Permissions (Execution role includes CloudWatch logging and DynamoDB permissions scoped to the table ARN)**



**08) Lambda Overview (Lambda function deployed and ready to be invoked by API Gateway)**



**09) Lambda Config - Env/Runtime/Handler (Runtime + handler wiring confirmed and TABLE_NAME environment variable set)**



**10) API Gateway Routes - CLI (CLI proof that HTTP routes are created and mapped to the Lambda integration)**



**11) API Gateway Routes (HTTP API routes configured for Notes CRUD endpoints)**



**12) API Gateway Integration (Lambda proxy integration configured using payload format v2.0)**



**13) API Gateway Stage - $default (Auto-deployed default stage used to serve the live API endpoint)**



**14) Create Note - 201 (End-to-end create: API Gateway → Lambda → DynamoDB returns 201 + created note)**



**15) Get Note (Get-by-id returns the persisted item using PK/SK key lookup)**



**16) List Notes (Query-based list returns items without scanning the table)**



**17) Update Note (Update uses conditional expressions to ensure the item exists and returns updated attributes)**



**18) DynamoDB Item Proof (Console proof that the item exists with expected PK/SK and attributes)**



**19) CloudWatch Logs Invocations (Runtime proof of Lambda invocation lifecycle during API requests)**



**20) Delete Note - 204 (Delete endpoint returns 204 No Content on successful delete)**



**21) Get After Delete - 404 (After delete, Get-by-id returns 404 Not Found)**




## Exam cues (DVA-C02)
* **API Gateway (HTTP API)** uses Lambda proxy integration; event shape is HTTP API v2 (requestContext.http.method/path)
* **Lambda invoke permission for API Gateway** is a *resource-based policy* on the Lambda function (lambda add-permission)
* DynamoDB modeling emphasizes:
	* **Query vs Scan**
	* PK/SK access patterns
	* **Conditional expressions** for safe writes
* IAM best practices:
	* Separate **trust policy** (who assumes role) vs **permissions policy** (what the role can do)
	* Scope resources to the table ARN instead of *

⠀
## Cleanup (avoid ongoing costs/clutter)
DynamoDB on-demand and Lambda cost is typically tiny for labs, but cleanup keeps your console tidy.
* Delete API Gateway HTTP API
* Delete Lambda function
* Delete IAM role + inline policy
* Delete DynamoDB table
* (Optional) delete CloudWatch log group: /aws/lambda/lab02-notes-api

⠀
## Next upgrades (optional)
* Add a small frontend (React/Vite) to create a Notes UI (CORS + env var for API URL)
* Add auth (Cognito) as a later “security overlay” lab
* Add structured logging (method/path/noteId) and CloudWatch metrics/alarms
