import {
    PortalRailLink,
    PortalRailSection,
} from '@iptvnator/portal/shared/util';
import {
    WorkspacePortalContext,
    WorkspaceShellPageKind,
} from '@iptvnator/workspace/shell/util';
import {
    FILTER_SECTION_PLACEHOLDER,
    RAIL_TOOLTIP_KEYS,
    SEARCH_PLAYLIST_PLACEHOLDER,
    SEARCH_SECTION_PLACEHOLDER,
    SEARCH_SOURCES_PLACEHOLDER,
} from './workspace-shell-constants';

export type TextFormatter = (
    key: string,
    params?: Record<string, string | number>
) => string;

export interface SearchScopeContext {
    kind: WorkspaceShellPageKind;
    context: WorkspacePortalContext | null;
    section: PortalRailSection | null;
    formatText: TextFormatter;
    xtreamCategory:
        | { category_name?: string; name?: string }
        | null
        | undefined;
    stalkerCategoryName: string;
}

export function getRailTooltipKey(
    provider: WorkspacePortalContext['provider'],
    section?: PortalRailSection
): string {
    if (provider === 'xtreams' && section === 'library') {
        return 'Library';
    }

    return (section ? RAIL_TOOLTIP_KEYS[section] : null) ?? 'Section actions';
}

export function formatRailSection(
    section: PortalRailSection,
    formatText: TextFormatter
): string {
    return formatText(getRailTooltipKey('playlists', section));
}

export function formatRailLinks(
    links: PortalRailLink[],
    provider: WorkspacePortalContext['provider'],
    formatText: TextFormatter
): PortalRailLink[] {
    return links.map((link) => ({
        ...link,
        tooltip: formatText(getRailTooltipKey(provider, link.section)),
    }));
}

export function resolveSearchPlaceholderKey(
    kind: WorkspaceShellPageKind,
    context: WorkspacePortalContext | null,
    section: PortalRailSection | null
): string {
    if (kind === 'sources') {
        return SEARCH_SOURCES_PLACEHOLDER;
    }

    if (kind === 'dashboard' || section === 'search') {
        return SEARCH_PLAYLIST_PLACEHOLDER;
    }

    if (
        context &&
        (section === 'vod' ||
            section === 'series' ||
            section === 'live' ||
            section === 'itv' ||
            section === 'radio')
    ) {
        return SEARCH_SECTION_PLACEHOLDER;
    }

    return FILTER_SECTION_PLACEHOLDER;
}

export function resolveActiveCategoryLabel(ctx: SearchScopeContext): string {
    const {
        context,
        section,
        formatText,
        xtreamCategory,
        stalkerCategoryName,
    } = ctx;
    if (!context || !section) {
        return '';
    }

    if (context.provider === 'xtreams') {
        return (
            xtreamCategory?.category_name ??
            xtreamCategory?.name ??
            formatRailSection(section, formatText)
        );
    }

    if (context.provider === 'stalker') {
        return (
            stalkerCategoryName.trim() || formatRailSection(section, formatText)
        );
    }

    return formatRailSection(section, formatText);
}

export function resolveSearchScopeLabel(ctx: SearchScopeContext): string {
    const { kind, context, section, formatText } = ctx;

    if (kind === 'sources') {
        return formatText('Sources');
    }

    if (kind === 'global-favorites') {
        return formatText('Global favorites');
    }

    if (kind === 'global-recent') {
        return formatText('Recently viewed');
    }

    if (kind === 'global-search') {
        return formatText('Global search');
    }

    if (kind === 'downloads') {
        return formatText('Downloads');
    }

    if (kind === 'dashboard' || section === 'search') {
        return formatText('Advanced search');
    }

    if (!context || !section) {
        return '';
    }

    if (
        section === 'vod' ||
        section === 'series' ||
        section === 'live' ||
        section === 'itv' ||
        section === 'radio'
    ) {
        const categoryLabel = resolveActiveCategoryLabel(ctx);
        const sectionLabel = formatRailSection(section, formatText);

        return categoryLabel
            ? `${sectionLabel} / ${categoryLabel}`
            : sectionLabel;
    }

    return formatRailSection(section, formatText);
}
