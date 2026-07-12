import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    WorkspaceCommandContribution,
    WorkspaceViewCommandService,
} from '@iptvnator/portal/shared/util';
import { RuntimeCapabilitiesService, SettingsStore } from '@iptvnator/services';
import { VideoPlayer } from '@iptvnator/shared/interfaces';

type PlayerCommandRequirement = 'none' | 'managed-external' | 'embedded-mpv';

interface PlayerCommandDefinition {
    id: string;
    player: VideoPlayer;
    icon: string;
    nameKey: string;
    keywords: readonly string[];
    requires: PlayerCommandRequirement;
    priority: number;
}

const PLAYER_COMMAND_DEFS: readonly PlayerCommandDefinition[] = [
    {
        id: 'switch-player-videojs',
        player: VideoPlayer.VideoJs,
        icon: 'play_circle',
        nameKey: 'Video.js player',
        keywords: ['player', 'videojs', 'video.js'],
        requires: 'none',
        priority: 90,
    },
    {
        id: 'switch-player-html5',
        player: VideoPlayer.Html5Player,
        icon: 'play_circle',
        nameKey: 'HTML5 video player',
        keywords: ['player', 'html5'],
        requires: 'none',
        priority: 91,
    },
    {
        id: 'switch-player-artplayer',
        player: VideoPlayer.ArtPlayer,
        icon: 'play_circle',
        nameKey: 'ArtPlayer',
        keywords: ['player', 'artplayer', 'art'],
        requires: 'none',
        priority: 92,
    },
    {
        id: 'switch-player-embedded-mpv',
        player: VideoPlayer.EmbeddedMpv,
        icon: 'play_circle',
        nameKey: 'Embedded MPV (Experimental)',
        keywords: ['player', 'embedded', 'mpv', 'native'],
        requires: 'embedded-mpv',
        priority: 93,
    },
    {
        id: 'switch-player-mpv',
        player: VideoPlayer.MPV,
        icon: 'play_circle_outline',
        nameKey: 'MPV player',
        keywords: ['player', 'mpv', 'external'],
        requires: 'managed-external',
        priority: 94,
    },
    {
        id: 'switch-player-vlc',
        player: VideoPlayer.VLC,
        icon: 'play_circle_outline',
        nameKey: 'VLC',
        keywords: ['player', 'vlc', 'external'],
        requires: 'managed-external',
        priority: 95,
    },
];

@Injectable({ providedIn: 'root' })
export class WorkspacePlayerCommandsContributor {
    private readonly viewCommands = inject(WorkspaceViewCommandService);
    private readonly settingsStore = inject(SettingsStore);
    private readonly snackBar = inject(MatSnackBar);
    private readonly destroyRef = inject(DestroyRef);
    private readonly runtime = inject(RuntimeCapabilitiesService);
    private readonly embeddedMpvSupported = signal(false);
    private embeddedMpvSupportChecked = false;
    private embeddedMpvSupportLoad: Promise<void> | null = null;

    constructor() {
        const unregisters = PLAYER_COMMAND_DEFS.map((def) =>
            this.viewCommands.registerCommand(this.toContribution(def))
        );

        this.destroyRef.onDestroy(() => {
            for (const unregister of unregisters) {
                unregister();
            }
        });
    }

    ensureEmbeddedMpvSupportLoaded(): Promise<void> | undefined {
        if (this.embeddedMpvSupportChecked) {
            return undefined;
        }

        if (
            !this.runtime.supportsEmbeddedMpv ||
            typeof window === 'undefined' ||
            !window.electron?.getEmbeddedMpvSupport
        ) {
            this.embeddedMpvSupportChecked = true;
            return undefined;
        }

        this.embeddedMpvSupportLoad ??= this.loadEmbeddedMpvSupport();
        return this.embeddedMpvSupportLoad;
    }

    private async loadEmbeddedMpvSupport(): Promise<void> {
        try {
            const support = await window.electron?.getEmbeddedMpvSupport?.();
            this.embeddedMpvSupported.set(!!support?.supported);
        } catch (error) {
            console.warn(
                'Failed to verify embedded MPV support for the command palette.',
                error
            );
        } finally {
            this.embeddedMpvSupportChecked = true;
            this.embeddedMpvSupportLoad = null;
        }
    }

    private toContribution(
        def: PlayerCommandDefinition
    ): WorkspaceCommandContribution {
        return {
            id: def.id,
            group: 'global',
            icon: def.icon,
            labelKey: 'Switch player to {{name}}',
            labelParams: () => ({ name: def.nameKey }),
            descriptionKey: 'Set {{name}} as the active video player',
            descriptionParams: () => ({
                name: def.nameKey,
            }),
            keywords: () => [...def.keywords, def.nameKey.toLowerCase()],
            priority: def.priority,
            visible: () => this.isVisible(def),
            enabled: () => this.settingsStore.player() !== def.player,
            run: () => this.activate(def),
        };
    }

    private isVisible(def: PlayerCommandDefinition): boolean {
        switch (def.requires) {
            case 'managed-external':
                return this.runtime.supportsManagedExternalPlayers;
            case 'embedded-mpv':
                return this.embeddedMpvSupported();
            default:
                return true;
        }
    }

    private activate(def: PlayerCommandDefinition): void {
        void this.settingsStore.updateSettings({ player: def.player });

        const name = def.nameKey;
        this.snackBar.open(`Player set to ${name}`, undefined, {
            duration: 2500,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }
}
