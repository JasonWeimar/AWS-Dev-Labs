# Lab 01 — SQS → Lambda Worker (Retries, DLQ, Partial Batch Failures)

This lab implements a reliable async worker pattern using SQS + Lambda:
- messages are processed in batches
- failures retry safely
- poison messages get isolated into a DLQ
- partial batch failures prevent “good messages” from being reprocessed

If you’re a hiring manager skimming: this repo is designed to prove I can build and validate an event-driven worker the same way it’s done in production (config correctness + IAM least privilege + runtime proof).

---

## What this demonstrates

**Engineering behaviors**
- Asynchronous processing and decoupling (queue buffer)
- Failure isolation (DLQ + maxReceiveCount)
- Correct retry semantics (visibility timeout, redelivery)
- Partial batch failure handling (ReportBatchItemFailures)
- Least privilege IAM (queue ARN scoping)
- Validation via logs + evidence screenshots

**Core AWS services**
- SQS (source queue + DLQ)
- Lambda (worker)
- IAM (trust + permissions)
- CloudWatch Logs (observability)

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
| after repeated failures (maxReceiveCount=3)
v
DLQ (lab01-worker-dlq)


---

## Repo layout

docs/
architecture/
diagram.txt
screenshots/
infra/
lambda-sqs-policy.json
lambda-trust.json
notes.md
src/
handlers/
worker.js
scripts/
send-test-messages.js
lab01-worker.zip
README.md


---

## How to test (quick)

### Send messages (2 good, 1 poison)
```bash
node src/scripts/send-test-messages.js "$QUEUE_URL"
Watch logs
aws logs tail "/aws/lambda/lab01-sqs-worker" --follow
Confirm DLQ received poison message
aws sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
  --output table
Exam cues / gotchas this lab covers
SQS is at-least-once → duplicates are possible; retries are normal.

Visibility timeout must be sized to avoid concurrent duplicate processing.

DLQ redrive policy uses maxReceiveCount + DLQ ARN.

Without partial batch failures, one poison message can cause whole-batch reprocessing.

IAM must be scoped (queue ARN) and separated into trust vs permissions.

Interview talking points
“I used SQS to buffer work and Lambda to auto-scale consumption.”

“I configured a DLQ so poison messages don’t block throughput.”

“I enabled partial batch failures so only failed items retry.”

“IAM is least privilege: SQS actions scoped to the queue ARN + CloudWatch logs.”

“I validated behavior with CloudWatch logs and DLQ evidence.”

Screenshot checklist (store in docs/screenshots/)
Use this exact markdown style:

1) CLI identity baseline

2) SQS source queue + DLQ redrive policy

3) Lambda config + execution role

4) Event source mapping with ReportBatchItemFailures

5) CloudWatch logs showing success + failure

6) DLQ message visible after maxReceiveCount