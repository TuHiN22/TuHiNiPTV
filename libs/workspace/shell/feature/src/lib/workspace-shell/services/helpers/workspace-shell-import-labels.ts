import type { XtreamImportPhaseTone } from './workspace-shell-constants';
import type { TextFormatter } from './workspace-shell-search-labels';

export type XtreamImportContentType = 'live' | 'vod' | 'series' | null;
export type XtreamRefreshPreparationPhase =
    | 'collecting-user-data'
    | 'deleting-content'
    | 'deleting-categories'
    | string
    | null
    | undefined;

export function buildXtreamImportTypeLabel(
    contentType: XtreamImportContentType,
    formatText: TextFormatter
): string {
    switch (contentType) {
        case 'live':
            return formatText('Live TV');
        case 'vod':
            return formatText('Movies');
        case 'series':
            return formatText('Series');
        default:
            return '';
    }
}

export function buildXtreamImportPhaseTone(
    phase: string | null | undefined
): XtreamImportPhaseTone {
    switch (phase) {
        case 'loading-categories':
        case 'loading-live':
        case 'loading-movies':
        case 'loading-series':
            return 'remote';
        case 'preparing-content':
        case 'saving-categories':
        case 'saving-content':
        case 'restoring-favorites':
        case 'restoring-recently-viewed':
            return 'local';
        default:
            return null;
    }
}

export function buildXtreamRefreshPreparationPhaseLabel(
    phase: XtreamRefreshPreparationPhase,
    formatText: TextFormatter
): string {
    switch (phase) {
        case 'collecting-user-data':
            return formatText('Preserving your library data...');
        case 'deleting-content':
            return formatText('Removing cached streams...');
        case 'deleting-categories':
            return formatText('Removing cached categories...');
        default:
            return formatText('Preserving your library data...');
    }
}

export function buildXtreamImportSourceLabel(
    tone: XtreamImportPhaseTone,
    formatText: TextFormatter
): string {
    if (tone === 'remote') {
        return formatText('Remote source');
    }
    if (tone === 'local') {
        return formatText('Local library');
    }
    return '';
}

export function buildXtreamImportPhaseLabel(
    phase: string | null | undefined,
    formatText: TextFormatter
): string {
    switch (phase) {
        case 'preparing-content':
            return formatText('Preparing local library...');
        case 'loading-categories':
        case 'loading-live':
        case 'loading-movies':
        case 'loading-series':
            return formatText('Fetching playlist data from source...');
        case 'saving-categories':
        case 'saving-content':
            return formatText('Saving playlist data locally...');
        case 'restoring-favorites':
            return formatText('Restoring favorites from local library...');
        case 'restoring-recently-viewed':
            return formatText(
                'Restoring recently viewed from local library...'
            );
        default:
            return '';
    }
}

export function buildXtreamImportDetailLabel(
    tone: XtreamImportPhaseTone,
    formatText: TextFormatter
): string {
    if (tone === 'remote') {
        return formatText('Waiting on the provider response.');
    }
    if (tone === 'local') {
        return formatText(
            'Preparing faster playlist switching for the next visit.'
        );
    }
    return '';
}

export function buildXtreamImportProgressLabel(
    typeLabel: string,
    currentCount: number,
    totalCount: number,
    formatText: TextFormatter,
    formatNumber: (value: number) => string
): string {
    if (!typeLabel || totalCount === 0) {
        return '';
    }

    return formatText('{{type}} imported: {{current}} / {{total}}', {
        type: typeLabel,
        current: formatNumber(currentCount),
        total: formatNumber(totalCount),
    });
}

export function buildXtreamRefreshPreparationProgressLabel(
    currentCount: number,
    totalCount: number,
    formatText: TextFormatter,
    formatNumber: (value: number) => string
): string {
    if (totalCount === 0) {
        return '';
    }

    return formatText('Local records processed: {{current}} / {{total}}', {
        current: formatNumber(currentCount),
        total: formatNumber(totalCount),
    });
}

export function formatEnglishNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}
