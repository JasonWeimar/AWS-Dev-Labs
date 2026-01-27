# Lab-0 | **~README~**
___

**First-Half of Lab-0: -Start-**
--------------------------------------------------------------------------------------------


### 1) Lab goal

* Prove an understanding of how AWS credentials flow locally (profile vs env vars) and why roles are preferred in AWS services.

1.) CLI identity sanity: local machine can call AWS as arn:aws:iam::148761680757:user/Jason.

2.) SDK identity sanity: Node AWS SDK v3 script, when run with AWS_PROFILE=lab-dev, resolves to the same identity, proving the SDK is picking up the intended credentials via the provider chain.


### 2.) What I built

* `src/identifyCaller.js` — calls `sts:GetCallerIdentity` and prints the ARN.


### 3.) Local run steps (commands)

run:

```
# Confirm who the CLI thinks you are
AWS_PROFILE=lab-dev aws sts get-caller-identity

# Run SDK v3 script (should match the CLI identity)
AWS_PROFILE=lab-dev npm run dev
```


### 4.) Expected output (redaction rules)

* **NOTE:** only showing **Account ID** and **ARN** for purpose of learning/demo repo.

* **Excluding:** access keys, secret keys, session tokens.

Example block

```
CallerIdentity:
  Arn: arn:aws:iam::148761680757:user/Jason
```


### 5.) Credential chain note:

What `AWS_PROFILE=lab-dev` is doing:

* `AWS_PROFILE=lab-dev` tells the CLI/SDK: **“use the credentials/config under the profile named lab-dev”**

* Those profile creds live in `~/.aws/credentials` (not in the repo)

* This makes runs **repeatable** and avoids accidentally using `default`



### 6.) Screenshots list (first half of lab):

1. Terminal: `aws sts get-caller-identity` showing the `user/Jason` ARN

2. Terminal: `AWS_PROFILE=lab-dev npm run dev` showing the same ARN


Location - `docs/screenshots/` 

1. `docs/screenshots/01-cli-node-sdk-getcalleridentity.png`



**First-Half of Lab-0: -End-**
--------------------------------------------------------------------------------------------

