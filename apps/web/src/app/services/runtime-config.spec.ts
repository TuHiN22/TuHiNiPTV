import { resolveBackendUrl } from './runtime-config';

describe('runtime config helpers', () => {
    it('uses runtime BACKEND_URL when provided', () => {
        expect(
            resolveBackendUrl(
                { BACKEND_URL: '  http://self-hosted.local/api  ' },
                'https://fallback.example'
            )
        ).toBe('http://self-hosted.local/api');
    });

    it('falls back to the build-time backend URL when runtime config is missing or blank', () => {
        expect(resolveBackendUrl(undefined, 'https://fallback.example')).toBe(
            'https://fallback.example'
        );
        expect(resolveBackendUrl({}, 'https://fallback.example')).toBe(
            'https://fallback.example'
        );
        expect(
            resolveBackendUrl(
                { BACKEND_URL: '   ' },
                'https://fallback.example'
            )
        ).toBe('https://fallback.example');
    });
});
