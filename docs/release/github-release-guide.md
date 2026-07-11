# Release Guide (GitHub)

Step-by-step technical guide for cutting a **TuHiN iPTV** desktop release on
GitHub. It covers version bumping, changelog/release-note drafting, tagging, the
push that triggers CI, signing/notarization, and verification of the published
GitHub Release.

This project is an Nx + Angular + Electron monorepo. Releases are **tag-driven**:
pushing a `v*.*.*` tag runs `.github/workflows/release.yml`, which builds
Windows, macOS (x64 + arm64), and Linux (x64 AppImage + deb) artifacts, merges
the macOS updater metadata, validates required assets, and publishes the GitHub
Release automatically. `.github/workflows/build-and-make.yaml` remains a
branch/PR packaging workflow and no longer publishes tags.

- **Repository:** `TuHiN22/TuHiNiPTV` (`origin`)
- **Release branch:** `main`
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
4. **Confirm the electron-updater publish target.** It must point at the fork:

    ```json
    "publish": [{ "provider": "github", "owner": "TuHiN22", "repo": "TuHiNiPTV" }]
    ```

5. **Configure optional signing secrets.** Missing secrets produce unsigned or
   ad-hoc packages; complete credentials enable signing automatically:
    - macOS certificate: `CSC_LINK`, `CSC_KEY_PASSWORD`
    - macOS notarization via API key: `APPLE_API_KEY`,
      `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`
    - macOS notarization via Apple ID: `APPLE_ID`,
      `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`
    - Windows Authenticode: `WIN_CSC_LINK`, `WIN_CSC_KEY_PASSWORD`

---

## 1. Pre-release checks

Run from the repo root (`TuHiNiPTV/`). Everything must be green before tagging.

```powershell
git checkout main
git pull origin main
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
the tag adds the `v` prefix. Electron-builder reads the package version for
artifact and updater metadata, so it must match the tag.

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

    - short description ([<shortsha>](https://github.com/TuHiN22/TuHiNiPTV/commit/<fullsha>))

    ### Bug Fixes

    - short description ([<shortsha>](https://github.com/TuHiN22/TuHiNiPTV/commit/<fullsha>))
    ```

Keep the drafted release notes handy (e.g. `RELEASE_NOTES.md` scratch file, or
paste directly in step 8). They become the GitHub Release body.

---

## 5. Commit the release prep

Stage only the release-prep files and commit with a conventional message.

```powershell
git add package.json CHANGELOG.md
git commit -m "chore(release): v0.23.0"
```

Push the commit to `main` first (this also runs CI on `main`, a useful
pre-tag smoke check):

```powershell
git push origin main
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

Pushing the tag starts the platform builds and automated publish job.

```powershell
git push origin v0.23.0
```

Watch the workflow. It builds Windows, macOS (x64 + arm64), and Linux
(AppImage + deb), then runs `release`:

```powershell
gh run watch
# or list recent runs:
gh run list --workflow "Release" --limit 5
```

> If the tag was wrong, delete it locally and remotely, then redo:
>
> ```powershell
> git tag -d v0.23.0
> git push origin :refs/tags/v0.23.0
> ```

---

## 8. Review the published GitHub Release

When CI finishes, a published release named `TuHiN iPTV v0.23.0` exists with
all installers, `.blockmap` files, merged updater metadata, and generated notes.

```powershell
gh release view v0.23.0 --web
```

Verify:

1. **Assets** are present for every platform:
    - `tiptv-0.23.0-windows-x64-setup.exe` (+ `.blockmap`, `latest.yml`)
    - `tiptv-0.23.0-mac-x64.dmg`, `tiptv-0.23.0-mac-arm64.dmg`, `latest-mac.yml`
    - Linux `.AppImage` / `.deb`, `latest-linux.yml`
2. `latest-mac.yml` contains both x64 and arm64 ZIP entries.
3. The release is neither a draft nor a pre-release.

Update the notes non-interactively if preferred:

```powershell
gh release edit v0.23.0 --notes-file RELEASE_NOTES.md --latest
```

---

## 9. Post-release verification

1. **Auto-update:** install the previous version, launch it, and confirm it offers
   the new version using the attached `latest*.yml` metadata.
2. **Downloads:** download one artifact per OS from the published release and smoke
   test launch.
3. **Signatures:** when signing secrets are configured, verify Authenticode on
   Windows and Gatekeeper/notarization on macOS.
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
  `release` job does this automatically).
- `electron-builder.json` `publish.owner`/`publish.repo` must match the repo the
  release is published to (already set to `TuHiN22`/`TuHiNiPTV`).

---

## Quick reference (happy path)

```powershell
git checkout main && git pull origin main
corepack pnpm install --frozen-lockfile
corepack pnpm run typecheck:ci && corepack pnpm run lint && corepack pnpm run test:unit:ci

corepack pnpm version 0.23.0 --no-git-tag-version
# edit CHANGELOG.md + draft notes from docs/release/release-notes-template.md
git add package.json CHANGELOG.md
git commit -m "chore(release): v0.23.0"
git push origin main

git tag -a v0.23.0 -m "TuHiN iPTV v0.23.0"
git push origin v0.23.0

gh run watch
gh release view v0.23.0 --web     # review assets and generated notes
```

---

## Troubleshooting

- **No release appeared:** the tag must match `v*.*.*`. Check
  `gh run list --workflow Release` for a failed `build` job; `release` only runs
  after every platform build succeeds.
- **Version mismatch in artifacts:** ensure step 3 was committed before tagging.
- **Auto-update not detected by clients:** confirm `electron-builder.json`
  `publish.owner`/`publish.repo` point at `TuHiN22`/`TuHiNiPTV` and that
  `latest*.yml` is attached to the published (not draft) release.
- **macOS artifacts unsigned:** `CSC_LINK` and `CSC_KEY_PASSWORD` enable signing.
  Notarization additionally needs one complete `APPLE_*` credential set.
- **Windows artifacts unsigned:** configure `WIN_CSC_LINK` and
  `WIN_CSC_KEY_PASSWORD`.
- **Re-releasing the same version:** delete the tag locally and remotely (step 7
  note), delete the release (`gh release delete v0.23.0`), fix, and repeat.
