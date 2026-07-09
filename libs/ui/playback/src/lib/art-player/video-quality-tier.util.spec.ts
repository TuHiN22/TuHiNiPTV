import { resolutionToQualityTier } from './video-quality-tier.util';

describe('resolutionToQualityTier', () => {
    it('classifies standard landscape resolutions', () => {
        expect(resolutionToQualityTier(640, 480)).toBe('SD');
        expect(resolutionToQualityTier(1280, 720)).toBe('HD');
        expect(resolutionToQualityTier(1920, 1080)).toBe('FHD');
        expect(resolutionToQualityTier(3840, 2160)).toBe('4K');
    });

    it('treats the boundary values inclusively', () => {
        expect(resolutionToQualityTier(1280, 719)).toBe('SD');
        expect(resolutionToQualityTier(1280, 720)).toBe('HD');
        expect(resolutionToQualityTier(1920, 1079)).toBe('HD');
        expect(resolutionToQualityTier(1920, 1080)).toBe('FHD');
        expect(resolutionToQualityTier(4096, 2160)).toBe('4K');
    });

    it('classifies portrait streams by their smaller (vertical) edge', () => {
        // A 720×1280 portrait stream is HD, driven by the 720 edge.
        expect(resolutionToQualityTier(720, 1280)).toBe('HD');
        expect(resolutionToQualityTier(1080, 1920)).toBe('FHD');
    });

    it('classifies from height when only the vertical resolution is known', () => {
        expect(resolutionToQualityTier(undefined, 1080)).toBe('FHD');
        expect(resolutionToQualityTier(undefined, 720)).toBe('HD');
    });

    it('does not classify from an ambiguous lone width', () => {
        // 1280 wide is usually 720p HD, so width alone must not imply FHD.
        expect(resolutionToQualityTier(1280, undefined)).toBe('');
    });

    it('returns an empty label when no dimension is known', () => {
        expect(resolutionToQualityTier(undefined, undefined)).toBe('');
        expect(resolutionToQualityTier(0, 0)).toBe('');
        expect(resolutionToQualityTier(NaN, -5)).toBe('');
    });
});
