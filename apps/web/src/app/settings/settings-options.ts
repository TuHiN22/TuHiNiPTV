import {
    CoverSize,
    EpgViewMode,
    StartupBehavior,
    Theme,
    VideoPlayer,
} from '@iptvnator/shared/interfaces';
import {
    CoverSizeOption,
    EpgViewModeOption,
    SettingsPlayerOption,
    SettingsSection,
    StartupBehaviorOption,
    ThemeOption,
} from './settings.models';

export const SETTINGS_THEME_OPTIONS: ThemeOption[] = [
    {
        value: Theme.LightTheme,
        icon: 'light_mode',
        labelKey: 'Light',
    },
    {
        value: Theme.DarkTheme,
        icon: 'dark_mode',
        labelKey: 'Dark',
    },
    {
        value: Theme.SystemTheme,
        icon: 'desktop_windows',
        labelKey: 'System',
    },
];

export const SETTINGS_COVER_SIZE_OPTIONS: CoverSizeOption[] = [
    {
        value: 'small' satisfies CoverSize,
        icon: 'view_module',
        labelKey: 'Small',
    },
    {
        value: 'medium' satisfies CoverSize,
        icon: 'view_comfy',
        labelKey: 'Medium',
    },
    {
        value: 'large' satisfies CoverSize,
        icon: 'view_quilt',
        labelKey: 'Large',
    },
];

export const SETTINGS_EPG_VIEW_MODE_OPTIONS: EpgViewModeOption[] = [
    {
        value: 'timeline' satisfies EpgViewMode,
        icon: 'view_timeline',
        labelKey: 'Timeline',
    },
    {
        value: 'list' satisfies EpgViewMode,
        icon: 'view_list',
        labelKey: 'List',
    },
];

export const SETTINGS_STARTUP_BEHAVIOR_OPTIONS: StartupBehaviorOption[] = [
    {
        value: StartupBehavior.FirstView,
        labelKey: 'First available view',
    },
    {
        value: StartupBehavior.RestoreLastView,
        labelKey: 'Restore last view',
    },
];

export const SETTINGS_OS_PLAYER_OPTIONS: SettingsPlayerOption[] = [
    {
        id: VideoPlayer.MPV,
        labelKey: 'MPV player',
    },
    {
        id: VideoPlayer.VLC,
        labelKey: 'VLC',
    },
];

export const SETTINGS_EMBEDDED_PLAYER_OPTIONS: SettingsPlayerOption[] = [
    {
        id: VideoPlayer.Html5Player,
        labelKey: 'HTML5 video player',
    },
    {
        id: VideoPlayer.VideoJs,
        labelKey: 'Video.js player',
    },
    {
        id: VideoPlayer.ArtPlayer,
        labelKey: 'ArtPlayer',
    },
];

export interface SettingsSectionVisibility {
    supportsEpg: boolean;
    supportsRemoteControl: boolean;
}

export function buildSettingsSectionNavItems({
    supportsEpg,
    supportsRemoteControl,
}: SettingsSectionVisibility): SettingsSection[] {
    return [
        {
            id: 'general',
            label: 'General',
            icon: 'tune',
            visible: true,
        },
        {
            id: 'playback',
            label: 'Playback',
            icon: 'play_circle',
            visible: true,
        },
        {
            id: 'epg',
            label: 'EPG',
            icon: 'calendar_month',
            visible: supportsEpg,
        },
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'dashboard',
            visible: true,
        },
        {
            // Must match the section's HTML id (`remote-control`) so the
            // settings-section-scroll directive can resolve the anchor.
            // Was previously '@iptvnator/ui/remote-control' (the NX lib
            // name), which meant clicking the nav item silently no-op'd
            // because document.getElementById of that string returned null.
            id: 'remote-control',
            label: 'Remote',
            icon: 'smartphone',
            visible: supportsRemoteControl,
        },
        {
            id: 'tmdb',
            label: 'Metadata',
            icon: 'movie',
            visible: true,
        },
        {
            id: 'backup',
            label: 'Backup',
            icon: 'backup',
            visible: true,
        },
        {
            id: 'reset',
            label: 'Reset',
            icon: 'delete_sweep',
            visible: true,
        },
        {
            id: 'about',
            label: 'About',
            icon: 'info',
            visible: true,
        },
    ];
}
