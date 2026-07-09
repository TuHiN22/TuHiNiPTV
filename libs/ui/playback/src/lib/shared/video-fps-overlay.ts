import { createFpsSampler, type FpsSampler } from './fps-sampler';

/**
 * Framework-agnostic FPS overlay for an {@link HTMLVideoElement}.
 *
 * The overlay is appended to `container`. Pass `initiallyVisible: true` to show
 * it immediately; otherwise it starts hidden. Sampling only runs while the
 * overlay is visible. Toggle it with {@link VideoFpsOverlay.toggle} /
 * {@link VideoFpsOverlay.setVisible} and always call
 * {@link VideoFpsOverlay.destroy} on teardown. Accuracy is provided by
 * {@link createFpsSampler}.
 */

export interface VideoFpsOverlay {
    readonly element: HTMLElement;
    setVisible(visible: boolean): void;
    toggle(): boolean;
    isVisible(): boolean;
    destroy(): void;
}

export interface VideoFpsOverlayOptions {
    /** Show the overlay and start sampling immediately. Defaults to false. */
    initiallyVisible?: boolean;
}

const OVERLAY_STYLE = [
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
].join(';');

export function createVideoFpsOverlay(
    container: HTMLElement,
    video: HTMLVideoElement,
    options: VideoFpsOverlayOptions = {}
): VideoFpsOverlay {
    const startVisible = options.initiallyVisible === true;
    const overlay = document.createElement('div');
    overlay.className = 'video-fps-counter';
    overlay.style.cssText = `${OVERLAY_STYLE};display:${
        startVisible ? 'block' : 'none'
    }`;
    overlay.textContent = '– FPS';
    container.appendChild(overlay);

    let visible = false;
    const sampler: FpsSampler = createFpsSampler(video, (fps) => {
        if (visible) {
            overlay.textContent = `${fps} FPS`;
        }
    });

    const setVisible = (next: boolean): void => {
        if (next === visible) {
            return;
        }
        visible = next;
        overlay.style.display = visible ? 'block' : 'none';
        if (visible) {
            overlay.textContent = '– FPS';
            sampler.start();
        } else {
            sampler.stop();
        }
    };

    if (startVisible) {
        // Reflect the initial DOM state through the same code path so the
        // sampler starts and future toggles stay in sync.
        visible = true;
        sampler.start();
    }

    return {
        element: overlay,
        setVisible,
        toggle(): boolean {
            setVisible(!visible);
            return visible;
        },
        isVisible: () => visible,
        destroy(): void {
            sampler.stop();
            overlay.remove();
        },
    };
}
