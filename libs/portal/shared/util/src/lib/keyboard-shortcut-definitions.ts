export type KeyboardShortcutGroupId =
    | 'global'
    | 'navigation'
    | 'playback'
    | 'dialogs';

export interface PlatformShortcutChord {
    mac: readonly string[];
    other: readonly string[];
}

export type KeyboardShortcutChord =
    | string
    | readonly string[]
    | PlatformShortcutChord;

export interface KeyboardShortcutDefinition {
    id: string;
    group: KeyboardShortcutGroupId;
    labelKey: string;
    icon: string;
    keys: readonly KeyboardShortcutChord[];
    order: number;
    electronOnly?: boolean;
}

export const KEYBOARD_SHORTCUT_GROUPS: readonly {
    id: KeyboardShortcutGroupId;
    labelKey: string;
    icon: string;
}[] = [
    {
        id: 'global',
        labelKey: 'Global',
        icon: 'keyboard',
    },
    {
        id: 'navigation',
        labelKey: 'Navigation',
        icon: 'explore',
    },
    {
        id: 'playback',
        labelKey: 'Playback',
        icon: 'play_circle',
    },
    {
        id: 'dialogs',
        labelKey: 'Dialogs and lists',
        icon: 'web_asset',
    },
];

const commandChord = (key: string): PlatformShortcutChord => ({
    mac: ['Cmd', key],
    other: ['Ctrl', key],
});

export const APP_KEYBOARD_SHORTCUTS: readonly KeyboardShortcutDefinition[] = [
    {
        id: 'open-keyboard-shortcuts',
        group: 'global',
        labelKey: 'Open this shortcuts list',
        icon: 'help_outline',
        keys: ['?'],
        order: 0,
    },
    {
        id: 'open-command-palette',
        group: 'global',
        labelKey: 'Open command palette',
        icon: 'terminal',
        keys: [commandChord('K')],
        order: 10,
    },
    {
        id: 'open-global-search',
        group: 'global',
        labelKey: 'Open global search',
        icon: 'search',
        keys: [commandChord('F')],
        order: 20,
        electronOnly: true,
    },
    {
        id: 'open-recently-viewed',
        group: 'global',
        labelKey: 'Open recently viewed',
        icon: 'history',
        keys: [commandChord('R')],
        order: 30,
        electronOnly: true,
    },
    {
        id: 'submit-shell-search',
        group: 'global',
        labelKey: 'Submit workspace search',
        icon: 'keyboard_return',
        keys: ['Enter'],
        order: 40,
    },
    {
        id: 'toggle-sidebar',
        group: 'navigation',
        labelKey: 'Toggle sidebar',
        icon: 'view_sidebar',
        keys: [commandChord('B')],
        order: 10,
    },
    {
        id: 'm3u-channel-number',
        group: 'navigation',
        labelKey: 'Select M3U channel by number',
        icon: 'dialpad',
        keys: ['0-9'],
        order: 20,
    },
    {
        id: 'embedded-mpv-play-pause',
        group: 'playback',
        labelKey: 'Play or pause embedded MPV playback',
        icon: 'play_arrow',
        keys: ['Space', 'K'],
        order: 10,
        electronOnly: true,
    },
    {
        id: 'embedded-mpv-fullscreen',
        group: 'playback',
        labelKey: 'Toggle embedded MPV fullscreen',
        icon: 'fullscreen',
        keys: ['F'],
        order: 20,
        electronOnly: true,
    },
    {
        id: 'embedded-mpv-seek',
        group: 'playback',
        labelKey: 'Seek embedded MPV playback by 5 seconds',
        icon: 'swap_horiz',
        keys: ['ArrowLeft', 'ArrowRight'],
        order: 30,
        electronOnly: true,
    },
    {
        id: 'adjust-volume',
        group: 'playback',
        labelKey: 'Adjust volume by 5%',
        icon: 'volume_up',
        keys: ['ArrowUp', 'ArrowDown'],
        order: 40,
    },
    {
        id: 'mute-audio',
        group: 'playback',
        labelKey: 'Mute audio',
        icon: 'volume_off',
        keys: ['M'],
        order: 50,
    },
    {
        id: 'close-player-popovers',
        group: 'playback',
        labelKey: 'Close embedded MPV popovers',
        icon: 'close',
        keys: ['Escape'],
        order: 60,
        electronOnly: true,
    },
    {
        id: 'command-palette-navigation',
        group: 'dialogs',
        labelKey: 'Move command palette selection',
        icon: 'unfold_more',
        keys: ['ArrowUp', 'ArrowDown'],
        order: 10,
    },
    {
        id: 'command-palette-run',
        group: 'dialogs',
        labelKey: 'Run selected command palette item',
        icon: 'subdirectory_arrow_right',
        keys: ['Enter'],
        order: 20,
    },
    {
        id: 'close-dialogs',
        group: 'dialogs',
        labelKey: 'Close dialog or dismiss overlay',
        icon: 'close',
        keys: ['Escape'],
        order: 30,
    },
    {
        id: 'downloads-open-item',
        group: 'dialogs',
        labelKey: 'Open focused download item in the library',
        icon: 'download',
        keys: ['Enter', 'Space'],
        order: 40,
    },
];
