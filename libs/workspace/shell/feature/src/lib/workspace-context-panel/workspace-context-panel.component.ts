import {
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
    viewChild,
    ElementRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { StalkerStore } from '@iptvnator/portal/stalker/data-access';
import {
    PortalCategorySortMode,
    persistPortalCategorySortMode,
    restorePortalCategorySortMode,
    sortPortalCategoryItems,
} from '@iptvnator/portal/shared/util';
import { XtreamStore } from '@iptvnator/portal/xtream/data-access';
import { WorkspaceContextCategoryViewComponent } from './components/workspace-context-category-view.component';
import { WorkspaceContextErrorViewComponent } from './components/workspace-context-error-view.component';
import { hasActiveLiveCategoryRoute } from './workspace-context-panel-route.utils';

type WorkspaceProvider = 'xtreams' | 'stalker' | 'playlists';

interface WorkspaceContextRoute {
    provider: WorkspaceProvider;
    playlistId: string;
}

interface XtreamCategoryLike {
    id?: number | string;
    category_id?: number | string;
}

interface WorkspaceCategoryLike {
    readonly category_id?: string | number;
    readonly category_name?: string;
    readonly id?: string | number;
    readonly name?: string;
}

@Component({
    selector: 'app-workspace-context-panel',
    imports: [
        MatIconButton,
        MatIcon,
        MatMenuModule,
        MatTooltip,
        WorkspaceContextCategoryViewComponent,
        WorkspaceContextErrorViewComponent,
    ],
    templateUrl: './workspace-context-panel.component.html',
    styleUrl: './workspace-context-panel.component.scss',
})
export class WorkspaceContextPanelComponent {
    private readonly router = inject(Router);
    private readonly xtreamStore = inject(XtreamStore);
    private readonly stalkerStore = inject(StalkerStore);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    readonly context = input.required<WorkspaceContextRoute>();
    readonly section = input.required<string>();

    readonly isXtreamCategories = computed(
        () =>
            this.context().provider === 'xtreams' &&
            (this.section() === 'vod' ||
                this.section() === 'series' ||
                this.section() === 'live')
    );
    readonly isStalkerCategories = computed(
        () =>
            this.context().provider === 'stalker' &&
            (this.section() === 'vod' ||
                this.section() === 'series' ||
                this.section() === 'itv' ||
                this.section() === 'radio')
    );

    readonly xtreamCategories = this.xtreamStore.getCategoriesBySelectedType;
    readonly xtreamCategoryItemCounts = this.xtreamStore.getCategoryItemCounts;
    readonly xtreamSelectedCategoryId = this.xtreamStore.selectedCategoryId;
    readonly xtreamSelectedTypeContentState =
        this.xtreamStore.selectedTypeContentState;
    readonly xtreamSelectedTypeContentReady =
        this.xtreamStore.selectedTypeContentReady;
    readonly xtreamSelectedTypeCountsReady =
        this.xtreamStore.selectedTypeCountsReady;
    readonly isXtreamImporting = this.xtreamStore.isImporting;
    readonly xtreamImportPhase = this.xtreamStore.currentImportPhase;
    readonly isXtreamCategoryLoading = computed(
        () =>
            this.isXtreamCategories() &&
            this.xtreamStore.isLoadingCategories() &&
            this.xtreamCategories().length === 0
    );
    readonly isXtreamCategoryInteractionEnabled = computed(
        () =>
            !this.isXtreamCategoryLoading() &&
            this.xtreamSelectedTypeContentReady()
    );
    readonly xtreamCountDisplayMode = computed<'loading' | 'ready'>(() =>
        this.isXtreamCategoryInteractionEnabled() ? 'ready' : 'loading'
    );
    readonly canManageXtreamCategories = computed(
        () => this.isXtreamCategories() && this.xtreamSelectedTypeCountsReady()
    );
    readonly xtreamStatusText = computed(() => {
        if (
            !this.isXtreamCategories() ||
            this.isXtreamCategoryLoading() ||
            !this.isXtreamImporting() ||
            this.xtreamSelectedTypeContentState() !== 'loading'
        ) {
            return '';
        }

        const syncLabel = this.getXtreamSyncLabelKey(this.section());
        const phaseKey = this.getXtreamImportPhaseLabelKey(
            this.xtreamImportPhase()
        );
        const phaseLabel = phaseKey ? phaseKey : '';

        return phaseLabel ? `${syncLabel} ${phaseLabel}` : syncLabel;
    });

    readonly stalkerCategories = this.stalkerStore.getCategoryResource;
    readonly stalkerSelectedCategoryId = this.stalkerStore.selectedCategoryId;
    readonly isStalkerCategoryLoading =
        this.stalkerStore.isCategoryResourceLoading;
    readonly isStalkerCategoryFailed =
        this.stalkerStore.isCategoryResourceFailed;
    readonly skeletonRows = Array.from({ length: 14 }, (_, index) => index);
    readonly skeletonLabelWidths = [
        78, 66, 74, 59, 83, 69, 76, 62, 81, 64, 72, 67, 79, 61,
    ];

    readonly searchInput =
        viewChild<ElementRef<HTMLInputElement>>('searchInput');
    readonly isSearchOpen = signal(false);
    readonly categorySearchTerm = signal('');
    readonly categorySortMode = signal<PortalCategorySortMode>(
        restorePortalCategorySortMode()
    );
    readonly categorySortLabelKey = computed(() =>
        this.getCategorySortLabelKey(this.categorySortMode())
    );
    readonly categorySortOptions: ReadonlyArray<{
        mode: PortalCategorySortMode;
        label: string;
        icon: string;
    }> = [
        {
            mode: 'server',
            label: 'Server sorting',
            icon: 'dns',
        },
        {
            mode: 'name-asc',
            label: 'Name A-Z',
            icon: 'sort_by_alpha',
        },
        {
            mode: 'name-desc',
            label: 'Name Z-A',
            icon: 'arrow_downward',
        },
    ];
    readonly categorySortIcon = computed(
        () =>
            this.categorySortOptions.find(
                (option) => option.mode === this.categorySortMode()
            )?.icon ?? 'dns'
    );

    readonly canSearchCategories = computed(
        () =>
            (this.isXtreamCategories() && this.xtreamCategories().length > 0) ||
            (this.isStalkerCategories() && this.stalkerCategories().length > 0)
    );

    /** Total live channel count across all categories (for the ALL entry). */
    readonly totalLiveChannelCount = computed(() => {
        let total = 0;
        for (const count of this.xtreamCategoryItemCounts().values()) {
            total += count;
        }
        return total;
    });

    /**
     * Selected-category id for highlighting. On Live TV, the "no category"
     * (null) selection maps to the synthetic ALL entry so it reads as selected
     * by default.
     */
    readonly xtreamDisplaySelectedCategoryId = computed<string | number | null>(
        () => {
            const selected = this.xtreamSelectedCategoryId();
            if (this.section() === 'live' && selected == null) {
                return '*';
            }
            return selected;
        }
    );

    readonly filteredXtreamCategories = computed(() => {
        const cats = this.xtreamCategories();
        // On Live TV, surface a synthetic "ALL" category (mirrors the Stalker
        // "*" pattern). It maps to the no-category selection — which already
        // renders every live channel — and is pinned first by the sort below.
        const withAll =
            this.section() === 'live'
                ? [
                      {
                          category_id: '*',
                          category_name: 'ALL',
                          count: this.totalLiveChannelCount(),
                      } as (typeof cats)[number],
                      ...cats,
                  ]
                : cats;
        const term = this.categorySearchTerm().trim().toLowerCase();
        const filtered = term
            ? withAll.filter((category) =>
                  this.getCategoryLabel(category).toLowerCase().includes(term)
              )
            : withAll;

        return sortPortalCategoryItems(
            filtered,
            this.categorySortMode(),
            (category) => this.getCategoryLabel(category),
            (category) => this.isAllCategory(category)
        );
    });

    readonly filteredStalkerCategories = computed(() => {
        const cats = this.stalkerCategories();
        const term = this.categorySearchTerm().trim().toLowerCase();
        const filtered = term
            ? cats.filter((category) =>
                  this.getCategoryLabel(category).toLowerCase().includes(term)
              )
            : cats;

        return sortPortalCategoryItems(
            filtered,
            this.categorySortMode(),
            (category) => this.getCategoryLabel(category),
            (category) => this.isAllCategory(category)
        );
    });

    readonly title = computed(() => {
        if (this.isXtreamCategories()) {
            if (this.section() === 'vod') {
                return 'Movie Categories';
            }
            if (this.section() === 'series') {
                return 'Series Categories';
            }
            return 'Live Categories';
        }

        if (this.isStalkerCategories()) {
            if (this.section() === 'vod') {
                return 'Movie Categories';
            }
            if (this.section() === 'series') {
                return 'Series Categories';
            }
            if (this.section() === 'radio') {
                return 'Radio Categories';
            }
            return 'Live Categories';
        }

        return 'Categories';
    });

    readonly subtitle = computed(() => {
        if (this.isXtreamCategories()) {
            return 'Xtream source';
        }
        if (this.isStalkerCategories()) {
            return 'Stalker portal';
        }
        return '';
    });

    constructor() {
        effect(() => {
            if (this.isSearchOpen()) {
                queueMicrotask(() => {
                    this.searchInput()?.nativeElement.focus();
                });
            }
        });
    }

    toggleCategorySearch(): void {
        const opening = !this.isSearchOpen();
        this.isSearchOpen.set(opening);
        if (!opening) {
            this.categorySearchTerm.set('');
        }
    }

    onSearchInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.categorySearchTerm.set(value);
    }

    clearCategorySearch(): void {
        this.categorySearchTerm.set('');
        this.searchInput()?.nativeElement.focus();
    }

    setCategorySortMode(mode: PortalCategorySortMode): void {
        this.categorySortMode.set(mode);
        persistPortalCategorySortMode(mode);
    }

    openManageCategories(): void {
        if (!this.canManageXtreamCategories()) {
            return;
        }

        const context = this.context();
        const section = this.section();
        const contentType =
            section === 'series'
                ? 'series'
                : section === 'live'
                  ? 'live'
                  : 'vod';

        void import('@iptvnator/portal/xtream/feature').then(
            ({ CategoryManagementDialogComponent }) => {
                const dialogRef = this.dialog.open(
                    CategoryManagementDialogComponent,
                    {
                        data: {
                            playlistId: context.playlistId,
                            contentType,
                            itemCounts:
                                this.xtreamStore.getCategoryItemCounts(),
                        },
                        width: '500px',
                        maxHeight: '90vh',
                    }
                );

                dialogRef
                    .afterClosed()
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe((result) => {
                        if (result) {
                            this.xtreamStore.reloadCategories();
                        }
                    });
            }
        );
    }

    onXtreamCategoryClicked(category: XtreamCategoryLike): void {
        if (!this.isXtreamCategoryInteractionEnabled()) {
            return;
        }

        const context = this.context();
        const section = this.section();
        const rawCategoryId = category.category_id ?? category.id;
        if (rawCategoryId === undefined || rawCategoryId === null) {
            return;
        }

        // Synthetic "ALL" entry (Live TV): clear the category selection so the
        // view renders every live channel, and drop back to the live root URL.
        if (section === 'live' && String(rawCategoryId) === '*') {
            this.xtreamStore.setSelectedCategory(null);
            if (
                hasActiveLiveCategoryRoute(
                    this.router.routerState.snapshot.root
                )
            ) {
                void this.router.navigate(
                    ['/workspace', 'xtreams', context.playlistId, 'live'],
                    {
                        queryParamsHandling: 'preserve',
                        replaceUrl: true,
                    }
                );
            }
            return;
        }

        const numericCategoryId = Number(rawCategoryId);
        if (Number.isNaN(numericCategoryId)) {
            return;
        }
        const categoryId = numericCategoryId;

        if (section === 'live') {
            this.xtreamStore.setSelectedCategory(categoryId);
            const liveRouteHasCategory = hasActiveLiveCategoryRoute(
                this.router.routerState.snapshot.root
            );
            if (liveRouteHasCategory) {
                void this.router.navigate(
                    [
                        '/workspace',
                        'xtreams',
                        context.playlistId,
                        'live',
                        categoryId,
                    ],
                    {
                        queryParamsHandling: 'preserve',
                        replaceUrl: true,
                    }
                );
            }
            return;
        }

        this.xtreamStore.setSelectedItem(null);
        this.xtreamStore.setSelectedCategory(categoryId);
        this.router.navigate([
            '/workspace',
            'xtreams',
            context.playlistId,
            section,
            categoryId,
        ]);
    }

    onStalkerCategoryClicked(item: { category_id?: string | number }): void {
        const context = this.context();
        const section = this.section();
        const categoryId = String(item.category_id ?? '*');

        this.stalkerStore.setSelectedCategory(categoryId);
        this.stalkerStore.setPage(0);
        this.stalkerStore.clearSelectedItem();

        if (section === 'itv' || section === 'radio') {
            return;
        }

        if (categoryId === '*') {
            this.router.navigate([
                '/workspace',
                'stalker',
                context.playlistId,
                section,
            ]);
            return;
        }

        this.router.navigate([
            '/workspace',
            'stalker',
            context.playlistId,
            section,
            categoryId,
        ]);
    }

    private getXtreamSyncLabelKey(section: string): string {
        switch (section) {
            case 'live':
                return 'Syncing live categories...';
            case 'series':
                return 'Syncing series categories...';
            case 'vod':
            default:
                return 'Syncing movie categories...';
        }
    }

    private getXtreamImportPhaseLabelKey(phase: string | null): string {
        switch (phase) {
            case 'preparing-content':
                return 'Preparing local library...';
            case 'loading-categories':
            case 'loading-live':
            case 'loading-movies':
            case 'loading-series':
                return 'Fetching playlist data from source...';
            case 'saving-categories':
            case 'saving-content':
                return 'Saving playlist data locally...';
            case 'restoring-favorites':
                return 'Restoring favorites from local library...';
            case 'restoring-recently-viewed':
                return 'Restoring recently viewed from local library...';
            default:
                return '';
        }
    }

    private getCategorySortLabelKey(mode: PortalCategorySortMode): string {
        switch (mode) {
            case 'name-asc':
                return 'Name A-Z';
            case 'name-desc':
                return 'Name Z-A';
            case 'server':
            default:
                return 'Server sorting';
        }
    }

    private getCategoryLabel(category: WorkspaceCategoryLike): string {
        return category.category_name ?? category.name ?? '';
    }

    private isAllCategory(category: WorkspaceCategoryLike): boolean {
        return String(category.category_id ?? category.id) === '*';
    }
}
