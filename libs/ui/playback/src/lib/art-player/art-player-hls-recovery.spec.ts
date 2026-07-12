import type Hls from 'hls.js';
import type { ErrorData } from 'hls.js';
import { ArtPlayerHlsRecovery } from './art-player-hls-recovery';

const errorTypes = {
    NETWORK_ERROR: 'networkError',
    MEDIA_ERROR: 'mediaError',
};

function errorData(type: string, details: string): ErrorData {
    return { type, details, fatal: true } as ErrorData;
}

describe('ArtPlayerHlsRecovery', () => {
    let recovery: ArtPlayerHlsRecovery;
    let hls: Pick<Hls, 'startLoad' | 'recoverMediaError'>;

    beforeEach(() => {
        recovery = new ArtPlayerHlsRecovery();
        hls = {
            startLoad: jest.fn(),
            recoverMediaError: jest.fn(),
        };
    });

    it('bounds fatal network recovery attempts', () => {
        const failure = errorData('networkError', 'fragLoadError');

        expect(recovery.tryRecover(hls as Hls, failure, errorTypes)).toBe(true);
        expect(recovery.tryRecover(hls as Hls, failure, errorTypes)).toBe(true);
        expect(recovery.tryRecover(hls as Hls, failure, errorTypes)).toBe(true);
        expect(recovery.tryRecover(hls as Hls, failure, errorTypes)).toBe(
            false
        );
        expect(hls.startLoad).toHaveBeenCalledTimes(3);
    });

    it('recovers bounded media errors but not codec failures', () => {
        const mediaFailure = errorData('mediaError', 'bufferStalledError');

        expect(recovery.tryRecover(hls as Hls, mediaFailure, errorTypes)).toBe(
            true
        );
        expect(recovery.tryRecover(hls as Hls, mediaFailure, errorTypes)).toBe(
            true
        );
        expect(recovery.tryRecover(hls as Hls, mediaFailure, errorTypes)).toBe(
            false
        );
        expect(
            recovery.tryRecover(
                hls as Hls,
                errorData('mediaError', 'bufferAddCodecError'),
                errorTypes
            )
        ).toBe(false);
        expect(hls.recoverMediaError).toHaveBeenCalledTimes(2);
    });

    it('resets both retry budgets', () => {
        const failure = errorData('networkError', 'fragLoadError');
        for (let attempt = 0; attempt < 3; attempt += 1) {
            recovery.tryRecover(hls as Hls, failure, errorTypes);
        }

        recovery.reset();

        expect(recovery.tryRecover(hls as Hls, failure, errorTypes)).toBe(true);
        expect(hls.startLoad).toHaveBeenCalledTimes(4);
    });
});
