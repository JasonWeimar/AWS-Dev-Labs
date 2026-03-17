import {
  SecretsManagerClient,
  PutSecretValueCommand,
  DescribeSecretCommand,
} from "@aws-sdk/client-secrets-manager";

import type { RotateSecretInput, SecretPayload } from "../shared/types";
import { SecretRetrievalError } from "../shared/errors";

const client = new SecretsManagerClient({});
const SECRET_NAME = process.env.SECRET_NAME ?? "";

export const handler = async (event: RotateSecretInput): Promise<{
  message: string;
  previousVersionId: string;
  newVersionId: string;
}> => {
  if (!SECRET_NAME) {
    throw new SecretRetrievalError("SECRET_NAME environment variable is not set");
  }

  if (!event.newPassword || event.newPassword.length < 8) {
    // Why: Minimum validation — real rotation would enforce password policy.
    // 8-char minimum is intentionally light; this is a lab, not production auth.
    throw new Error("newPassword must be at least 8 characters");
  }

  // Step 1: Read the current secret to preserve unchanged fields
  // Why: We only want to update the password field.
  // Re-reading the current value avoids accidentally wiping username or environment.
  const describeResult = await client.send(
    new DescribeSecretCommand({ SecretId: SECRET_NAME })
  );

  // Capture the current version ID BEFORE the update — this becomes AWSPREVIOUS
  const previousVersionId =
    Object.entries(describeResult.VersionIdsToStages ?? {}).find(([, stages]) =>
      stages.includes("AWSCURRENT")
    )?.[0] ?? "unknown";
  // Why: VersionIdsToStages is a map of {versionId: [stagingLabels]}.
  // We search for the entry whose labels include "AWSCURRENT" to capture the current version ID.
  // After our PutSecretValue, this version will move to AWSPREVIOUS.

  // Step 2: Write the new secret value
  const newPayload: SecretPayload = {
    username: "appuser",             // preserved — not changed
    password: event.newPassword,     // updated
    environment: "lab06",            // preserved — not changed
  };

  const putResult = await client.send(
    new PutSecretValueCommand({
      SecretId: SECRET_NAME,
      SecretString: JSON.stringify(newPayload),
      // Why: PutSecretValue creates a new version.
      // AWS automatically assigns AWSCURRENT to this new version
      // and moves the old AWSCURRENT to AWSPREVIOUS.
      // We don't need to manage staging labels manually here.
    })
  );

  return {
    message: "Secret version rotated successfully. AWSPREVIOUS now points to the previous version.",
    previousVersionId,
    newVersionId: putResult.VersionId ?? "unknown",
    // Why: Return both IDs so the caller can verify them with retrieveSecret
    // by comparing AWSCURRENT vs AWSPREVIOUS responses.
  };
};
