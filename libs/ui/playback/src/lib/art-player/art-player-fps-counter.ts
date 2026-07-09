import Artplayer from 'artplayer';
import { createFpsSampler, type FpsSampler } from '../shared/fps-sampler';

/** Subset of ArtPlayer's SettingOption used by the switch callback. */
type SettingOption = { switch?: boolean; [key: string]: unknown };

/**
 * Adds a toggleable FPS counter to an ArtPlayer instance. Enabled by default;
 * toggle it from the settings menu ("FPS counter"). Frame-rate accuracy comes
 * from {@link createFpsSampler} (media-clock based when
 * `requestVideoFrameCallback` is available).
 */

const FPS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="white">
    <path d="M13 3a9 9 0 1 0 8.94 8h-2.02A7 7 0 1 1 13 5V3zm-1 5v5l4 2 .75-1.23L13.5 12.3V8H12z"/>
</svg>`;

type LayerCapablePlayer = Artplayer & {
    layers?: { add?: (layer: { name: string; html: HTMLElement }) => void };
};

export function addFpsCounter(player: Artplayer): void {
    const video = player.video;
    if (!video) {
        return;
    }

    // ArtPlayer exposes `layers` at runtime; guard so the util degrades
    // gracefully in environments (e.g. unit-test mocks) that omit it.
    const layers = (player as LayerCapablePlayer).layers;
    if (typeof layers?.add !== 'function') {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'art-fps-counter';
    overlay.style.cssText = [
        'position:absolute',
        'top:8px',
        'left:8px',
        'z-index:60',
        'padding:2px 8px',
        'border-radius:8px',
        'font:600 12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace',
        'color:#fff',
        'background:rgba(0,0,0,0.55)',
        'pointer-events:none',
        'display:block',
    ].join(';');
    overlay.textContent = '– FPS';

    // ArtPlayer layers render above the video and below the controls.
    layers.add({ name: 'fpsCounter', html: overlay });

    let visible = true;
    const sampler: FpsSampler = createFpsSampler(video, (fps) => {
        if (visible) {
            overlay.textContent = `${fps} FPS`;
        }
    });

    // Enabled by default: start sampling immediately.
    sampler.start();

    player.setting.add({
        html: 'FPS counter',
        icon: FPS_ICON,
        switch: true,
        onSwitch: function (item: SettingOption) {
            visible = !item.switch;
            overlay.style.display = visible ? 'block' : 'none';
            if (visible) {
                overlay.textContent = '– FPS';
                sampler.start();
            } else {
                sampler.stop();
            }
            return visible;
        },
    });

    player.on('destroy', () => sampler.stop());
}
