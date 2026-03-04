# Lab-05 | **README**
#DevAssociateLab
___
# **Lab 05 — Step Functions Orchestration Mini (Lambda + ASL + Retry/Catch)**

## **Overview**

This lab builds a **production-shaped orchestration workflow** using **AWS Step Functions (Standard)** to coordinate **TypeScript-authored Lambdas**. The workflow validates input, performs deterministic “work,” and demonstrates **Retry + exponential backoff** for transient failures with a **Catch** path that routes to a compensating handler returning a stable `FAILED` result. Evidence is captured via **CLI + Step Functions execution graphs + execution history**.
___
## **Architecture**

**Flow:** Start → **ValidateInput** (Lambda) → **ProcessItem** (Lambda w/ Retry) → **Success**
**Failure Flow:** ProcessItem fails → Retry attempts → Catch → **RecordFailure** (Lambda) → FailureComplete (Succeed)

*(ASL source of truth lives in `infra/state-machine/lab05.asl.json`.)*

___
## **Services used**

* **AWS Step Functions (Standard)** — orchestration + Retry/Catch + execution history

* **AWS Lambda** — compute tasks (Node.js 20 runtime, **TypeScript → dist/** build artifact)

* **AWS IAM** — execution roles + least-privilege permissions (SFN invokes only these Lambdas)

* **Amazon CloudWatch Logs** — Lambda runtime logs (debugging / optional evidence)
___
## **What this demonstrates**

### Engineering behaviors

* Orchestration patterns (workflow coordination vs. single function logic)

* **Transient failure handling** with **Retry + exponential backoff**

* **Catch routing** to compensating handler (failure becomes stable output)

* Intentional **data shaping** using Step Functions JSONPath (`Payload.$`, `OutputPath`, `ResultPath`)

* Least-privilege IAM (Step Functions role can invoke **only** your lab Lambdas)

* Evidence-first validation (graphs + outputs + execution history)


### Core AWS concepts (DVA-C02 aligned)

* Step Functions state machine definition (ASL) and task integrations

* Lambda invoke integration wrapper (`$.Payload`) and OutputPath stripping

* Named errors (e.g., `TransientError`) for predictable Retry/Catch matching

* IAM trust vs permission policies; “who can assume” vs “what can it do”


## State machine behavior (ASL highlights)

* **Task integration:** `arn:aws:states:::lambda:invoke`

* **Input passing:** `"Payload.$": "$"` (pass current state input into Lambda)

* **Output shaping:** `"OutputPath": "$.Payload"` (strip Lambda wrapper metadata)

* **Retry:** retries on `TransientError` plus common Lambda transient errors

* **Catch:** captures error into `$.caught` and routes to `RecordFailure`

___
## **Repo structure**

![Repo Structure](./docs/screenshots/repo-structure.png)
___

## **Build + deploy (CLI-first pattern)**

### Build (TypeScript → dist/)

```
npm run clean
npm run build
```

### Package (zip from dist/)

**Why:** The Lambda handler strings expect `handlers/*.js` at the zip root (so zip from inside `dist/`).

```
cd dist
zip -r ../lambda.zip .
cd ..
```

### Create/update Lambdas (example)

```
aws lambda create-function ... # first time
aws lambda update-function-code ... # updates
```

### Create/update Step Functions state machine

```
aws stepfunctions create-state-machine ... # first time
aws stepfunctions update-state-machine ... # updates
```

___

## Screenshot Index

All screenshots live in: `docs/screenshots/`

## **01) CLI identity baseline (profile + caller identity)**

![CLI GetCallerIdentity](./docs/screenshots/01-cli-getcalleridentity.png)


## **02) Lambda execution role trust relationship (lambda.amazonaws.com can assume role)**

![Lambda Role Trust](./docs/screenshots/02-lambda-execution-role-trust-relationship.png)


## **03) Lambda execution role permissions attached (basic logging permissions)**

![Lambda Role Permissions](./docs/screenshots/03-lambda-execution-role-permissions-attached.png)


## **04) Step Functions execution role trust relationship (states.amazonaws.com can assume role)**

![SFN Role Trust](./docs/screenshots/04-step-functions-execution-role-trust-relationship.png)


## **05) Step Functions invoke policy JSON (InvokeFunction scoped to lab Lambdas)**

![SFN Invoke Policy JSON](./docs/screenshots/05-step-functions-invoke-policy-json.png)


## **06) Step Functions role permissions attached (invoke policy attached to SFN role)**

![SFN Role Permissions](./docs/screenshots/06-step-functions-role-permissions-attached.png)


## **07) Lambda functions list (3 lab functions exist)**

![Lambda Functions List](./docs/screenshots/07-lambda-functions-list.png)


## **08) ValidateInput runtime + handler (entrypoint proof)**

![ValidateInput Runtime](./docs/screenshots/08-validateinput-handler-runtime.png)


## **08b) ValidateInput execution role (role attached to function)**

![ValidateInput Role](./docs/screenshots/08b-validateinput-handler-role.png)


## **09) ProcessItem runtime + handler (entrypoint proof)**

![ProcessItem Runtime](./docs/screenshots/09-processitem-handler-runtime.png)


## **09b) ProcessItem execution role (role attached to function)**

![ProcessItem Role](./docs/screenshots/09b-processitem-handler-role.png)


## **10) CLI invoke ProcessItem OK (happy-path behavior)**

![CLI Invoke Process OK](./docs/screenshots/10-cli-invoke-process-ok.png)


## **10b) CLI invoke ProcessItem forced failure (TransientError for Retry/Catch proof)**

![CLI Invoke Process Fail TransientError](./docs/screenshots/10b-cli-invoke-process-fail-transienterror.png)


## **11) State machine graph (Validate → Process + Catch → RecordFailure)**

![SFN State Machine Graph](./docs/screenshots/11-sfn-state-machine-graph.png)


## **12) State machine role binding proof (SFN execution role attached)**

![SFN Role Binding Proof](./docs/screenshots/12-sfn-role-binding-proof.png)


## **13) Fail execution graph (Retry + Catch path visual proof)**

![SFN Fail Exec Graph Retry Catch](./docs/screenshots/13-sfn-exec-fail-graph-retry-catch.png)


## **14) CLI execution history proof (TaskFailed TransientError repeated = retries + final failure)**

![CLI Exec History TaskFailed TransientError](./docs/screenshots/14-cli-exec-history-taskfailed-transienterror.png)


## **15) OK execution graph (end-to-end success path proof)**

![SFN OK Exec Graph](./docs/screenshots/15-sfn-exec-ok-graph.png)


## **16) Fail execution output (execution SUCCEEDED with stable FAILED result)**

![SFN Fail Exec Output](./docs/screenshots/16-sfn-exec-fail-output.png)


___

## **Exam cues (DVA-C02)**

* **Retry mechanics:** understand `MaxAttempts`, `BackoffRate`, transient error classes (`Lambda.*`) + custom error names

* **Catch mechanics:** `ResultPath` stores error info; `Next` routes to compensating path

* **Lambda integration wrapper:** `arn:aws:states:::lambda:invoke` returns `$.Payload` — use **OutputPath** to keep state data clean

* **Named errors:** throwing a custom error name (e.g., `TransientError`) enables deterministic Retry/Catch matching

* **IAM least privilege:** SFN role needs `lambda:InvokeFunction` scoped to specific function ARNs (not `*`)

___

## **Interview talking points**

* “I built a Step Functions Standard workflow to orchestrate multiple Lambda tasks with retries and compensating actions.”

* “I modeled transient failures with named errors and proved Retry + exponential backoff behavior using execution history.”

* “I kept payloads clean across states using JSONPath + OutputPath/ResultPath.”

* “I applied least-privilege IAM so Step Functions can invoke only the required Lambdas.”

* “I validated behavior with evidence: state machine graph, execution graphs, output proof, and CLI execution-history logs.”

---

## **IAM Flow**

**Goal:** show the “who assumes what” chain clearly.

1. **You (CLI user)** authenticate using `AWS_PROFILE=lab-dev`

2. You create:

   * **Lambda execution role** (`${LAB}-lambda-exec`) with trust: `lambda.amazonaws.com`

   * **Step Functions execution role** (`${LAB}-sfn-exec`) with trust: `states.amazonaws.com`

3. **When Lambdas run**, Lambda service assumes `...-lambda-exec`

   * grants CloudWatch logging (and any future permissions you add)

4. **When Step Functions runs**, SFN service assumes `...-sfn-exec`

   * grants `lambda:InvokeFunction` **only** for your 3 lab Lambda ARNs

5. SFN invokes Lambda via the service integration `arn:aws:states:::lambda:invoke`

   * Lambda executes using its own execution role

   * Step Functions captures results and applies Retry/Catch rules

___

## **Cleanup / Hibernate (cost control)**

* **Step Functions:** delete state machine if you’re done (or keep for portfolio)

* **Lambda:** delete 3 functions if you want a full teardown

* **IAM:** detach/delete policies + delete roles if you want a full teardown

* **CloudWatch Log Groups:** optional cleanup (small cost)

___

