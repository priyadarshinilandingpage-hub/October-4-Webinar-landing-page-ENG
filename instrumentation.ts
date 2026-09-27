// Next.js calls register() once when the server starts. It prints the payment setup check (server/startup-check.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { startupCheck } = await import("./server/startup-check");
  void startupCheck(process.env);
}
