# Lab-01 | **README**
#DevAssociateLab
___
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
# Exam cues / gotchas this lab covers
* SQS is at-least-once → duplicates are possible; retries are normal.
* Visibility timeout must be sized to avoid concurrent duplicate processing.
* DLQ redrive policy uses maxReceiveCount + DLQ ARN.
* Without partial batch failures, one poison message can cause whole-batch reprocessing.
* IAM must be scoped (queue ARN) and separated into trust vs permissions.

___
# Interview talking points
* “I used SQS to buffer work and Lambda to auto-scale consumption.”
* “I configured a DLQ so poison messages don’t block throughput.”
* “I enabled partial batch failures so only failed items retry.”
* “IAM is least privilege: SQS actions scoped to the queue ARN + CloudWatch logs.”
* “I validated behavior with CloudWatch logs and DLQ evidence.”

___

Architecture (mental model)

Producer ---> [SQS Source Queue] ---> (Lambda polls in batches) ---> [Lambda Worker]
                        |
                        | after maxReceiveCount failures
                        v
                      [DLQ]
___

## Screenshot Index
All screenshots live in: docs/screenshots/

**1a) SQS DLQ configuration**

![SQS DLQ configuration](docs/screenshots/01a-sqs-dlq-configuration.png)

**1b) SQS redrive policy with DLQ association**

![SQS redrive policy with DLQ association](docs/screenshots/01b-sqs-redrive-policy-with-dlq-association.png)

**2) IAM role permissions**

![IAM role permissions](docs/screenshots/02-iam-role-permissions.png)

**3) IAM inline policy scoped to queue ARN**

![IAM inline policy scoped to queue ARN](docs/screenshots/03-iam-inline-policy-queue-arn.png)

**4) IAM trust policy (Lambda assumes role)**

![IAM trust policy (Lambda assumes role)](docs/screenshots/04-iam-trust-policy.png)

**5) Lambda overview**

![Lambda overview](docs/screenshots/05-lambda-overview.png)

**6) Lambda overview details**

![Lambda overview details](docs/screenshots/06-lambda-overview-details.png)

**7) Lambda runtime + handler configuration**

![Lambda runtime + handler configuration](docs/screenshots/07-lambda-config-runtime-handler.png)

**8a) Lambda execution role permissions for CloudWatch**

![Lambda execution role permissions for CloudWatch](docs/screenshots/08a-lambda-execution-role-cloudwatch.png)

**8b) Lambda execution role permissions for SQS**

![Lambda execution role permissions for SQS](docs/screenshots/08b-lambda-execution-role-sqs.png)

**9) Lambda worker code**

![Lambda worker code](docs/screenshots/09-lambda-code-worker.png)

**10a) Lambda SQS trigger configuration**

![Lambda SQS trigger configuration](docs/screenshots/10a-lambda-sqs-trigger.png)

**10b) CLI event source mapping proof**

![CLI event source mapping proof](docs/screenshots/10b-cli-event-source-mapping.png)

**11) CloudWatch logs showing OK + fail + retry**

![CloudWatch logs showing OK + fail + retry](docs/screenshots/11-cloudwatch-logs-ok-fail-retry.png)

**12) DLQ message body (poison message)**

![DLQ message body (poison message)](docs/screenshots/12-dlq-message-fail-body.png)
