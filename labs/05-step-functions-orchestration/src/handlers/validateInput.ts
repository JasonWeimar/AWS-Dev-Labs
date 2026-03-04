import { ValidationError } from "../shared/errors";

/**
 * ValidateInput: boundary guard.
 * Why: Step Functions can pass anything; validate early so downstream tasks
 * don't fail with confusing errors.
 *
 * Returns: a normalized payload that becomes the workflow's canonical input.
 */
export const handler = async (event: unknown) => {
  const input = event as any;

  if (!input?.requestId || !input?.itemId) {
    throw new ValidationError("Missing requestId or itemId");
  }

  return {
    requestId: String(input.requestId),
    itemId: String(input.itemId),
    shouldFail: Boolean(input.shouldFail ?? false)
  };
};
