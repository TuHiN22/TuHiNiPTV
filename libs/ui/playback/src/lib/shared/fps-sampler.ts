/**
 * Frame-rate sampler for an {@link HTMLVideoElement}.
 *
 * When `requestVideoFrameCallback` is available it derives the true media
 * frame rate from the callback metadata — `presentedFrames / mediaTime`
 * deltas — instead of counting callbacks against the wall clock. Counting
 * callbacks undercounts because the compositor throttles/coalesces them to
 * the display refresh and pauses them when the tab is occluded, so a 50fps
 * source can read well below its real rate. The media-clock delta is immune
 * to that: it measures how many frames the decoder presented per second of
 * media time, which is the encoded frame rate at 1x playback.
 *
 * Falls back to a `requestAnimationFrame` wall-clock counter when
 * `requestVideoFrameCallback` is unavailable.
 */

interface FrameMetadata {
    readonly mediaTime: number;
    readonly presentedFrames: number;
}

export interface FpsSampler {
    start(): void;
    stop(): void;
}

// Update roughly three times per second of media time.
const MEDIA_WINDOW_SECONDS = 0.35;
const WALL_WINDOW_MS = 500;

export function createFpsSampler(
    video: HTMLVideoElement,
    onFps: (fps: number) => void
): FpsSampler {
    const usesVfc = typeof video.requestVideoFrameCallback === 'function';

    let running = false;
    let rafHandle = 0;
    let vfcHandle = 0;

    // Media-clock (requestVideoFrameCallback) accumulator.
    let lastMediaTime: number | null = null;
    let lastPresentedFrames = 0;

    // Wall-clock (requestAnimationFrame) accumulator.
    let frameCount = 0;
    let lastWall = 0;

    const emit = (fps: number): void => {
        if (Number.isFinite(fps) && fps > 0) {
            onFps(Math.round(fps));
        }
    };

    const onVideoFrame = (_now: number, metadata: FrameMetadata): void => {
        if (lastMediaTime === null) {
            lastMediaTime = metadata.mediaTime;
            lastPresentedFrames = metadata.presentedFrames;
        } else {
            const mediaDelta = metadata.mediaTime - lastMediaTime;
            const frameDelta = metadata.presentedFrames - lastPresentedFrames;
            if (mediaDelta >= MEDIA_WINDOW_SECONDS && frameDelta > 0) {
                emit(frameDelta / mediaDelta);
                lastMediaTime = metadata.mediaTime;
                lastPresentedFrames = metadata.presentedFrames;
            }
        }
        schedule();
    };

    const onAnimationFrame = (): void => {
        frameCount++;
        const now = performance.now();
        const elapsed = now - lastWall;
        if (elapsed >= WALL_WINDOW_MS) {
            emit((frameCount * 1000) / elapsed);
            frameCount = 0;
            lastWall = now;
        }
        schedule();
    };

    function schedule(): void {
        if (!running) {
            return;
        }
        if (usesVfc) {
            vfcHandle = video.requestVideoFrameCallback(onVideoFrame);
        } else {
            rafHandle = requestAnimationFrame(onAnimationFrame);
        }
    }

    return {
        start(): void {
            if (running) {
                return;
            }
            running = true;
            lastMediaTime = null;
            lastPresentedFrames = 0;
            frameCount = 0;
            lastWall = performance.now();
            schedule();
        },
        stop(): void {
            running = false;
            if (usesVfc && vfcHandle) {
                video.cancelVideoFrameCallback(vfcHandle);
            } else if (rafHandle) {
                cancelAnimationFrame(rafHandle);
            }
            vfcHandle = 0;
            rafHandle = 0;
        },
    };
}
