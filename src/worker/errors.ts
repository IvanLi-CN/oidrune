export class HttpProblem extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function asProblem(error: unknown): HttpProblem {
  if (error instanceof HttpProblem) {
    return error;
  }
  return new HttpProblem(
    503,
    "durable_handoff_unavailable",
    "Oidrune could not durably accept the event.",
  );
}
