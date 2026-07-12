import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { PlaylistInfoComponent } from '@iptvnator/playlist/shared/ui';
import { PlaylistContextFacade } from '@iptvnator/playlist/shared/util';
import { DialogService } from '@iptvnator/ui/components';
import { PlaylistActions } from '@iptvnator/m3u-state';

@Component({
    selector: 'app-playlist-error-view',
    templateUrl: './playlist-error-view.component.html',
    styleUrls: ['./playlist-error-view.component.scss'],
    imports: [MatButtonModule, MatIconModule, RouterLink],
})
export class PlaylistErrorViewComponent {
    private dialog = inject(MatDialog);
    private dialogService = inject(DialogService);
    private readonly playlistContext = inject(PlaylistContextFacade);
    private router = inject(Router);
    private store = inject(Store);

    private readonly currentPlaylist = this.playlistContext.activePlaylist;

    readonly description = input<string | undefined>(undefined);
    readonly showIllustration = input(true);
    readonly showActionButtons = input(true);
    readonly title = input<string | undefined>(undefined);
    readonly viewType = input<'ERROR' | 'EMPTY_CATEGORY' | 'NO_SEARCH_RESULTS'>(
        'ERROR'
    );

    openPlaylistDetails() {
        this.dialog.open(PlaylistInfoComponent, {
            data: this.currentPlaylist(),
        });
    }

    removeClicked(): void {
        const currentPlaylist = this.currentPlaylist();
        if (!currentPlaylist?._id) {
            return;
        }

        this.dialogService.openConfirmDialog({
            title: 'Remove playlist',
            message:
                'Are you sure you want to delete this playlist completely?',
            onConfirm: (): void => this.removePlaylist(currentPlaylist._id),
        });
    }

    removePlaylist(playlistId: string): void {
        this.store.dispatch(PlaylistActions.removePlaylist({ playlistId }));
        this.router.navigate(['/']);
    }
}
