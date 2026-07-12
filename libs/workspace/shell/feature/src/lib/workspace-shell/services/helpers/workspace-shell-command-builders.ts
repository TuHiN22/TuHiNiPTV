import { Router } from '@angular/router';
import {
    PortalRailSection,
    WorkspaceCommandContribution,
    WorkspaceResolvedCommandItem,
} from '@iptvnator/portal/shared/util';
import {
    WorkspacePortalContext,
    WorkspaceShellRoute,
} from '@iptvnator/workspace/shell/util';
import { TextFormatter } from './workspace-shell-search-labels';

export interface CommandBuilderActions {
    openPlaylistSearch: (query: string) => void;
    refreshCurrentPlaylist: () => void;
    openPlaylistInfo: () => void;
    openAccountInfo: () => void;
    openGlobalSearch: (query: string) => void;
    navigateToGlobalFavorites: () => void;
    openGlobalRecent: () => void;
    openDownloadsShortcut: () => void;
    openAddPlaylistDialog: (kind?: 'url' | 'xtream' | 'stalker') => void;
}

export interface CommandBuilderContext {
    route: WorkspaceShellRoute;
    context: WorkspacePortalContext | null;
    section: PortalRailSection | null;
    hasActivePlaylist: boolean;
    hasSearchablePlaylists: boolean;
    canRefreshPlaylist: boolean;
    supportsDownloads: boolean;
    showDashboard: boolean;
    formatText: TextFormatter;
    router: Router;
    actions: CommandBuilderActions;
}

export function buildCommandPaletteItems(
    ctx: CommandBuilderContext,
    viewCommands: readonly WorkspaceCommandContribution[]
): WorkspaceResolvedCommandItem[] {
    return [
        ...getViewCommandDefinitions(ctx),
        ...getPlaylistCommandDefinitions(ctx),
        ...getGlobalCommandDefinitions(ctx),
        ...viewCommands,
    ]
        .map((command) => resolveCommand(command, ctx.formatText))
        .filter((command) => command.visible)
        .sort(comparePaletteCommands);
}

export function getViewCommandDefinitions(
    ctx: CommandBuilderContext
): WorkspaceCommandContribution[] {
    const { context, section } = ctx;

    if (!context || !section) {
        return [];
    }

    if (context.provider === 'playlists') {
        return getM3uNavigationCommands(ctx, context, section);
    }

    if (context.provider === 'xtreams' || context.provider === 'stalker') {
        return getPortalNavigationCommands(ctx, context, section);
    }

    return [];
}

export function getPlaylistCommandDefinitions(
    ctx: CommandBuilderContext
): WorkspaceCommandContribution[] {
    const { context } = ctx.route;

    if (
        !context ||
        (context.provider !== 'xtreams' &&
            context.provider !== 'stalker' &&
            context.provider !== 'playlists')
    ) {
        return [];
    }

    const canOpenPlaylistSearch =
        context.provider === 'xtreams' || context.provider === 'stalker';

    return [
        {
            id: 'playlist-search',
            group: 'playlist',
            icon: 'playlist_play',
            labelKey: 'Advanced search this playlist',
            descriptionKey: 'Open advanced playlist search',
            priority: 10,
            visible: canOpenPlaylistSearch,
            run: ({ query }) => ctx.actions.openPlaylistSearch(query),
        },
        {
            id: 'refresh-playlist',
            group: 'playlist',
            icon: 'sync',
            labelKey: 'Refresh playlist',
            descriptionKey: 'Re-sync data from remote source',
            priority: 20,
            visible: ctx.canRefreshPlaylist,
            run: () => ctx.actions.refreshCurrentPlaylist(),
        },
        {
            id: 'playlist-info',
            group: 'playlist',
            icon: 'info',
            labelKey: 'Playlist details',
            descriptionKey: 'Show current playlist information',
            priority: 30,
            visible: ctx.hasActivePlaylist,
            run: () => ctx.actions.openPlaylistInfo(),
        },
        {
            id: 'account-info',
            group: 'playlist',
            icon: 'account_circle',
            labelKey: 'Account info',
            descriptionKey: 'Show Xtream server account details',
            priority: 40,
            visible: context.provider === 'xtreams',
            run: () => ctx.actions.openAccountInfo(),
        },
    ];
}

