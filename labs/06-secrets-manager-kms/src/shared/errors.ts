// Why: SecretRetrievalError signals an AWS/IAM/KMS problem.
// If this is seen in CloudWatch, check: IAM policy, KMS key policy, secret ARN.
export class SecretRetrievalError extends Error {
  override name = "SecretRetrievalError";
}

// Why: SecretValidationError signals a code/contract problem.
// If this is seen, the secret shape doesn't match SecretPayload — someone changed the secret.
export class SecretValidationError extends Error {
  override name = "SecretValidationError";
}
