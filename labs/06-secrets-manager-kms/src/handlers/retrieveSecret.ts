import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";

import type { RetrieveSecretInput, SecretPayload, SecretProofResult } from "../shared/types";
import { SecretRetrievalError, SecretValidationError } from "../shared/errors";

// Why: Client is instantiated outside the handler for connection reuse across warm invocations.
// The SDK picks up the Lambda execution role credentials automatically via the execution environment.
const client = new SecretsManagerClient({});

// Why: Secret name is injected via environment variable — not hardcoded.
// This keeps the handler portable across environments (dev/staging/prod).
const SECRET_NAME = process.env.SECRET_NAME ?? "";

export const handler = async (event: RetrieveSecretInput): Promise<SecretProofResult> => {
  if (!SECRET_NAME) {
    // Why: Fail fast with a clear message rather than letting a downstream AWS call fail cryptically.
    throw new SecretRetrievalError("SECRET_NAME environment variable is not set");
  }

  const versionStage = event.versionStage ?? "AWSCURRENT";
  // Why: Default to AWSCURRENT so a plain invocation works without any input.
  // AWSPREVIOUS requires an explicit request — proves the caller knows what they want.

  let result: GetSecretValueCommandOutput;

  try {
    result = await client.send(
      new GetSecretValueCommand({
        SecretId: SECRET_NAME,
        VersionStage: versionStage,
        // Why: VersionStage filters which version you receive.
        // Omitting it = AWSCURRENT.
        // Specifying AWSPREVIOUS = the version before the last update.
      })
    );
  } catch (err) {
    // Why: Wrap all AWS SDK errors in a named error class for clean CloudWatch entries.
    // The original error message is preserved in the wrapping message.
    throw new SecretRetrievalError(
      `Failed to retrieve secret: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Why: SecretString is the decrypted plaintext value.
  // If it's missing, the secret might be stored as SecretBinary (unusual) or the call failed silently.
  if (!result.SecretString) {
    throw new SecretRetrievalError("Secret value is empty or stored as binary (unexpected)");
  }

  let payload: SecretPayload;

  try {
    payload = JSON.parse(result.SecretString) as SecretPayload;
  } catch {
    // Why: If the secret string isn't valid JSON, someone stored it incorrectly.
    // This is a SecretValidationError — a code/ops problem, not an AWS problem.
    throw new SecretValidationError("Secret value is not valid JSON");
  }

  // Why: Validate required fields before returning.
  // Type assertions don't check values at runtime — we must do this explicitly.
  if (!payload.username || !payload.password || !payload.environment) {
    throw new SecretValidationError(
      `Secret is missing required fields. Got keys: ${Object.keys(payload).join(", ")}`
    );
  }

  // Why: NEVER return or log the plaintext password.
  // maskedValue proves you retrieved something real without exposing the secret.
  // This is the production pattern — use the secret internally, return proof externally.
  const maskedValue = `${payload.username} / ${"*".repeat(payload.password.length)}`;

  return {
    secretName: SECRET_NAME,
    versionId: result.VersionId ?? "unknown",
    // Why: VersionId is the internal UUID AWS assigned to this version.
    // Comparing versionId between AWSCURRENT and AWSPREVIOUS calls proves they are different versions.
    versionStage,
    retrievedAt: new Date().toISOString(),
    valid: true,
    maskedValue,
    environment: payload.environment,
  };
};
