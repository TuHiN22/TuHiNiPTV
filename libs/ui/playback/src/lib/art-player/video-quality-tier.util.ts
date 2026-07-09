/**
 * Maps a video resolution to a broadcast-style quality tier label
 * (SD / HD / FHD / 4K) for display next to the "Video Quality" menu entry.
 *
 * Classification is based on the vertical resolution (line count), using the
 * conventions commonly used by IPTV providers:
 *
 * - `4K`  : ≥ 2160 lines (Ultra HD)
 * - `FHD` : ≥ 1080 lines (Full HD)
 * - `HD`  : ≥ 720 lines
 * - `SD`  : anything below 720 lines
 *
 * For landscape streams the vertical resolution is `height`; for portrait
 * streams it is `width` (the smaller edge). When the vertical resolution
 * cannot be determined the function returns an empty string so callers can omit
 * the label rather than showing a misleading tier — width alone is not enough
 * to classify reliably (e.g. a 1280-wide stream is usually 720p HD, not FHD).
 */

export type VideoQualityTier = 'SD' | 'HD' | 'FHD' | '4K';

export function resolutionToQualityTier(
    width: number | undefined,
    height: number | undefined
): VideoQualityTier | '' {
    const verticalResolution = deriveVerticalResolution(width, height);
    if (!verticalResolution) {
        return '';
    }

    if (verticalResolution >= 2160) {
        return '4K';
    }
    if (verticalResolution >= 1080) {
        return 'FHD';
    }
    if (verticalResolution >= 720) {
        return 'HD';
    }
    return 'SD';
}

function deriveVerticalResolution(
    width: number | undefined,
    height: number | undefined
): number {
    const safeWidth = toPositiveInteger(width);
    const safeHeight = toPositiveInteger(height);

    // With both edges known, the vertical resolution (line count) is the
    // smaller edge: `height` for landscape, `width` for portrait streams.
    if (safeWidth && safeHeight) {
        return Math.min(safeWidth, safeHeight);
    }

    // Only `height` reliably represents line count on its own; a lone `width`
    // is ambiguous, so it does not drive classification.
    return safeHeight;
}

function toPositiveInteger(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return 0;
    }
    return Math.round(value);
}
