import { Component, computed, inject, input, output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { PlaylistSwitcherComponent } from '@iptvnator/playlist/shared/ui';
import { PlaylistContextFacade } from '@iptvnator/playlist/shared/util';
import { Channel } from '@iptvnator/shared/interfaces';
import { ChannelListContainerComponent } from '@iptvnator/ui/components';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss'],
    imports: [
        ChannelListContainerComponent,
        MatIcon,
        MatIconButton,
        MatTooltip,
        PlaylistSwitcherComponent,
        RouterLink,
    ],
})
export class SidebarComponent {
    readonly channels = input<Channel[]>([]);
    readonly channelsLoading = input(false);
    readonly showPlaylistHeader = input(true);
    readonly activeView = input<string>('all');
    readonly sidebarWidth = input<number | null>(null);
    readonly sidebarWidthRequested = output<number>();
    readonly sidebarWidthRequestEnded = output<number>();
    readonly sidebarToggleRequested = output<void>();

    private readonly playlistContext = inject(PlaylistContextFacade);

    readonly activePlaylist = this.playlistContext.activePlaylist;
    readonly playlistTitle = computed(() => {
        const playlist = this.activePlaylist();

        return (
            playlist?.title ||
            playlist?.filename ||
            playlist?.url ||
            playlist?.portalUrl ||
            'Untitled playlist'
        );
    });

    readonly subtitle = computed(() => {
        if (this.channelsLoading()) {
            return 'Loading channels...';
        }

        const count = this.channels()?.length ?? 0;
        return `${count} ${'Channels'}`;
    });

    onSidebarWidthRequested(width: number): void {
        this.sidebarWidthRequested.emit(width);
    }

    onSidebarWidthRequestEnded(width: number): void {
        this.sidebarWidthRequestEnded.emit(width);
    }
}
