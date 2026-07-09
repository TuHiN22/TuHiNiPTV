# TuHiN iPTV

**TuHiN iPTV** is a cross-platform desktop IPTV player built with Electron and Angular. It plays IPTV playlists (M3U / M3U8), Xtream Codes portals, and Stalker / Ministra portals, with EPG support, VOD/series browsing, favorites, and external/embedded player integration.

> This is a desktop-only application (Electron). The previous PWA / self-hosted web build has been removed.

⚠️ TuHiN iPTV does not provide any playlists or other digital content. Users supply their own IPTV sources.

## Features

**Playlists & sources**

- M3U / M3U8 playlists from local files or remote URLs, with automatic updates on startup
- Xtream Codes (XC) and Stalker / Ministra (STB) portal support
- Custom "User-Agent" header per playlist

**Playback**

- Built-in HTML5 player (HLS.js or Video.js) with a resizable, resumable inline view
- External players — MPV, VLC, and IINA on macOS
- Embedded MPV — native mpv rendered inside the app window on macOS, Windows & Linux (experimental)
- Dedicated radio player for `radio="true"` streams

**Live TV & EPG**

- EPG / XMLTV TV guide with a live timeline ribbon and multi-channel grid
- TV archive / catch-up / timeshift
- Group-based channel list, channel-number selection, and search

**Movies & series (VOD)**

- Two-state detail pages (browse ↔ watch) with season tabs and resume positions
- Download manager for offline movies & episodes
- "Recently added" feeds and category grids with sorting & pagination

**Discovery & metadata**

- Global search across live TV, movies, and series
- TMDB enrichment (opt-in) — plots, cast & crew, trailers, ratings, artwork, a "Similar" rail, and a trending dashboard rail
- Dashboard with recently watched & continue-watching

**Organization**

- Per-playlist and global favorites
- Recently viewed / watch history
- Command palette (`Ctrl/Cmd+K`)

**Platform**

- Desktop auto-updater and mobile remote control
- 18 languages ([translation files](apps/web/src/assets/i18n/)), light & dark themes, and keyboard shortcuts

## Keyboard shortcuts

Press `?` or `Shift+/` in the workspace to open the in-app shortcuts list.

| Area              | Shortcut                    | Action                                     |
| ----------------- | --------------------------- | ------------------------------------------ |
| Global            | `Ctrl/Cmd+K`                | Open command palette                       |
| Global            | `Ctrl/Cmd+F`                | Open global search                         |
| Global            | `Ctrl/Cmd+R`                | Open recently viewed                       |
| Navigation        | `Ctrl/Cmd+B`                | Toggle the live sidebar                    |
| Navigation        | `0-9`                       | Select an M3U channel by number            |
| Playback          | `Space` / `K`               | Play or pause embedded MPV playback        |
| Playback          | `F`                         | Toggle embedded MPV fullscreen             |
| Playback          | `ArrowLeft` / `ArrowRight`  | Seek embedded MPV playback by 5 seconds    |
| Playback          | `ArrowUp` / `ArrowDown`     | Adjust volume by 5%                        |
| Playback          | `M`                         | Mute audio                                 |
| Dialogs and lists | `Escape`                    | Close dialogs and dismiss overlays         |


## Disclaimer

**TuHiN iPTV doesn't provide any playlists or other digital content.** All IPTV sources, logos, metadata, and programme information come from services the user configures.

## License

Source code is licensed under the MIT License — see [LICENSE.md](./LICENSE.md).
