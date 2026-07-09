import videoJs from 'video.js';
import { createVideoFpsOverlay } from '../shared/video-fps-overlay';

/**
 * Adds a control-bar toggle button that shows/hides an FPS overlay on a
 * Video.js player. The overlay is mounted into the player's root element so
 * it renders above the video and follows fullscreen. Returns a disposer that
 * tears down the overlay; the button itself is disposed with the player.
 */

type VjsControlBar = {
    addChild?: (
        name: string,
        options?: Record<string, unknown>,
        index?: number
    ) => unknown;
    getChild?: (name: string) => unknown;
};

type VjsPlayerLike = {
    el: () => Element | null;
    tech?: (options?: unknown) => { el?: () => Element | null } | null;
    getChild: (name: string) => VjsControlBar | null;
    on: (event: string, handler: () => void) => void;
};

const BUTTON_NAME = 'FpsToggleButton';
let registered = false;

function ensureButtonRegistered(): void {
    if (registered) {
        return;
    }

    const Button = videoJs.getComponent('Button') as unknown as {
        new (...args: unknown[]): unknown;
    };

    class FpsToggleButton extends (Button as {
        new (player: unknown, options?: unknown): {
            el: () => HTMLElement;
            controlText: (text: string) => void;
            addClass: (name: string) => void;
            toggleClass: (name: string) => void;
            options_?: { onToggle?: () => boolean };
        };
    }) {
        constructor(player: unknown, options?: unknown) {
            super(player, options);
            this.controlText('FPS counter');
            this.addClass('vjs-fps-toggle-button');
            this.el().innerHTML =
                '<span class="vjs-fps-toggle-label" aria-hidden="true">FPS</span>';
        }

        handleClick(): void {
            const active = this.options_?.onToggle?.();
            this.toggleClass('vjs-fps-active');
            void active;
        }
    }

    videoJs.registerComponent(
        BUTTON_NAME,
        FpsToggleButton as unknown as ReturnType<typeof videoJs.getComponent>
    );
    registered = true;
}

export function addVjsFpsCounter(player: VjsPlayerLike): () => void {
    const root = player.el() as HTMLElement | null;
    const techEl = player.tech?.({ IWillNotUseThisInPlugins: true })?.el?.();
    const video = (techEl ??
        root?.querySelector('video')) as HTMLVideoElement | null;
    if (!root || !video) {
        return () => undefined;
    }

    const overlay = createVideoFpsOverlay(root, video, {
        initiallyVisible: true,
    });

    ensureButtonRegistered();
    const controlBar = player.getChild('controlBar');
    const button = controlBar?.addChild?.(BUTTON_NAME, {
        onToggle: () => overlay.toggle(),
    }) as { addClass?: (name: string) => void } | undefined;
    // Overlay is on by default, so reflect the active state on the button.
    button?.addClass?.('vjs-fps-active');

    player.on('dispose', () => overlay.destroy());
    return () => overlay.destroy();
}
