# Release Guide (GitHub)

Step-by-step technical guide for cutting a **TuHiN iPTV** desktop release on
GitHub. It covers version bumping, changelog/release-note drafting, tagging, the
push that triggers CI, and finalizing the draft GitHub Release.

This project is an Nx + Angular + Electron monorepo. Releases are **tag-driven**:
pushing a `v*.*.*` tag runs `.github/workflows/build-and-make.yaml`, which builds
Windows/macOS/Linux artifacts and opens a **draft** GitHub Release with the
installers attached. You review and publish that draft manually.

- **Repository:** `TuHiN22/TuHiNiPTV` (`origin`)
- **Release branch:** `master`
- **App id / product:** `com.tiptv.tuhin` / `TuHiN iPTV`
- **Current version:** see `package.json` `version`
- **Artifact naming:** `tiptv-<version>-<os>-<arch>...` (e.g.
  `tiptv-0.22.0-windows-x64-setup.exe`)

---

## 0. Prerequisites (one-time)

1. **Push access** to `TuHiN22/TuHiNiPTV` and permission to create releases.
2. **GitHub CLI** authenticated: `gh auth status` (install `gh` if missing).
3. **Toolchain** matching CI: Node 22, `corepack enable`, `pnpm install
   --frozen-lockfile`.
4. **Fix the electron-updater publish target (critical, do once).** In
   `electron-builder.json` the `publish` block currently reads:

   ```json
   "publish": [{ "provider": "github", "owner": "REPLACE_WITH_OWNER", "repo": "tiptv" }]
   ```

   Auto-update will not work until these point at the real repo:

   ```json
   "publish": [{ "provider": "github", "owner": "TuHiN22", "repo": "TuHiNiPTV" }]
   ```

   Commit this fix before the first release.

---

## 1. Pre-release checks

Run from the repo root (`TuHiNiPTV/`). Everything must be green before tagging.

```powershell
git checkout master
git pull origin master
git status                      # working tree must be clean

corepack pnpm install --frozen-lockfile
corepack pnpm run typecheck:ci
corepack pnpm run lint
corepack pnpm run test:unit:ci
```

Optionally verify a local production build succeeds:

```powershell
node tools/build/make.mjs        # produces dist/executables/*-setup.exe
```

Confirm the branch is the exact commit you intend to ship:

```powershell
git rev-parse --short HEAD
git log --oneline -10
```

---

## 2. Choose the version (SemVer)