export function getGlobalCommandDefinitions(
    ctx: CommandBuilderContext
): WorkspaceCommandContribution[] {
    const {
        route,
        hasSearchablePlaylists,
        supportsDownloads,
        showDashboard,
        actions,
    } = ctx;

    return [
        {
            id: 'global-search',
            group: 'global',
            icon: 'search',
            labelKey: 'Search all playlists',
            descriptionKey: 'Open global search',
            priority: 10,
            visible: hasSearchablePlaylists && route.kind !== 'global-search',
            keywords: ['xtream', 'm3u', 'live'],
            run: ({ query }) => actions.openGlobalSearch(query),
        },
        {
            id: 'open-global-favorites',
            group: 'global',
            icon: 'star',
            labelKey: 'Open global favorites',
            descriptionKey: 'Navigate to aggregated favorites',
            priority: 20,
            visible: route.kind !== 'global-favorites',
            run: () => actions.navigateToGlobalFavorites(),
        },
        {
            id: 'open-global-recent',
            group: 'global',
            icon: 'history',
            labelKey: 'Open recently viewed',
            descriptionKey: 'Open global recently viewed page',
            priority: 30,
            visible: route.kind !== 'global-recent',
            run: () => actions.openGlobalRecent(),
        },
        {
            id: 'open-downloads',
            group: 'global',
            icon: 'download',
            labelKey: 'Open downloads',
            descriptionKey: 'Navigate to downloads view',
            priority: 40,
            visible: supportsDownloads && route.kind !== 'downloads',
            run: () => actions.openDownloadsShortcut(),
        },
        {
            id: 'open-settings',
            group: 'global',
            icon: 'settings',
            labelKey: 'Open settings',
            descriptionKey: 'Navigate to application settings',
            priority: 50,
            visible: route.kind !== 'settings',
            run: () => {
                void ctx.router.navigate(['/workspace', 'settings']);
            },
        },
        {
            id: 'open-sources',
            group: 'global',
            icon: 'library_books',
            labelKey: 'Manage sources',
            descriptionKey: 'Navigate to source management',
            priority: 60,
            visible: route.kind !== 'sources',
            run: () => {
                void ctx.router.navigate(['/workspace', 'sources']);
            },
        },
        {
            id: 'open-dashboard',
            group: 'global',
            icon: 'dashboard',
            labelKey: 'Open dashboard',
            descriptionKey: 'Navigate to the dashboard',
            priority: 70,
            visible: showDashboard && route.kind !== 'dashboard',
            run: () => {
                void ctx.router.navigate(['/workspace', 'dashboard']);
            },
        },
        {
            id: 'add-playlist',
            group: 'global',
            icon: 'add_circle_outline',
            labelKey: 'Add new source',
            descriptionKey: 'Open add playlist dialog',
            priority: 80,
            run: () => actions.openAddPlaylistDialog(),
        },
        {
            id: 'add-playlist-m3u',
            group: 'global',
            icon: 'folder_open',
            labelKey: 'Add M3U playlist',
            descriptionKey: 'Open add dialog on the M3U file or URL tab',
            keywords: ['m3u', 'm3u8', 'file', 'url', 'add', 'import'],
            priority: 79,
            run: () => actions.openAddPlaylistDialog('url'),
        },
        {
            id: 'add-playlist-xtream',
            group: 'global',
            icon: 'cloud',
            labelKey: 'Add Xtream Codes playlist',
            descriptionKey: 'Open add dialog on the Xtream Codes tab',
            keywords: ['xtream', 'codes', 'iptv', 'add', 'import'],
            priority: 78,
            run: () => actions.openAddPlaylistDialog('xtream'),
        },
        {
            id: 'add-playlist-stalker',
            group: 'global',
            icon: 'cast',
            labelKey: 'Add Stalker portal',
            descriptionKey: 'Open add dialog on the Stalker Portal tab',
            keywords: ['stalker', 'portal', 'mac', 'ministra', 'add'],
            priority: 77,
            run: () => actions.openAddPlaylistDialog('stalker'),
        },
    ];
}

