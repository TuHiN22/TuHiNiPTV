import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { RecentPlaylistsComponent } from '@iptvnator/playlist/shared/ui';
import { interpolateText } from '@iptvnator/portal/shared/util';
import {
    selectActiveTypeFilters,
    selectAllPlaylistsMeta,
} from '@iptvnator/m3u-state';
import { map } from 'rxjs';
import { SortBy, SortOrder, SortService } from '@iptvnator/services';
import {
    WORKSPACE_SHELL_ACTIONS,
    WorkspacePlaylistType,
} from '@iptvnator/workspace/shell/util';

interface SortOption {
    by: SortBy;
    order: SortOrder;
    icon: string;
    label: string;
}

@Component({
    selector: 'app-workspace-sources',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        RecentPlaylistsComponent,
    ],
    templateUrl: './workspace-sources.component.html',
    styleUrl: './workspace-sources.component.scss',
})
export class WorkspaceSourcesComponent {
    private readonly route = inject(ActivatedRoute);
    private readonly store = inject(Store);
    private readonly workspaceActions = inject(WORKSPACE_SHELL_ACTIONS);
    private readonly sortService = inject(SortService);

    private readonly activeTypeFilters = this.store.selectSignal(
        selectActiveTypeFilters
    );
    private readonly playlists = this.store.selectSignal(
        selectAllPlaylistsMeta
    );

    readonly sortOptions: SortOption[] = [
        {
            by: SortBy.DATE_ADDED,
            order: SortOrder.DESC,
            icon: 'schedule',
            label: 'Date added (Newest first)',
        },
        {
            by: SortBy.DATE_ADDED,
            order: SortOrder.ASC,
            icon: 'history',
            label: 'Date added (Oldest first)',
        },
        {
            by: SortBy.NAME,
            order: SortOrder.ASC,
            icon: 'sort_by_alpha',
            label: 'Name (A-Z)',
        },
        {
            by: SortBy.NAME,
            order: SortOrder.DESC,
            icon: 'sort_by_alpha',
            label: 'Name (Z-A)',
        },
        {
            by: SortBy.CUSTOM,
            order: SortOrder.ASC,
            icon: 'drag_indicator',
            label: 'Custom order (Drag & Drop)',
        },
    ];

    private readonly currentSortOptions = toSignal(
        this.sortService.getSortOptions(),
        { requireSync: true }
    );

    readonly searchQuery = toSignal(
        this.route.queryParamMap.pipe(map((params) => params.get('q') ?? '')),
        { initialValue: '' }
    );
    readonly title = computed(() => {
        const filters = this.activeTypeFilters();

        if (filters.length === 1) {
            if (filters[0] === 'm3u') {
                return this.formatText('M3U Playlists');
            }
            if (filters[0] === 'xtream') {
                return this.formatText('Xtream Playlists');
            }
            if (filters[0] === 'stalker') {
                return this.formatText('Stalker Playlists');
            }
        }

        return this.formatText('All Playlists');
    });

    readonly visibleSourcesCount = computed(() => {
        const query = this.searchQuery().trim().toLowerCase();
        const filters = this.activeTypeFilters();
        const allPlaylists = this.playlists();

        return allPlaylists
            .filter((item) => {
                const isStalkerFilter =
                    !!item.macAddress && filters.includes('stalker');
                const isXtreamFilter =
                    !!item.username &&
                    !!item.password &&
                    !!item.serverUrl &&
                    filters.includes('xtream');
                const isM3uFilter =
                    !item.username &&
                    !item.password &&
                    !item.serverUrl &&
                    !item.macAddress &&
                    filters.includes('m3u');

                return isStalkerFilter || isXtreamFilter || isM3uFilter;
            })
            .filter((item) => (item.title || '').toLowerCase().includes(query))
            .length;
    });

    readonly subtitle = computed(() => {
        const count = this.visibleSourcesCount();
        if (count === 1) {
            return this.formatText('1 playlist');
        }

        return this.formatText('{{count}} playlists', {
            count,
        });
    });

    readonly activeSortLabel = computed(() => {
        const current = this.currentSortOptions();
        const match = this.sortOptions.find(
            (option) =>
                option.by === current.by && option.order === current.order
        );
        return this.formatText(match?.label ?? 'Date added (Newest first)');
    });

    onAddPlaylist(type?: WorkspacePlaylistType): void {
        this.workspaceActions.openAddPlaylistDialog(type);
    }

    isSortActive(option: SortOption): boolean {
        const current = this.currentSortOptions();
        return current.by === option.by && current.order === option.order;
    }

    setSortOption(option: SortOption): void {
        this.sortService.setSortOptions({
            by: option.by,
            order: option.order,
        });
    }

    private formatText(
        key: string,
        params?: Record<string, string | number>
    ): string {
        return interpolateText(key, params);
    }
}
