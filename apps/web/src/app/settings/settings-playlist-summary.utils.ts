import type { DbOperationEvent } from '@iptvnator/services';
import type { PlaylistMeta } from '@iptvnator/shared/interfaces';
import type { SettingsPlaylistDeleteSummary } from './settings.models';

export function buildSettingsPlaylistDeleteSummary(
    items: readonly PlaylistMeta[]
): SettingsPlaylistDeleteSummary {
    return {
        total: items.length,
        m3u: items.filter((item) => !item.serverUrl && !item.macAddress).length,
        xtream: items.filter((item) => Boolean(item.serverUrl)).length,
        stalker: items.filter((item) => Boolean(item.macAddress)).length,
    };
}

export interface RemoveAllProgressLabelInput {
    readonly isRemovingAllPlaylists: boolean;
    readonly progress: DbOperationEvent | null;
}

export function buildRemoveAllProgressLabel({
    isRemovingAllPlaylists,
    progress,
}: RemoveAllProgressLabelInput): string | null {
    if (!isRemovingAllPlaylists) {
        return null;
    }

    const current = progress?.current;
    const total = progress?.total;

    if (typeof current === 'number' && typeof total === 'number' && total > 0) {
        return `Deleting playlist data… ${current} / ${total}`;
    }

    return 'Deleting playlist data…';
}
