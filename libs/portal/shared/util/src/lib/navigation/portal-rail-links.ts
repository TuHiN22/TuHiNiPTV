export type PortalProvider = 'xtreams' | 'stalker' | 'playlists';
export type PortalRailSection =
    | 'all'
    | 'downloads'
    | 'favorites'
    | 'groups'
    | 'itv'
    | 'library'
    | 'live'
    | 'recent'
    | 'recently-added'
    | 'radio'
    | 'search'
    | 'series'
    | 'vod';

export interface PortalRailLink {
    icon: string;
    tooltip: string;
    path: (string | number)[];
    exact?: boolean;
    section?: PortalRailSection;
}

interface BuildPortalRailLinksOptions {
    provider: PortalProvider;
    playlistId: string;
    supportsDownloads: boolean;
    workspace: boolean;
    /**
     * Content types the playlist was imported with. When provided (non-empty),
     * primary section links for content types not in this list are hidden.
     * Undefined/empty means show all (backward compatible).
     */
    enabledContentTypes?: ReadonlyArray<'live' | 'vod' | 'series'>;
}

interface PortalRailLinkGroups {
    primary: PortalRailLink[];
    secondary: PortalRailLink[];
}

/** Maps a rail section to the import content type that governs its visibility. */
const SECTION_CONTENT_TYPE: Partial<
    Record<PortalRailSection, 'live' | 'vod' | 'series'>
> = {
    live: 'live',
    itv: 'live',
    vod: 'vod',
    series: 'series',
};

function filterRailLinksByContentTypes(
    links: PortalRailLink[],
    enabledContentTypes: ReadonlyArray<'live' | 'vod' | 'series'> | undefined
): PortalRailLink[] {
    if (!enabledContentTypes || enabledContentTypes.length === 0) {
        return links;
    }
    const enabled = new Set(enabledContentTypes);
    return links.filter((link) => {
        const governingType = link.section
            ? SECTION_CONTENT_TYPE[link.section]
            : undefined;
        return governingType === undefined || enabled.has(governingType);
    });
}

export function buildPortalRailLinks(
    options: BuildPortalRailLinksOptions
): PortalRailLinkGroups {
    const {
        provider,
        playlistId,
        supportsDownloads,
        workspace,
        enabledContentTypes,
    } = options;
    const root = workspace
        ? ['/workspace', provider, playlistId]
        : [`/${provider}`, playlistId];

    if (provider === 'xtreams') {
        const primary: PortalRailLink[] = [];
        const secondary: PortalRailLink[] = [];

        primary.push(
            {
                icon: 'movie',
                tooltip: 'Movies (this playlist)',
                path: [...root, 'vod'],
                section: 'vod',
            },
            {
                icon: 'live_tv',
                tooltip: 'Live TV (this playlist)',
                path: [...root, 'live'],
                section: 'live',
            },
            {
                icon: 'tv',
                tooltip: 'Series (this playlist)',
                path: [...root, 'series'],
                section: 'series',
            }
        );

        secondary.push(
            {
                icon: 'new_releases',
                tooltip: 'Recently added (this playlist)',
                path: [...root, 'recently-added'],
                section: 'recently-added',
            },
            {
                icon: 'search',
                tooltip: 'Search (this playlist)',
                path: [...root, 'search'],
                section: 'search',
            }
        );

        if (supportsDownloads) {
            secondary.push({
                icon: 'download',
                tooltip: 'Downloads (this playlist)',
                path: [...root, 'downloads'],
                section: 'downloads',
            });
        }

        return {
            primary: filterRailLinksByContentTypes(
                primary,
                enabledContentTypes
            ),
            secondary,
        };
    }

    if (provider === 'stalker') {
        const primary: PortalRailLink[] = [
            {
                icon: 'movie',
                tooltip: 'Movies (this playlist)',
                path: [...root, 'vod'],
                section: 'vod',
            },
            {
                icon: 'live_tv',
                tooltip: 'Live TV (this playlist)',
                path: [...root, 'itv'],
                section: 'itv',
            },
            {
                icon: 'radio',
                tooltip: 'Radio (this playlist)',
                path: [...root, 'radio'],
                section: 'radio',
            },
            {
                icon: 'tv',
                tooltip: 'Series (this playlist)',
                path: [...root, 'series'],
                section: 'series',
            },
        ];

        const secondary: PortalRailLink[] = [
            {
                icon: 'search',
                tooltip: 'Search (this playlist)',
                path: [...root, 'search'],
                section: 'search',
            },
        ];

        if (supportsDownloads) {
            secondary.push({
                icon: 'download',
                tooltip: 'Downloads (this playlist)',
                path: [...root, 'downloads'],
                section: 'downloads',
            });
        }

        return {
            primary: filterRailLinksByContentTypes(
                primary,
                enabledContentTypes
            ),
            secondary,
        };
    }

    if (provider === 'playlists') {
        const primary: PortalRailLink[] = [
            {
                icon: 'tv',
                tooltip: 'All channels (this playlist)',
                path: [...root, 'all'],
                exact: true,
                section: 'all',
            },
            {
                icon: 'folder',
                tooltip: 'Groups (this playlist)',
                path: [...root, 'groups'],
                exact: true,
                section: 'groups',
            },
        ];

        return {
            primary,
            secondary: [],
        };
    }

    return { primary: [], secondary: [] };
}
