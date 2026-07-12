import { PortalRailSection } from '@iptvnator/portal/shared/util';

export const SEARCH_INPUT_DEBOUNCE_MS = 350;

export const SEARCH_PLAYLIST_PLACEHOLDER = 'Search in this playlist...';
export const SEARCH_SECTION_PLACEHOLDER = 'Search in this section...';
export const FILTER_SECTION_PLACEHOLDER = 'Filter this section...';
export const SEARCH_SOURCES_PLACEHOLDER = 'Search sources (all playlists)...';
export const SEARCH_LOADED_ONLY_STATUS = 'Loaded channels only';

export const CLEAR_RECENTLY_VIEWED_TOOLTIP = 'Clear recently viewed';
export const CLEAR_RECENTLY_VIEWED_ARIA =
    'Clear recently viewed for this section';

export const RAIL_TOOLTIP_KEYS: Readonly<
    Partial<Record<PortalRailSection, string>>
> = {
    vod: 'Movies',
    live: 'Live TV',
    itv: 'Live TV',
    radio: 'Radio',
    series: 'Series',
    'recently-added': 'Recently added',
    search: 'Advanced search',
    recent: 'Recently viewed',
    favorites: 'Favorites',
    downloads: 'Downloads',
    all: 'All channels',
    groups: 'Groups',
};

export type XtreamImportPhaseTone = 'remote' | 'local' | null;

export interface WorkspaceHeaderBulkAction {
    icon: string;
    tooltip: string;
    ariaLabel: string;
    disabled: boolean;
}
