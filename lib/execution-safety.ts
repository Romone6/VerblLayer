const consecutiveFailureLimit = 3;

export function shouldAutoPauseAfterFailure(latestStatuses: readonly string[], dryRun: boolean): boolean {
  // ponytail: this fixed safety guard stays deliberately simple until a real customer needs a different policy.
  return !dryRun
    && latestStatuses.length >= consecutiveFailureLimit
    && latestStatuses.slice(0, consecutiveFailureLimit).every((status) => status === "failed");
}
