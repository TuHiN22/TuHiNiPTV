# Release Notes Template

Copy this template when drafting notes for a GitHub Release of **TuHiN iPTV**.
Fill every placeholder in `{{ ... }}`, delete sections that do not apply, and keep
the ordering. Notes are user-facing: write for people installing the app, not for
maintainers. Keep entries in the imperative/past tense and link issues/PRs where
possible.

> The CI workflow (`.github/workflows/build-and-make.yaml`) publishes a **draft**
> release with auto-generated notes when a `v*.*.*` tag is pushed. Use this
> template to replace or augment those auto-generated notes before publishing.

---

## TuHiN iPTV v{{ MAJOR.MINOR.PATCH }}

{{ One or two sentences summarizing the release theme, e.g. "Playback reliability
release: recovers stalled HLS streams and clarifies unsupported-format errors." }}

**Release date:** {{ YYYY-MM-DD }}
**Type:** {{ Stable | Pre-release }}

### Highlights

- {{ Most important change #1 }}
- {{ Most important change #2 }}
- {{ Most important change #3 }}

### Features

- {{ New feature }} ({{ #PR or #issue }})

### Improvements

- {{ UX / performance / reliability improvement }} ({{ #PR }})

### Bug Fixes

- {{ Fixed: description of the bug and the user-visible result }} ({{ #issue }})

### Breaking Changes

> Delete this section if there are none.

- {{ What changed, who is affected, and the migration/upgrade step required. }}

### Known Issues

> Delete this section if there are none.

- {{ Known limitation and any workaround. }}

### Upgrade Notes

- Auto-update: existing desktop installs update automatically via electron-updater
  from the attached `latest.yml` / `latest-mac.yml` / `latest-linux.yml` metadata.
- Manual install: download the artifact for your platform from **Assets** below.

### Downloads

| Platform | Artifact |
| --- | --- |
| Windows (x64) | `tiptv-{{ version }}-windows-x64-setup.exe` |
| macOS (Intel) | `tiptv-{{ version }}-mac-x64.dmg` |
| macOS (Apple Silicon) | `tiptv-{{ version }}-mac-arm64.dmg` |
| Linux (AppImage) | `tiptv-{{ version }}-linux-x86_64.AppImage` |
| Linux (deb/rpm) | `tiptv-{{ version }}-linux-*.deb` / `*.rpm` |
| Linux (Flatpak) | `*.flatpak` |

### Checksums / Verification

- Windows and macOS artifacts are code-signed; macOS builds are also notarized.
- electron-updater `.blockmap` and `latest*.yml` files are attached for delta
  updates and integrity verification.

### Contributors

Thanks to {{ @handles }} for contributions to this release.

**Full changelog:** {{ https://github.com/TuHiN22/TuHiNiPTV/compare/v{{ PREV }}...v{{ THIS }} }}

---

## Filling guidance

- **Version:** must match `package.json` `version` exactly (no leading `v` in the
  file; the git tag and release title use the `v` prefix).
- **Categorize with conventional commits:** `feat:` → Features, `fix:` → Bug
  Fixes, `perf:`/`refactor:`/`style:` → Improvements, anything with `BREAKING
  CHANGE:` → Breaking Changes.
- **User voice:** describe the observable effect ("stalled channels now recover
  automatically"), not the implementation ("added `startLoad()` retry loop").
- **Links:** prefer PR links; add `closes #NNN` references so issues auto-close.
