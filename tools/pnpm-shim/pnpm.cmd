@echo off
REM Committed pnpm shim. electron-builder (and some tooling) shell out to
REM `pnpm` / `pnpm.cmd` via PATH. On machines where pnpm is not globally
REM installed, this shim forwards to the Corepack-managed pnpm pinned in
REM package.json ("packageManager"). Put this directory on PATH (the
REM `make:exe` script does this automatically).
corepack pnpm %*
