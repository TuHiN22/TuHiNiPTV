import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import type { PlaylistType } from '../../add-playlist-menu/playlist-type';

export type EmptyStateType =
    | 'welcome-dashboard'
    | 'welcome-sources'
    | 'no-results'
    | 'no-data';

interface FeatureCard {
    icon: string;
    titleKey: string;
    descKey: string;
    electronOnly?: boolean;
}

interface SourceCard {
    type: PlaylistType;
    icon: string;
    nameKey: string;
    needsKey: string;
    addLabelKey: string;
    contentKeys: readonly string[];
}

const FEATURE_CARDS: readonly FeatureCard[] = [
    {
        icon: 'live_tv',
        titleKey: 'Live TV',
        descKey: 'Stream live channels with full schedule.',
    },
    {
        icon: 'movie',
        titleKey: 'Movies & Series',
        descKey: 'On-demand library with covers and details.',
    },
    {
        icon: 'event_note',
        titleKey: 'EPG & Catch-up',
        descKey: 'Program guide and time-shifted playback.',
    },
    {
        icon: 'download_for_offline',
        titleKey: 'Offline downloads',
        descKey: 'Save movies and episodes for later.',
        electronOnly: true,
    },
];

const SOURCE_CARDS: readonly SourceCard[] = [
    {
        type: 'url',
        icon: 'folder_open',
        nameKey: 'M3U/M3U8 Files',
        needsKey: 'Local file or URL pointing to an M3U/M3U8 playlist.',
        addLabelKey: 'Add M3U',
        contentKeys: ['Live', 'EPG'],
    },
    {
        type: 'xtream',
        icon: 'cloud',
        nameKey: 'Xtream Codes',
        needsKey: 'Username, password and server URL from your provider.',
        addLabelKey: 'Add Xtream',
        contentKeys: ['Live', 'Movies', 'Series', 'EPG'],
    },
    {
        type: 'stalker',
        icon: 'cast',
        nameKey: 'Stalker Portal',
        needsKey: 'Portal URL and MAC address (Ministra-compatible).',
        addLabelKey: 'Add Stalker',
        contentKeys: ['Live', 'Movies', 'Series', 'EPG'],
    },
];

@Component({
    selector: 'app-empty-state',
    templateUrl: './empty-state.component.html',
    styleUrls: [
        './empty-state.component.scss',
        './empty-state.welcome-dashboard.scss',
        './empty-state.welcome-sources.scss',
        './empty-state.responsive.scss',
        './empty-state.themes.scss',
    ],
    imports: [MatButtonModule, MatIcon],
})
export class EmptyStateComponent {
    readonly type = input.required<EmptyStateType>();

    readonly icon = input<string>('inbox');
    readonly titleKey = input<string>('');
    readonly descriptionKey = input<string>('');
    readonly primaryActionLabelKey = input<string | null>(null);
    readonly secondaryActionLabelKey = input<string | null>(null);

    readonly showElectronOnlyValueProps = input<boolean>(false);

    readonly addPlaylistClicked = output<PlaylistType | undefined>();
    readonly primaryActionClicked = output<void>();
    readonly secondaryActionClicked = output<void>();

    readonly featureCards = FEATURE_CARDS;
    readonly sourceCards = SOURCE_CARDS;

    onAddPlaylist(type?: PlaylistType): void {
        this.addPlaylistClicked.emit(type);
    }

    onPrimaryAction(): void {
        this.primaryActionClicked.emit();
    }

    onSecondaryAction(): void {
        this.secondaryActionClicked.emit();
    }

    isFeatureCardVisible(card: FeatureCard): boolean {
        return !card.electronOnly || this.showElectronOnlyValueProps();
    }
}
