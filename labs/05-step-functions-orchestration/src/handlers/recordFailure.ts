import type { WorkflowResult } from "../shared/types";

/**
 * RecordFailure: Catch path target.
 * Why: In real systems- persist a failure, emit an alert, or trigger compensations.
 * For the lab- return a clean FAILED result.
 *
 * Step Functions Catch provides { Error, Cause }. Preserve Error as evidence.
 */
export const handler = async (event: any): Promise<WorkflowResult> => {
  return {
    requestId: event.requestId ?? "UNKNOWN",
    itemId: event.itemId ?? "UNKNOWN",
    status: "FAILED",
    message: "Handled failure path",
    errorName: event.Error ?? "UnknownError"
  };
};
