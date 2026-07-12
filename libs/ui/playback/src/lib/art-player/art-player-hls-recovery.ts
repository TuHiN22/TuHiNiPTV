import type Hls from 'hls.js';
import type { ErrorData } from 'hls.js';
import { isCodecFailure } from '../playback-diagnostics/playback-error-patterns.util';

interface HlsErrorTypes {
    readonly NETWORK_ERROR: string;
    readonly MEDIA_ERROR: string;
}

export class ArtPlayerHlsRecovery {
    private static readonly MAX_NETWORK_ATTEMPTS = 3;
    private static readonly MAX_MEDIA_ATTEMPTS = 2;

    private networkAttempts = 0;
    private mediaAttempts = 0;

    reset(): void {
        this.networkAttempts = 0;
        this.mediaAttempts = 0;
    }

    tryRecover(
        hls: Hls,
        data: ErrorData,
        errorTypes: HlsErrorTypes | undefined
    ): boolean {
        if (!errorTypes) {
            return false;
        }

        if (data.type === errorTypes.NETWORK_ERROR) {
            if (
                this.networkAttempts >=
                ArtPlayerHlsRecovery.MAX_NETWORK_ATTEMPTS
            ) {
                return false;
            }
            this.networkAttempts += 1;
            hls.startLoad();
            return true;
        }

        if (data.type !== errorTypes.MEDIA_ERROR) {
            return false;
        }
        if (isCodecFailure((data.details ?? '').toLowerCase())) {
            return false;
        }
        if (this.mediaAttempts >= ArtPlayerHlsRecovery.MAX_MEDIA_ATTEMPTS) {
            return false;
        }

        this.mediaAttempts += 1;
        hls.recoverMediaError();
        return true;
    }
}
