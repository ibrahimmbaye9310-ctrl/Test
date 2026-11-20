import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  // tests/audit et tests/e2e : scripts Node autonomes (CommonJS) lancés à la main contre un serveur local.
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "tests/audit/**", "tests/e2e/**"] },
];

export default config;
