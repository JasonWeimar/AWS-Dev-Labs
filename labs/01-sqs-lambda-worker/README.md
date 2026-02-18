Lab 01 — SQS → Lambda Worker (Retries, DLQ, Partial Batch Failures)

A production-style async worker pattern using :contentReference[oaicite:0]{index=0} and :contentReference[oaicite:1]{index=1}. This lab demonstrates reliable message processing, failure isolation with a DLQ, and correct retry behavior using partial batch failure handling.

---

## Why this matters (hiring manager view)

This repo shows I can build and troubleshoot an event-driven backend component the way teams actually ship them:

- **Decouple producers from consumers** with an SQS buffer (resiliency + burst handling)
- **Operate safely under at-least-once delivery** (retries + duplicates are expected)
- **Prevent “one bad message breaks the batch”** using *partial batch response*
- **Use least-privilege permissions** (scoped queue ARN, separate trust vs permission)
- **Validate behavior with evidence**: CloudWatch logs + DLQ proof

---

## Knowledge domains demonstrated

- Event-driven architecture & async processing
- Message queue semantics: visibility timeout, retries, redelivery
- Dead-letter queues (DLQ) + redrive policy (`maxReceiveCount`)
- Partial batch failure handling (`ReportBatchItemFailures`)
- IAM role design: trust policy vs permission policy; least privilege
- Basic operational validation using logs and runtime behavior

---

## Architecture

Producer (CLI / Node script)
|
v
SQS Source Queue (lab01-worker-queue)
|
| (Lambda event source mapping polls in batches)
v
Lambda Worker (lab01-sqs-worker)
|
| on repeated failures (maxReceiveCount=3)
v
DLQ (lab01-worker-dlq)


> Full diagram file: `docs/architecture/diagram.txt`

---

## Services used

- SQS (source queue + DLQ)
- Lambda (worker)
- :contentReference[oaicite:2]{index=2} (execution role + inline policy)
- :contentReference[oaicite:3]{index=3} (logs)

---

## Key behavior

### Success path
- Messages are polled from SQS in batches and delivered to the Lambda handler as `event.Records[]`.
- On success, messages are deleted from the queue automatically by the integration.

### Failure path + retries
- A “poison message” (contains `FAIL`) throws an error in the worker.
- The message is retried after the visibility timeout.
- After `maxReceiveCount = 3`, the message moves to the DLQ.

### Partial batch failure (important!)
This integration is configured with **Report batch item failures** so the worker can return:

```json
{ "batchItemFailures": [{ "itemIdentifier": "<messageId>" }] }
Only failed messages are retried; successful messages in the batch are not reprocessed.

Repo layout
docs/
  architecture/
    diagram.txt
  screenshots/
infra/
  lambda-trust.json
  lambda-sqs-policy.json
  notes.md
src/
  handlers/
    worker.js
  scripts/
    send-test-messages.js
lab01-worker.zip
README.md
Prereqs
AWS Command Line Interface configured (lab-dev profile recommended)

Node.js installed for the test sender script

Access to create: SQS queues, IAM role/policies, Lambda function, event source mapping

How to run the test (interviewer-style)
1) Send messages (two good, one poison)
Use the included script:

node src/scripts/send-test-messages.js "$QUEUE_URL"
Or CLI equivalent:

aws sqs send-message --queue-url "$QUEUE_URL" --message-body "hello-1"
aws sqs send-message --queue-url "$QUEUE_URL" --message-body "hello-2"
aws sqs send-message --queue-url "$QUEUE_URL" --message-body "FAIL-please-retry-me"
2) Observe logs (success + retries)
Tail logs:

aws logs tail "/aws/lambda/lab01-sqs-worker" --follow
3) Confirm DLQ receives the poison message
aws sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
  --output table
DVA-C02 exam cues (the “gotchas” this lab covers)
SQS is at-least-once delivery → duplicates can happen; design accordingly.

Visibility timeout must be sized to avoid duplicate concurrent processing.

DLQ redrive policy uses maxReceiveCount and DLQ ARN.

Batch processing without partial failure can cause whole-batch retries.

IAM: Lambda execution role needs SQS actions scoped to the queue ARN + logs permissions.

Interview talking points (use these verbatim)
“I used SQS to buffer work and Lambda to auto-scale consumption, keeping the producer decoupled.”

“I configured a DLQ so poison messages don’t block throughput, and I can inspect failures safely.”

“I enabled partial batch failure so only failed messages retry — this reduces cost and avoids reprocessing successes.”

“My IAM policy is least-privilege: SQS access scoped to a specific queue ARN plus CloudWatch logs.”

“I validated behavior with CloudWatch logs and DLQ message evidence.”

Screenshots (proof)
All screenshots live in: docs/screenshots/

1) SQS DLQ configuration

2) SQS redrive policy with DLQ association (maxReceiveCount)

3) IAM role permissions overview (managed + inline)

4) Inline policy scoped to queue ARN

5) IAM trust policy (Lambda assumes role)

6) Lambda function overview

7) Lambda overview details

8) Lambda runtime + handler configuration

9) Lambda execution role permissions for CloudWatch logs

10) Lambda execution role permissions for SQS

11) Lambda worker code

12) Lambda SQS trigger configuration

13) CLI proof of event source mapping + partial batch failures

14) CloudWatch logs showing OK + fail + retry

15) DLQ message body showing poison message