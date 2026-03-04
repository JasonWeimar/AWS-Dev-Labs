/**
 * Why: Strongly-typed workflow payloads reduce "mystery JSON" and make
 * Step Functions input/output shaping easier to reason about.
 */
export type WorkflowInput = {
  requestId: string;    // correlation id across states + logs
  itemId: string;       // the thing being processed
  shouldFail?: boolean; // flip to force a failure path for evidence
};

/**
 * Why: The orkflow should always return a clean, stable shape.
 * This becomes the "contract" for downstream consumers and for debugging.
 */
export type WorkflowResult = {
  requestId: string;
  itemId: string;
  status: "OK" | "FAILED";
  message: string;
  errorName?: string;
};
