import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface SettingsDeleteAllPlaylistsDialogData {
    summary: {
        total: number;
        m3u: number;
        xtream: number;
        stalker: number;
    };
}

type SettingsDeleteSummaryItem = {
    count: number;
    icon: string;
    id: 'm3u' | 'xtream' | 'stalker';
    labelKey: string;
};

@Component({
    selector: 'app-settings-delete-all-playlists-dialog',
    templateUrl: './settings-delete-all-playlists-dialog.component.html',
    styleUrls: ['./settings-delete-all-playlists-dialog.component.scss'],
    imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
})
export class SettingsDeleteAllPlaylistsDialogComponent {
    readonly dialogData =
        inject<SettingsDeleteAllPlaylistsDialogData>(MAT_DIALOG_DATA);

    readonly summaryItems = computed<SettingsDeleteSummaryItem[]>(() => [
        {
            id: 'm3u',
            count: this.dialogData.summary.m3u,
            icon: 'playlist_play',
            labelKey: 'M3U (local, url, text)',
        },
        {
            id: 'xtream',
            count: this.dialogData.summary.xtream,
            icon: 'cloud',
            labelKey: 'Xtream',
        },
        {
            id: 'stalker',
            count: this.dialogData.summary.stalker,
            icon: 'router',
            labelKey: 'Stalker',
        },
    ]);

    readonly consequenceKeys = [
        'Favorites saved for these playlists',
        'Recently viewed history',
        'Saved playback positions',
        'Download history entries linked to those playlists',
        'Imported Xtream categories and locally cached content',
    ] as const;
}