function getPortalNavigationCommands(
    ctx: CommandBuilderContext,
    context: WorkspacePortalContext,
    section: PortalRailSection
): WorkspaceCommandContribution[] {
    const liveSection = context.provider === 'stalker' ? 'itv' : 'live';
    const radioCommand =
        context.provider === 'stalker'
            ? createNavigationCommand(ctx, {
                  id: 'go-to-radio',
                  context,
                  targetSection: 'radio',
                  currentSection: section,
                  icon: 'radio',
                  labelKey: 'Radio',
                  priority: 115,
              })
            : null;

    return [
        createNavigationCommand(ctx, {
            id: 'go-to-vod',
            context,
            targetSection: 'vod',
            currentSection: section,
            icon: 'movie',
            labelKey: 'Movies',
            priority: 100,
        }),
        createNavigationCommand(ctx, {
            id: 'go-to-live',
            context,
            targetSection: liveSection,
            currentSection: section,
            icon: 'live_tv',
            labelKey: 'Live TV',
            priority: 110,
        }),
        radioCommand,
        createNavigationCommand(ctx, {
            id: 'go-to-series',
            context,
            targetSection: 'series',
            currentSection: section,
            icon: 'video_library',
            labelKey: 'Series',
            priority: 120,
        }),
    ].filter(
        (command): command is WorkspaceCommandContribution => command !== null
    );
}

function getM3uNavigationCommands(
    ctx: CommandBuilderContext,
    context: WorkspacePortalContext,
    section: PortalRailSection
): WorkspaceCommandContribution[] {
    return [
        createNavigationCommand(ctx, {
            id: 'go-to-all',
            context,
            targetSection: 'all',
            currentSection: section,
            icon: 'format_list_bulleted',
            labelKey: 'All channels',
            priority: 100,
        }),
        createNavigationCommand(ctx, {
            id: 'go-to-groups',
            context,
            targetSection: 'groups',
            currentSection: section,
            icon: 'folder_open',
            labelKey: 'Groups',
            priority: 110,
        }),
        createNavigationCommand(ctx, {
            id: 'go-to-favorites',
            context,
            targetSection: 'favorites',
            currentSection: section,
            icon: 'star',
            labelKey: 'Favorites',
            priority: 120,
        }),
        createNavigationCommand(ctx, {
            id: 'go-to-recent',
            context,
            targetSection: 'recent',
            currentSection: section,
            icon: 'history',
            labelKey: 'Recently viewed',
            priority: 130,
        }),
    ].filter(
        (command): command is WorkspaceCommandContribution => command !== null
    );
}

function createNavigationCommand(
    ctx: CommandBuilderContext,
    config: {
        id: string;
        context: WorkspacePortalContext;
        targetSection: string;
        currentSection: PortalRailSection;
        icon: string;
        labelKey: string;
        priority: number;
    }
): WorkspaceCommandContribution | null {
    if (config.currentSection === config.targetSection) {
        return null;
    }

    return {
        id: config.id,
        group: 'view',
        icon: config.icon,
        labelKey: config.labelKey,
        descriptionKey: 'Navigate to {{view}}',
        descriptionParams: () => ({
            view: ctx.formatText(config.labelKey),
        }),
        priority: config.priority,
        run: () => {
            void ctx.router.navigate([
                '/workspace',
                config.context.provider,
                config.context.playlistId,
                config.targetSection,
            ]);
        },
    };
}

export function resolveCommand(
    command: WorkspaceCommandContribution,
    formatText: TextFormatter
): WorkspaceResolvedCommandItem {
    const labelParams = resolveCommandValue(command.labelParams);
    const descriptionParams = resolveCommandValue(command.descriptionParams);

    return {
        id: command.id,
        group: command.group,
        icon: command.icon,
        label: formatText(command.labelKey, labelParams),
        description: command.descriptionKey
            ? formatText(command.descriptionKey, descriptionParams)
            : '',
        keywords: resolveCommandValue(command.keywords) ?? [],
        priority: command.priority ?? 100,
        visible: resolveCommandValue(command.visible) ?? true,
        enabled: resolveCommandValue(command.enabled) ?? true,
        run: command.run,
    };
}

export function comparePaletteCommands(
    left: WorkspaceResolvedCommandItem,
    right: WorkspaceResolvedCommandItem
): number {
    const groupOrder =
        getCommandGroupOrder(left.group) - getCommandGroupOrder(right.group);

    if (groupOrder !== 0) {
        return groupOrder;
    }

    if (left.priority !== right.priority) {
        return left.priority - right.priority;
    }

    return left.label.localeCompare(right.label);
}

export function getCommandGroupOrder(
    group: WorkspaceResolvedCommandItem['group']
): number {
    switch (group) {
        case 'view':
            return 0;
        case 'playlist':
            return 1;
        default:
            return 2;
    }
}

export function resolveCommandValue<T>(
    value: T | (() => T | undefined) | undefined
): T | undefined {
    if (typeof value === 'function') {
        return (value as () => T | undefined)();
    }

    return value;
}
