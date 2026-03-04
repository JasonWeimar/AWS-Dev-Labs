import { TransientError } from "../shared/errors";
import type { WorkflowInput, WorkflowResult } from "../shared/types";

/**
 * ProcessItem: the "business work" step.
 * Why: Include a deterministic failure switch to prove Retry + Catch in Step E.
 */
export const handler = async (event: WorkflowInput): Promise<WorkflowResult> => {
  if (event.shouldFail) {
    // Named error so Retry/Catch can match it.
    throw new TransientError("Forced failure for Retry/Catch evidence");
  }

  return {
    requestId: event.requestId,
    itemId: event.itemId,
    status: "OK",
    message: "Processed successfully"
  };
};
