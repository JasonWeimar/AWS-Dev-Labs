# AWS-Dev-Labs — Evidence-First DVA-C02 Lab Dojo

I’m a cloud-focused builder with an enterprise IT foundation and a front-end lean. This repo is my evidence-first AWS lab series: each lab is designed to be **easy to verify** (clear commands, clean infra, predictable behavior) and **easy to discuss** in interviews (why it exists, what it proves, what tradeoffs were made).

---

## What this repo is (and how to use it)

**If you’re a recruiter:** start with the **Lab Index** and open any README. Each lab has a short “translation layer” explaining what it built and why it matters.

**If you’re a hiring manager:** open Labs **03–05** first (deployed hosting + event-driven pipeline + orchestration). These are closest to real-world patterns.

**If you’re an engineer:** jump to the **Proof** sections inside each lab README. You’ll see the exact CLI calls, logs, and screenshots used to verify behavior.

---

## Lab Index

| Lab | What it builds | What it proves | Artifacts |
|---|---|---|---|
| **Lab 00 — IAM + SDK Sanity** | Local tooling + identity baseline (CLI + SDK) | credential source hygiene, profile/region discipline, least-surprise verification | [README](labs/00-iam-sdk-sanity/README.md) \| [Screenshots](labs/00-iam-sdk-sanity/docs/screenshots/) |
| **Lab 01 — SQS + Lambda Worker** | Queue-driven async worker | at-least-once delivery, retries, DLQ pattern awareness, idempotency mindset, CloudWatch verification | [README](labs/01-sqs-lambda-worker/README.md) \| [Screenshots](labs/01-sqs-lambda-worker/docs/screenshots/) |
| **Lab 02 — Notes API** | Serverless CRUD API (API GW + Lambda + DynamoDB) | API design, DynamoDB modeling, conditional writes, IAM scoping, observability proof | [README](labs/02-notes-api/README.md) \| [Screenshots](labs/02-notes-api/docs/screenshots/) |
| **Lab 03 — Portfolio Shell** | Static hosting (S3 + CloudFront + Route 53) | CDN caching/invalidation, DNS/TLS wiring, deployment discipline, live hosting proof | [README](labs/03-portfolio-shell/README.md) \| [Screenshots](labs/03-portfolio-shell/docs/screenshots/) |
| **Lab 04 — Image Metadata Pipeline** | S3 → Lambda → DynamoDB ingestion pipeline | event triggers, retries, idempotency, failure modes, structured logs, least-privilege IAM | [README](labs/04-image-metadata-pipeline/README.md) \| [Architecture](labs/04-image-metadata-pipeline/docs/architecture/) \| [Screenshots](labs/04-image-metadata-pipeline/docs/screenshots/) |
| **Lab 05 — Step Functions Orchestration** | Orchestrated workflow with Retry + Catch paths | state machines, error handling, output shaping, execution proof, role binding | [README](labs/05-step-functions-orchestration/README.md) \| [Screenshots](labs/05-step-functions-orchestration/docs/screenshots/) |

---

## Verification Pattern (Evidence-First)

Each lab is designed to be verifiable without “trust me bro” energy:

- **CLI proof**: `aws ...` commands to create/inspect resources and validate expected state
- **Console proof**: screenshots capturing key configuration + success/failure states
- **Logs proof**: CloudWatch logs that show execution paths and error handling
- **Deterministic tests** (when relevant): repeatable inputs/outputs to prove idempotency, retries, and failure behavior

---

## Interview Talking Points (Global)

The recurring themes across these labs:

- **IAM scoping**: least privilege, resource policies vs identity policies, and permission boundaries awareness
- **Idempotency + retries**: designing for at-least-once delivery and safe reprocessing
- **Event-driven patterns**: S3 events, queue workers, orchestration, and failure handling
- **Observability**: CloudWatch logs, structured context, and “prove it works” screenshots
- **Deployment mindset**: predictable build/deploy steps and consistent repo layout

---

## Repo conventions

- Screenshots live in each lab at: `docs/screenshots/`
- Diagrams live in each lab at: `docs/diagram.*` (image or markdown)
- READMEs include a short hiring-manager translation plus proof artifacts
