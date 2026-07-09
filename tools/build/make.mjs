// Builds the desktop app installer without requiring a globally installed pnpm.
//
// electron-builder shells out to `pnpm` / `pnpm.cmd` via PATH while detecting
// the package manager and installing native deps. On machines where pnpm is
// not on PATH (only Corepack is available), that lookup fails. This wrapper
// prepends the committed `tools/pnpm-shim` directory to PATH so those lookups
// resolve to the Corepack-managed pnpm, then runs the nx `make` target.
//
// Usage:
//   node tools/build/make.mjs                # build the installer
//   node tools/build/make.mjs --package      # unpacked app only (no installer)
//   node tools/build/make.mjs <extra args>   # forwarded to the nx target

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const shimDir = path.join(scriptDir, '..', 'pnpm-shim');

const forwarded = process.argv.slice(2);
const packageOnly = forwarded.includes('--package');
const passthrough = forwarded.filter((arg) => arg !== '--package');

const target = packageOnly ? 'package:app' : 'make:app';
const args = ['pnpm', 'run', target, '--', '--publishPolicy=never', ...passthrough];

const env = {
    ...process.env,
    PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}`,
};

console.log(`> corepack ${args.join(' ')}`);
console.log(`  (PATH prepended with ${shimDir})`);

const result = spawnSync('corepack', args, {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
});

if (result.error) {
    console.error(result.error.message);
    process.exit(1);
}

process.exit(result.status ?? 1);
