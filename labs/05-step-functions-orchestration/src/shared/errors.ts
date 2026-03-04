/**
 * Why: Step Functions Retry/Catch can match error "names".
 * Will throw named errors so the workflow routing is deterministic.
 */
export class ValidationError extends Error {
  override name = "ValidationError";
}

export class TransientError extends Error {
  override name = "TransientError";
}