Follow [Semantic Versioning](https://semver.org/) driven by conventional commits
since the last release:

- `fix:` → **patch** (`0.22.0` → `0.22.1`)
- `feat:` → **minor** (`0.22.0` → `0.23.0`)
- `BREAKING CHANGE:` → **major** (`0.22.0` → `1.0.0`)

List what has landed since the last tag to decide (first release: use full log):

```powershell
# If a previous tag exists:
git log v0.22.0..HEAD --oneline
# First release (no tags yet):
git log --oneline
```

---

## 3. Bump the version

Keep `package.json` and the git tag in sync. `package.json` holds the bare number;
the tag adds the `v` prefix. The `create-release` CI job reads the version from
`package.json`, so it must match the tag.

```powershell
# Sets package.json version, but do NOT let it create a tag yet.
corepack pnpm version 0.23.0 --no-git-tag-version
```

Verify:

```powershell
node -p "require('./package.json').version"   # -> 0.23.0
```

---

## 4. Draft the changelog and release notes

1. Copy `docs/release/release-notes-template.md` and fill it in for this version.
   Categorize entries from conventional commits (`feat:` → Features, `fix:` → Bug
   Fixes, etc.). Write in user-facing language.
2. Prepend a matching section to `CHANGELOG.md`, following the existing format:

   ```markdown
   # [0.23.0](https://github.com/TuHiN22/TuHiNiPTV/compare/v0.22.0...v0.23.0) (YYYY-MM-DD)

   ### Features
   * short description ([<shortsha>](https://github.com/TuHiN22/TuHiNiPTV/commit/<fullsha>))

   ### Bug Fixes
   * short description ([<shortsha>](https://github.com/TuHiN22/TuHiNiPTV/commit/<fullsha>))
   ```

Keep the drafted release notes handy (e.g. `RELEASE_NOTES.md` scratch file, or
paste directly in step 8). They become the GitHub Release body.

---

## 5. Commit the release prep

Stage only the release-prep files and commit with a conventional message.

```powershell
git add package.json CHANGELOG.md
# Include electron-builder.json here if you applied the step-0 publish fix.
git commit -m "chore(release): v0.23.0"
```

Push the commit to `master` first (this also runs CI on `master`, a useful
pre-tag smoke check):

```powershell
git push origin master
```

---

## 6. Create the version tag

Create an **annotated** tag on the release commit. The tag name must be
`v<version>` and match `package.json`.

```powershell
git tag -a v0.23.0 -m "TuHiN iPTV v0.23.0"
```

Verify the tag points at the intended commit:

```powershell
git show v0.23.0 --stat --no-patch
git describe --tags
```

---

## 7. Push the tag (triggers the release build)

Pushing the tag is what starts the platform builds and the draft release job.

```powershell
git push origin v0.23.0
```

Watch the workflow. It builds Windows, macOS (x64 + arm64), and Linux
(standard + Flatpak), then runs `create-release`:

```powershell
gh run watch
# or list recent runs:
gh run list --workflow "Build and Make Electron App" --limit 5
```

> If the tag was wrong, delete it locally and remotely, then redo:
> ```powershell
> git tag -d v0.23.0
> git push origin :refs/tags/v0.23.0
> ```

---

## 8. Review and finalize the draft GitHub Release

When CI finishes, a **draft** release named `Release v0.23.0` exists with all
installers, `.blockmap` files, and `latest*.yml` updater metadata attached, plus
auto-generated notes.

```powershell
gh release view v0.23.0 --web
```

Then:

1. **Replace/augment the notes** with your drafted release notes from step 4.
2. **Verify assets** are present for every platform:
   - `tiptv-0.23.0-windows-x64-setup.exe` (+ `.blockmap`, `latest.yml`)
   - `tiptv-0.23.0-mac-x64.dmg`, `tiptv-0.23.0-mac-arm64.dmg`, `latest-mac.yml`
   - Linux `.AppImage` / `.deb` / `.rpm` / `.snap` / `.flatpak`, `latest-linux.yml`
3. **Set flags:** unset "pre-release" for stable; keep the tag `v0.23.0`.
4. **Publish** the release.

Update the notes non-interactively if preferred:

```powershell
gh release edit v0.23.0 --notes-file RELEASE_NOTES.md --draft=false --latest
```

---

## 9. Post-release verification

1. **Auto-update:** install the previous version, launch it, and confirm it offers
   the new version (depends on the step-0 `electron-builder.json` publish fix and
   the attached `latest*.yml`).
2. **Downloads:** download one artifact per OS from the published release and smoke
   test launch.
3. **Snap:** the `publish-snap` job uploads to the Snapcraft `edge` channel on tag
   — confirm it succeeded if Snap is in scope.
4. **Announce** and close the milestone/issues referenced in the notes.

---

## In-app updates (how clients receive this release)

TuHiN iPTV has a built-in update mechanism. Publishing a GitHub Release (the steps
above) is what makes it fire for installed clients.

**Two update paths, chosen automatically by platform (packaged builds only):**

1. **Self-update (electron-updater)** — Windows, macOS, and Linux AppImage.
   `AppUpdateService` (`apps/electron-backend/src/app/services/app-update.service.ts`)
   drives electron-updater, which reads the `latest*.yml` metadata attached to the
   published release from the repo configured in `electron-builder.json`
   (`publish.owner = TuHiN22`, `publish.repo = TuHiNiPTV`). The app can download and
   install the update in place.
2. **Manual/GitHub fallback** — other Linux packaging (deb/rpm/snap/flatpak) and
   any unpackaged build. The service queries
   `https://api.github.com/repos/TuHiN22/TuHiNiPTV/releases`, compares SemVer, and
   points the user at `https://github.com/TuHiN22/TuHiNiPTV/releases/latest`.

**Where users see it:**

- **Auto-prompt:** a startup check (`checkForUpdatesOnStartup`,
  `apps/electron-backend/src/main.ts`) pushes status over IPC; when a newer version
  exists the renderer shows the in-app notification panel
  (`apps/web/src/app/app-update-notification-panel.component.ts`) with
  Download/Install/Release-notes actions.
- **Release link section:** Settings → About
  (`apps/web/src/app/settings/settings-about-section.component.*`) shows the current
  version and a manual "Check for update", "Release notes", and "Open release page"
  control set.

**Release-time requirements for updates to work:**

- The release must be **published** (not a draft) and **not** a pre-release — the
  GitHub fallback and version comparison skip drafts/pre-releases.
- `latest.yml` / `latest-mac.yml` / `latest-linux*.yml` must be attached (the CI
  `create-release` job does this automatically).
- `electron-builder.json` `publish.owner`/`publish.repo` must match the repo the
  release is published to (already set to `TuHiN22`/`TuHiNiPTV`).

---

## Quick reference (happy path)

```powershell
git checkout master && git pull origin master
corepack pnpm install --frozen-lockfile
corepack pnpm run typecheck:ci && corepack pnpm run lint && corepack pnpm run test:unit:ci

corepack pnpm version 0.23.0 --no-git-tag-version
# edit CHANGELOG.md + draft notes from docs/release/release-notes-template.md
git add package.json CHANGELOG.md
git commit -m "chore(release): v0.23.0"
git push origin master

git tag -a v0.23.0 -m "TuHiN iPTV v0.23.0"
git push origin v0.23.0

gh run watch
gh release view v0.23.0 --web     # review, paste notes, publish
```

---

## Troubleshooting

- **No draft release appeared:** the tag must match `v*.*.*`. Check
  `gh run list` for a failed `build` job; `create-release` only runs after `build`
  succeeds.
- **Version mismatch in release name:** the `create-release` job reads
  `package.json`. Ensure step 3 ran and was committed before tagging.
- **Auto-update not detected by clients:** confirm `electron-builder.json`
  `publish.owner`/`publish.repo` point at `TuHiN22`/`TuHiNiPTV` and that
  `latest*.yml` is attached to the published (not draft) release.
- **macOS artifacts missing/unsigned:** signing/notarization needs the `CSC_*`
  and `APPLE_*` secrets/vars configured in the repo; PR builds skip macOS signing
  by design.
- **Re-releasing the same version:** delete the tag locally and remotely (step 7
  note), delete the draft release (`gh release delete v0.23.0`), fix, and repeat.
