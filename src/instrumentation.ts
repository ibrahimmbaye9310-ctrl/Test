/** Exécuté une fois au démarrage du serveur Next.js. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { checkEnvironment } = await import("./lib/env-check");
    checkEnvironment();
  }
}
