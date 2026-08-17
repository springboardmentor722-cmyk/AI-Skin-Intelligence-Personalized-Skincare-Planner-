// typescript-eslint (bundled inside eslint-config-next) hard-refuses to load
// under TypeScript 7 (see node_modules/eslint-config-next/node_modules/
// typescript-eslint/dist/index.js) — no released version supports it yet
// (https://github.com/typescript-eslint/typescript-eslint/issues/10940). The
// app itself builds and typechecks fine under TS 7 (`tsc`/`next build`); only
// this linting tool needs an older TS. Microsoft's own migration guide
// (https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)
// is exactly this: give the linter's typescript-eslint copy its own private
// TypeScript install via Node's normal "closest node_modules wins"
// resolution, so `require("typescript")` from inside typescript-eslint picks
// this one up instead of the project's real (7.x) install. Runs on
// `postinstall` because a plain `npm install` doesn't materialize this —
// `typescript` is only a peerDependency of typescript-eslint, which npm
// doesn't force-install even with a version-forcing `overrides` entry.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const targetDir = "node_modules/eslint-config-next/node_modules/typescript-eslint";
const shimTsPackageJson = `${targetDir}/node_modules/typescript/package.json`;
const pinnedVersion = "5.9.3";

if (!existsSync(targetDir)) {
  // eslint-config-next's dependency tree shape changed (or isn't installed
  // yet) — nothing to shim.
  process.exit(0);
}

const alreadyShimmed =
  existsSync(shimTsPackageJson) &&
  JSON.parse(readFileSync(shimTsPackageJson, "utf8")).version === pinnedVersion;

if (!alreadyShimmed) {
  // shell: true is required for npm.cmd to spawn reliably from inside an
  // already-running npm lifecycle script on Windows (plain execFileSync
  // fails with EINVAL there) — every argument here is a fixed literal, never
  // user input, so there's no injection surface from skipping manual escaping.
  execFileSync(
    "npm",
    ["install", `typescript@${pinnedVersion}`, "--no-save", "--prefix", targetDir],
    { stdio: "inherit", shell: true }
  );
}
