import { computed, inject, Injectable } from '@angular/core';
import { PlaylistRefreshActionService } from '@iptvnator/playlist/shared/ui';
import { XtreamStore } from '@iptvnator/portal/xtream/data-access';
import { interpolateText } from '@iptvnator/portal/shared/util';
import { RuntimeCapabilitiesService } from '@iptvnator/services';
import type { XtreamImportPhaseTone } from './helpers/workspace-shell-constants';
import {
    buildXtreamImportDetailLabel,
    buildXtreamImportPhaseLabel,
    buildXtreamImportPhaseTone,
    buildXtreamImportProgressLabel,
    buildXtreamImportSourceLabel,
    buildXtreamImportTypeLabel,
    buildXtreamRefreshPreparationPhaseLabel,
    buildXtreamRefreshPreparationProgressLabel,
    formatEnglishNumber,
} from './helpers/workspace-shell-import-labels';
import { WorkspaceShellRouteStateService } from './workspace-shell-route-state.service';

@Injectable()
export class WorkspaceShellXtreamImportService {
    private readonly xtreamStore = inject(XtreamStore);
    private readonly playlistRefreshAction = inject(
        PlaylistRefreshActionService
    );
    private readonly runtime = inject(RuntimeCapabilitiesService);
    private readonly routeState = inject(WorkspaceShellRouteStateService);

    private get isElectron(): boolean {
        return this.runtime.isElectron;
    }

    private readonly formatText = (
        key: string,
        params?: Record<string, string | number>
    ): string => interpolateText(key, params);

    readonly xtreamImportCount = this.xtreamStore.getImportCount;
    readonly xtreamItemsToImport = this.xtreamStore.itemsToImport;
    readonly refreshPreparation = this.playlistRefreshAction.refreshPreparation;
    readonly activeRefreshPreparation = computed(
        () => this.refreshPreparation() ?? null
    );
    readonly xtreamActiveImportCount = computed(() => {
        const preparation = this.activeRefreshPreparation();
        return preparation
            ? (preparation.current ?? 0)
            : this.xtreamStore.activeImportCurrentCount();
    });
    readonly xtreamActiveItemsToImport = computed(() => {
        const preparation = this.activeRefreshPreparation();
        return preparation
            ? (preparation.total ?? 0)
            : this.xtreamStore.activeImportTotalCount();
    });
    readonly xtreamImportPhase = this.xtreamStore.currentImportPhase;
    readonly isCancellingXtreamImport = this.xtreamStore.isCancellingImport;

    readonly canCancelXtreamImport = computed(
        () =>
            this.isElectron &&
            this.xtreamStore.isImporting() &&
            Boolean(this.xtreamStore.activeImportSessionId()) &&
            !this.xtreamStore.isCancellingImport()
    );
    readonly showXtreamImportOverlay = computed(() => {
        const route = this.routeState.currentRoute();
        const context = this.routeState.currentContext();
        const section = this.routeState.currentSection();
        const hasRefreshPreparation = Boolean(this.refreshPreparation());

        if (route.kind === 'dashboard') {
            return hasRefreshPreparation;
        }

        if (context?.provider !== 'xtreams') {
            return false;
        }

        const isPreparingCurrentPlaylist =
            this.isRefreshPreparationRunningForPlaylist(context.playlistId);

        return (
            (this.isImportRunning() || isPreparingCurrentPlaylist) &&
            (section === 'vod' ||
                section === 'live' ||
                section === 'series' ||
                section === 'search' ||
                section === 'recently-added')
        );
    });

    readonly xtreamImportTitleLabel = computed(() => {
        if (this.activeRefreshPreparation()) {
            return this.formatText('Refreshing playlist');
        }

        return this.formatText('Syncing playlist');
    });

    readonly xtreamImportTypeLabel = computed(() => {
        return buildXtreamImportTypeLabel(
            this.xtreamStore.activeImportContentType(),
            this.formatText
        );
    });

    readonly xtreamImportProgressLabel = computed(() => {
        const formatNumber = (value: number): string =>
            formatEnglishNumber(value);
        const preparation = this.activeRefreshPreparation();

        if (preparation) {
            return buildXtreamRefreshPreparationProgressLabel(
                this.xtreamActiveImportCount(),
                this.xtreamActiveItemsToImport(),
                this.formatText,
                formatNumber
            );
        }

        return buildXtreamImportProgressLabel(
            this.xtreamImportTypeLabel(),
            this.xtreamActiveImportCount(),
            this.xtreamActiveItemsToImport(),
            this.formatText,
            formatNumber
        );
    });

    readonly xtreamImportPhaseTone = computed<XtreamImportPhaseTone>(() => {
        if (this.activeRefreshPreparation()) {
            return 'local';
        }

        return buildXtreamImportPhaseTone(
            this.xtreamStore.currentImportPhase()
        );
    });

    readonly xtreamImportSourceLabel = computed(() => {
        return buildXtreamImportSourceLabel(
            this.xtreamImportPhaseTone(),
            this.formatText
        );
    });

    readonly xtreamImportPhaseLabel = computed(() => {
        const preparation = this.activeRefreshPreparation();

        if (preparation) {
            return buildXtreamRefreshPreparationPhaseLabel(
                preparation.phase,
                this.formatText
            );
        }

        return buildXtreamImportPhaseLabel(
            this.xtreamStore.currentImportPhase(),
            this.formatText
        );
    });

    readonly xtreamImportDetailLabel = computed(() => {
        if (this.activeRefreshPreparation()) {
            return this.formatText(
                'Keeping favorites, watch history, hidden categories, and playback progress ready for restore after sync.'
            );
        }

        return buildXtreamImportDetailLabel(
            this.xtreamImportPhaseTone(),
            this.formatText
        );
    });

    readonly isImportRunning = computed(
        () =>
            !this.xtreamStore.contentInitBlockReason() &&
            this.xtreamStore.isImporting()
    );
    readonly isRefreshPreparationRunning = computed(() =>
        Boolean(this.activeRefreshPreparation())
    );

    isRefreshPreparationRunningForPlaylist(playlistId: string): boolean {
        return this.refreshPreparation()?.playlistId === playlistId;
    }

    cancelXtreamImport(): void {
        void this.xtreamStore.cancelImport();
    }
}
