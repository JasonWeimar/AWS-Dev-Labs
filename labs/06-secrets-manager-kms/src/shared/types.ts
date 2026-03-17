// Why: Defines the expected shape of the secret JSON string.
// Secrets Manager stores secrets as strings — we parse into this type.
// If the shape changes and this type doesn't match, TypeScript catches it at compile time.
export type SecretPayload = {
  username: string;
  password: string;
  environment: string;
};

// Why: The structured response this Lambda returns as proof.
// Never returns the raw secret value — maskedValue hides sensitive data.
// versionId + versionStage prove WHICH version was retrieved.
export type SecretProofResult = {
  secretName: string;
  versionId: string;
  versionStage: string;
  retrievedAt: string;
  valid: boolean;
  maskedValue: string;   // e.g. "appuser / ***" — never the real password
  environment: string;
};

// Why: Input shape for the retrieveSecret Lambda handler.
// Allows caller to request AWSCURRENT (default) or AWSPREVIOUS.
export type RetrieveSecretInput = {
  versionStage?: "AWSCURRENT" | "AWSPREVIOUS" | "AWSPENDING";
};

// Why: Input shape for the rotateSecretVersion Lambda handler.
export type RotateSecretInput = {
  newPassword: string;
};
