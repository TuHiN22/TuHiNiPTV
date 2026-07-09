import { ArtPlayerSettingsMenu } from './art-player-settings-menu';

type QualitySelectorOption = {
    html: string;
    valueLabel?: string;
    level?: number;
    default?: boolean;
};

type QualitySetting = {
    name: string;
    tooltip: string;
    selector: QualitySelectorOption[];
    onSelect: (item: QualitySelectorOption) => string;
};

function createHlsStub(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        levels: [
            { width: 1280, height: 720, bitrate: 3_550_000 },
            { width: 1920, height: 1080, bitrate: 6_000_000 },
            { width: 3840, height: 2160, bitrate: 18_000_000 },
        ],
        autoLevelEnabled: true,
        currentLevel: -1,
        audioTracks: [],
        audioTrack: -1,
        on: jest.fn(),
        ...overrides,
    } as unknown as Parameters<ArtPlayerSettingsMenu['attachHls']>[0];
}

function getQualitySetting(menu: ArtPlayerSettingsMenu): QualitySetting {
    return (menu.settings as unknown as QualitySetting[]).find(
        (setting) => setting.name === 'videoQuality'
    ) as QualitySetting;
}

/**
 * Attaches a player stub whose `setting.update` captures rebuilt settings, then
 * attaches the hls stub so the quality setting is repopulated from levels.
 * Returns the latest captured "videoQuality" setting.
 */
function buildQualityWithHls(
    menu: ArtPlayerSettingsMenu,
    hls: Parameters<ArtPlayerSettingsMenu['attachHls']>[0]
): QualitySetting {
    const updates: QualitySetting[] = [];
    const playerStub = {
        setting: {
            update: (setting: QualitySetting) => updates.push(setting),
        },
    } as unknown as Parameters<ArtPlayerSettingsMenu['setPlayer']>[0];

    menu.setPlayer(playerStub);
    menu.attachHls(hls);

    const quality = [...updates]
        .reverse()
        .find((setting) => setting.name === 'videoQuality');
    return quality ?? getQualitySetting(menu);
}

describe('ArtPlayerSettingsMenu video quality labels', () => {
    it('lists each level with resolution and bitrate only (no tier prefix)', () => {
        const menu = new ArtPlayerSettingsMenu();
        const quality = buildQualityWithHls(menu, createHlsStub());

        const levelOptions = quality.selector.filter(
            (option) => option.level !== undefined && option.level >= 0
        );

        expect(levelOptions.map((option) => option.html)).toEqual([
            '1280 × 720, 3.55 Mbps',
            '1920 × 1080, 6.00 Mbps',
            '3840 × 2160, 18.00 Mbps',
        ]);
        // No SD/HD/FHD/4K prefix in the list rows.
        for (const option of levelOptions) {
            expect(option.html).not.toMatch(/^(SD|HD|FHD|4K)/);
        }
    });

    it('exposes the tier as the collapsed-row value for each level', () => {
        const menu = new ArtPlayerSettingsMenu();
        const quality = buildQualityWithHls(menu, createHlsStub());

        const levelOptions = quality.selector.filter(
            (option) => option.level !== undefined && option.level >= 0
        );

        expect(levelOptions.map((option) => option.valueLabel)).toEqual([
            'HD',
            'FHD',
            '4K',
        ]);
    });

    it('shows only the tier in the collapsed row when a level is selected', () => {
        const menu = new ArtPlayerSettingsMenu();
        const quality = buildQualityWithHls(
            menu,
            createHlsStub({ autoLevelEnabled: false, currentLevel: 1 })
        );

        // The 1080p level is active → collapsed row shows "FHD".
        expect(quality.tooltip).toBe('FHD');
    });

    it('returns the tier from onSelect so the collapsed row updates on change', () => {
        const menu = new ArtPlayerSettingsMenu();
        const quality = buildQualityWithHls(menu, createHlsStub());

        const uhdOption = quality.selector.find(
            (option) => option.html === '3840 × 2160, 18.00 Mbps'
        ) as QualitySelectorOption;

        expect(quality.onSelect(uhdOption)).toBe('4K');
    });

    it('keeps the Auto placeholder for the collapsed row', () => {
        const menu = new ArtPlayerSettingsMenu();
        const quality = buildQualityWithHls(menu, createHlsStub());

        expect(quality.tooltip).toBe('Auto');
    });
});
