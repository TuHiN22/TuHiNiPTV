import { PlaybackDiagnosticCode } from '../playback-diagnostics/playback-diagnostics.util';

export interface PlaybackDiagnosticCopy {
    readonly title: string;
    readonly description: string;
}

export function getDefaultPlaybackDiagnosticCopy(
    code: PlaybackDiagnosticCode
): PlaybackDiagnosticCopy {
    switch (code) {
        case PlaybackDiagnosticCode.UnsupportedContainer:
            return {
                title: 'This stream container is likely unsupported by the browser player',
                description:
                    'The browser player may not decode this container inline. Copy the stream URL and open it in an external player such as MPV, VLC, or IINA for broader codec support.',
            };
        case PlaybackDiagnosticCode.UnsupportedCodec:
            return {
                title: 'This stream codec is likely unsupported by the browser player',
                description:
                    'The stream advertises codecs that the browser player may not decode. Copy the stream URL and open it in an external player such as MPV, VLC, or IINA.',
            };
        case PlaybackDiagnosticCode.MediaDecodeError:
            return {
                title: 'The browser player could not decode this stream',
                description:
                    'Playback started but the media pipeline failed while decoding. An external player may handle this stream better.',
            };
        case PlaybackDiagnosticCode.NetworkError:
            return {
                title: 'The stream could not be loaded',
                description:
                    'The player reported a network or provider loading error. Check the stream URL, headers, or provider availability.',
            };
        case PlaybackDiagnosticCode.BrowserAccessError:
            return {
                title: 'The browser player could not access this stream',
                description:
                    'The request may be blocked by CORS, mixed content, or provider header/proxy restrictions. MPV or VLC can often bypass browser-player access limits.',
            };
        case PlaybackDiagnosticCode.DrmOrEncryption:
            return {
                title: 'This stream may be encrypted or DRM-protected',
                description:
                    'The browser player cannot continue with the reported encryption/key error. External playback may still fail if provider DRM is required.',
            };
        case PlaybackDiagnosticCode.UnknownPlaybackError:
        default:
            return {
                title: 'The browser player reported a playback error',
                description:
                    'The stream failed in the built-in player, but the error did not identify a specific codec, container, or network cause.',
            };
    }
}
