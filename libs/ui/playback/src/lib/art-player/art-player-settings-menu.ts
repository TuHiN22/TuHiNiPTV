import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { resolutionToQualityTier } from './video-quality-tier.util';

/**
 * ArtPlayer settings-menu integration for HLS stream quality and audio tracks.
 *
 * Provides two settings-menu items — "Video Quality" and "Audio Track" — that
 * replace ArtPlayer's default "Play Speed" and "Aspect Ratio" entries (those
 * are disabled in the player config). The items are passed to the player as
 * `option.settings` so they render at the top of the menu; they start with an
 * "Auto" placeholder and are repopulated from hls.js as the manifest and audio
 * tracks are parsed.
 *
 * Video Quality lets the user pin a resolution or fall back to "Auto"
 * (adaptive bitrate). Each entry in the quality selector list shows the exact
 * `WIDTH × HEIGHT, N.NN Mbps` detail, while the collapsed menu row shows only
 * the broadcast-style tier (SD/HD/FHD/4K) of the currently selected level.
 * Audio Track lists the alternate hls.js audio renditions.
 */

const AUTO_LEVEL = -1;

const QUALITY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#fff">
    <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm2.5 5v6h1.4v-2.3h1.6V15h1.4V9h-1.4v2.3H8.9V9H7.5zm7 0v6h3.2c.6 0 1-.5 1-1.1V10c0-.6-.4-1-1-1h-3.2zm1.4 1.2h1.4v3.6h-1.4v-3.6z"/>
</svg>`;

const AUDIO_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="#fff">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
</svg>`;

type Level = { width?: number; height?: number; bitrate?: number };
type AudioTrack = { name?: string; lang?: string };

interface SelectorOption {
    html: string;
    /** Short value shown in the collapsed menu row when this option is active. */
    valueLabel?: string;
    default?: boolean;
    level?: number;
    index?: number;
}

interface MenuSetting {
    name: string;
    html: string;
    icon: string;
    tooltip: string;
    selector: SelectorOption[];
    onSelect: (item: SelectorOption) => string;
    [key: string]: unknown;
}

/** Full resolution/bitrate detail shown in the quality selector list. */
function levelLabel(level: Level): string {
    const size =
        level.width && level.height ? `${level.width} × ${level.height}` : '';
    const rate = level.bitrate
        ? `${(level.bitrate / 1_000_000).toFixed(2)} Mbps`
        : '';
    return [size, rate].filter(Boolean).join(', ') || 'Unknown';
}

/**
 * Short broadcast-style tier (SD/HD/FHD/4K) shown in the collapsed Video
 * Quality row. Falls back to the full detail when the tier is unknown.
 */
function levelTierLabel(level: Level): string {
    const tier = resolutionToQualityTier(level.width, level.height);
    return tier || levelLabel(level);
}

function audioLabel(track: AudioTrack, index: number): string {
    return track.name || track.lang || `Track ${index + 1}`;
}

/**
 * Owns the "Video Quality" and "Audio Track" ArtPlayer settings items and keeps
 * them in sync with the active hls.js instance.
 */
export class ArtPlayerSettingsMenu {
    /** Passed to `new Artplayer({ settings })` so items render at menu top. */
    readonly settings: MenuSetting[];

    private player: Artplayer | null = null;
    private hls: Hls | null = null;

    constructor() {
        this.settings = [this.buildQualitySetting(), this.buildAudioSetting()];
    }

    setPlayer(player: Artplayer): void {
        this.player = player;
    }

    attachHls(hls: Hls): void {
        this.hls = hls;
        const refresh = () => this.refresh();
        hls.on(Hls.Events.MANIFEST_PARSED, refresh);
        hls.on(Hls.Events.LEVEL_SWITCHED, refresh);
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, refresh);
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, refresh);
        this.refresh();
    }

    private refresh(): void {
        const update = this.player?.setting?.update;
        if (typeof update !== 'function') {
            return;
        }
        this.player?.setting.update(
            this.buildQualitySetting() as unknown as Parameters<
                Artplayer['setting']['update']
            >[0]
        );
        this.player?.setting.update(
            this.buildAudioSetting() as unknown as Parameters<
                Artplayer['setting']['update']
            >[0]
        );
    }

    private buildQualitySetting(): MenuSetting {
        const hls = this.hls;
        const levels = (hls?.levels as Level[] | undefined) ?? [];
        const autoSelected = !hls || hls.autoLevelEnabled;
        const options: SelectorOption[] = [
            {
                html: 'Auto',
                valueLabel: 'Auto',
                level: AUTO_LEVEL,
                default: autoSelected,
            },
            ...levels.map((level, index) => ({
                // List row shows the full resolution/bitrate detail…
                html: levelLabel(level),
                // …while the collapsed row shows only the SD/HD/FHD/4K tier.
                valueLabel: levelTierLabel(level),
                level: index,
                default: !autoSelected && hls?.currentLevel === index,
            })),
        ];
        const current = options.find((option) => option.default) ?? options[0];

        return {
            name: 'videoQuality',
            html: 'Video Quality',
            icon: QUALITY_ICON,
            tooltip: current.valueLabel ?? current.html,
            selector: options,
            onSelect: (item: SelectorOption): string => {
                if (this.hls) {
                    this.hls.currentLevel = Number(item.level ?? AUTO_LEVEL);
                }
                return item.valueLabel ?? item.html;
            },
        };
    }

    private buildAudioSetting(): MenuSetting {
        const hls = this.hls;
        const tracks = (hls?.audioTracks as AudioTrack[] | undefined) ?? [];
        const currentTrack = hls?.audioTrack ?? AUTO_LEVEL;
        const options: SelectorOption[] =
            tracks.length > 0
                ? tracks.map((track, index) => ({
                      html: audioLabel(track, index),
                      index,
                      default: currentTrack === index,
                  }))
                : [{ html: 'Auto', index: AUTO_LEVEL, default: true }];
        const current = options.find((option) => option.default) ?? options[0];

        return {
            name: 'audioTrack',
            html: 'Audio Track',
            icon: AUDIO_ICON,
            tooltip: current.html,
            selector: options,
            onSelect: (item: SelectorOption): string => {
                const index = Number(item.index ?? AUTO_LEVEL);
                if (this.hls && index >= 0) {
                    this.hls.audioTrack = index;
                }
                return item.html;
            },
        };
    }
}
