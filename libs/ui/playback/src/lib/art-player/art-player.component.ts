import {
    Component,
    ElementRef,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import Artplayer from 'artplayer';
import Hls, { type ErrorData, type ManifestParsedData } from 'hls.js';
import mpegts from 'mpegts.js';
import { Channel } from '@iptvnator/shared/interfaces';
import { addFpsCounter } from './art-player-fps-counter';
import { ArtPlayerSettingsMenu } from './art-player-settings-menu';
import {
    InlinePlaybackPlayer,
    PlaybackDiagnostic,
    classifyHlsPlaybackIssue,
    classifyMpegTsPlaybackIssue,
    classifyNativePlaybackIssue,
    classifyUnsupportedHlsManifestCodecs,
    createPlaybackSourceMetadata,
    getPlaybackMediaExtensionFromUrl,
} from '../playback-diagnostics/playback-diagnostics.util';
import { SeriesPlaybackNavigationControlsComponent } from '../portal-inline-player/series-playback-navigation-controls.component';
import type { SeriesPlaybackNavigation } from '../portal-inline-player/series-playback-navigation';
import { isCodecFailure } from '../playback-diagnostics/playback-error-patterns.util';

Artplayer.AUTO_PLAYBACK_TIMEOUT = 10000;

@Component({
    selector: 'app-art-player',
    imports: [SeriesPlaybackNavigationControlsComponent],
    templateUrl: './art-player.component.html',
    styleUrls: ['./art-player.component.scss'],
})
export class ArtPlayerComponent implements OnInit, OnDestroy, OnChanges {
    @Input() channel!: Channel;
    @Input() volume = 1;
    @Input() showCaptions = false;
    @Input() startTime = 0;
    @Input() seriesNavigation: SeriesPlaybackNavigation | null = null;
    @Output() timeUpdate = new EventEmitter<{
        currentTime: number;
        duration: number;
    }>();
    @Output() playbackIssue = new EventEmitter<PlaybackDiagnostic | null>();
    @Output() playbackEnded = new EventEmitter<void>();
    @Output() previousEpisodeRequested = new EventEmitter<void>();
    @Output() nextEpisodeRequested = new EventEmitter<void>();

    private player!: Artplayer;
    private hls: Hls | null = null;
    private mpegtsPlayer: mpegts.Player | null = null;
    private settingsMenu: ArtPlayerSettingsMenu | null = null;

    /**
     * Bounded counters for hls.js self-recovery. hls.js can transparently
     * recover from many transient network stalls (via `startLoad()`) and media
     * decode hiccups (via `recoverMediaError()`), so we retry a few times
     * before surfacing the "stream could not be loaded" diagnostic overlay.
     */
    private hlsNetworkRecoveryAttempts = 0;
    private hlsMediaRecoveryAttempts = 0;
    private static readonly MAX_HLS_NETWORK_RECOVERY_ATTEMPTS = 3;
    private static readonly MAX_HLS_MEDIA_RECOVERY_ATTEMPTS = 2;

    private readonly elementRef = inject(ElementRef);

    private readonly handleNativePlaybackError = () => {
        this.playbackIssue.emit(
            classifyNativePlaybackIssue(
                this.player?.video?.error,
                this.createSourceMetadata(
                    this.channel?.url ?? this.player?.video?.currentSrc ?? ''
                )
            )
        );
    };

    private readonly clearPlaybackIssue = () => {
        this.playbackIssue.emit(null);
    };

    private readonly handlePlaybackEnded = () => {
        this.playbackEnded.emit();
    };

    ngOnInit(): void {
        this.initPlayer();
    }

    ngOnDestroy(): void {
        this.destroyPlayer();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['channel'] && !changes['channel'].firstChange) {
            this.destroyPlayer();
            this.initPlayer();
        }
        if (changes['volume'] && this.player) {
            this.applyVolume(changes['volume'].currentValue);
        }
    }

    private destroyPlayer(): void {
        this.settingsMenu = null;
        if (this.mpegtsPlayer) {
            this.mpegtsPlayer.pause();
            this.mpegtsPlayer.unload();
            this.mpegtsPlayer.detachMediaElement();
            this.mpegtsPlayer.destroy();
            this.mpegtsPlayer = null;
        }
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.player) {
            this.player.video?.removeEventListener(
                'error',
                this.handleNativePlaybackError
            );
            this.player.video?.removeEventListener(
                'loadeddata',
                this.clearPlaybackIssue
            );
            this.player.video?.removeEventListener(
                'playing',
                this.clearPlaybackIssue
            );
            this.player.video?.removeEventListener(
                'ended',
                this.handlePlaybackEnded
            );
            this.player.destroy();
        }
    }

    private initPlayer(): void {
        this.playbackIssue.emit(null);
        const el = this.elementRef.nativeElement.querySelector(
            '.artplayer-container'
        );
        const extension = getPlaybackMediaExtensionFromUrl(
            this.channel?.url ?? ''
        );
        const isLive = extension === 'm3u8' || extension === 'ts' || !extension;

        // Provides the "Video Quality" and "Audio Track" settings-menu items
        // (replacing ArtPlayer's default Play Speed / Aspect Ratio entries).
        this.settingsMenu = new ArtPlayerSettingsMenu();

        this.player = new Artplayer({
            container: el,
            url: this.channel.url + (this.channel.epgParams || ''),
            volume: this.clampVolume(this.volume),
            isLive: isLive,
            autoplay: true,
            type: this.getVideoType(this.channel.url),
            pip: true,
            autoPlayback: true,
            autoSize: true,
            autoMini: true,
            screenshot: true,
            setting: true,
            playbackRate: false,
            aspectRatio: false,
            settings: this.settingsMenu.settings,
            fullscreen: true,
            fullscreenWeb: true,
            playsInline: true,
            airplay: true,
            backdrop: true,
            mutex: true,
            theme: '#ff0000',
            customType: {
                m3u8: (video: HTMLVideoElement, url: string) => {
                    if (Hls.isSupported()) {
                        if (this.hls) {
                            this.hls.destroy();
                        }
                        this.hlsNetworkRecoveryAttempts = 0;
                        this.hlsMediaRecoveryAttempts = 0;
                        this.hls = new Hls();
                        this.hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                            this.handleHlsManifestParsed(url, data);
                        });
                        this.hls.on(Hls.Events.ERROR, (_, data) => {
                            this.handleHlsError(url, data);
                        });
                        this.hls.loadSource(url);
                        this.hls.attachMedia(video);
                        this.settingsMenu?.attachHls(this.hls);
                    } else if (
                        video.canPlayType('application/vnd.apple.mpegurl')
                    ) {
                        video.src = url;
                    }
                },
                ts: (video: HTMLVideoElement, url: string) => {
                    if (mpegts.isSupported()) {
                        if (this.mpegtsPlayer) {
                            this.mpegtsPlayer.destroy();
                        }
                        this.mpegtsPlayer = mpegts.createPlayer({
                            type: 'mpegts',
                            isLive: true,
                            url: url,
                        });
                        this.mpegtsPlayer.attachMediaElement(video);
                        this.mpegtsPlayer.on(
                            mpegts.Events.ERROR,
                            (
                                type: string,
                                details: string,
                                info: unknown
                            ): void => {
                                this.playbackIssue.emit(
                                    classifyMpegTsPlaybackIssue(
                                        {
                                            type,
                                            details,
                                            info,
                                        },
                                        this.createSourceMetadata(
                                            url,
                                            'video/mp2t'
                                        )
                                    )
                                );
                            }
                        );
                        this.mpegtsPlayer.load();
                        this.mpegtsPlayer.play();
                    }
                },
                mkv: (video: HTMLVideoElement, url: string) => {
                    video.src = url;
                },
                mpd: (_video: HTMLVideoElement, url: string) => {
                    // MPEG-DASH is not decodable by the browser players. Rather
                    // than letting the native element retry-loop on an
                    // unplayable source, surface the unsupported-container
                    // diagnostic immediately so the external-player fallback
                    // (MPV/VLC) is offered right away.
                    this.playbackIssue.emit(
                        classifyNativePlaybackIssue(
                            { code: 4, message: 'MPEG-DASH (.mpd) manifest' },
                            this.createSourceMetadata(
                                url,
                                'application/dash+xml'
                            )
                        )
                    );
                },
            },
        });

        this.player.video.addEventListener(
            'error',
            this.handleNativePlaybackError
        );
        this.player.video.addEventListener(
            'loadeddata',
            this.clearPlaybackIssue
        );
        this.player.video.addEventListener('playing', this.clearPlaybackIssue);
        this.player.video.addEventListener('ended', this.handlePlaybackEnded);

        // Bind the quality/audio settings items to this player instance; they
        // populate from hls.js once the manifest and audio tracks are parsed.
        this.settingsMenu?.setPlayer(this.player);

        // Toggleable FPS overlay available for any source type (settings menu).
        addFpsCounter(this.player);

        if (this.startTime > 0) {
            this.player.on('ready', () => {
                this.player.seek = this.startTime;
            });
        }

        this.player.on('video:timeupdate', () => {
            this.timeUpdate.emit({
                currentTime: this.player.currentTime,
                duration: this.player.duration,
            });
        });
    }

    private applyVolume(value: number): void {
        this.player.volume = this.clampVolume(value);
    }

    private clampVolume(value: number): number {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 1;
        }

        return Math.max(0, Math.min(1, numericValue));
    }

    private handleHlsManifestParsed(
        url: string,
        data: ManifestParsedData
    ): void {
        const metadata = this.createSourceMetadata(
            url,
            'application/x-mpegURL',
            data.levels
                .map((level) => level.audioCodec)
                .filter((codec): codec is string => Boolean(codec)),
            data.levels
                .map((level) => level.videoCodec)
                .filter((codec): codec is string => Boolean(codec))
        );
        const issue = classifyUnsupportedHlsManifestCodecs(metadata);
        if (issue) {
            this.playbackIssue.emit(issue);
        }
    }

    private handleHlsError(url: string, data: ErrorData): void {
        if (!data.fatal) {
            return;
        }

        // Attempt hls.js's built-in recovery before giving up. Many "stream
        // could not be loaded" cases are transient network stalls or recoverable
        // media errors that clear once loading is restarted, so we retry a
        // bounded number of times and only surface the diagnostic overlay when
        // recovery is exhausted or the error is unrecoverable.
        if (this.hls && this.tryRecoverHls(data)) {
            return;
        }

        this.playbackIssue.emit(
            classifyHlsPlaybackIssue(
                {
                    type: data.type,
                    details: data.details,
                    fatal: data.fatal,
                    message: data.error?.message,
                    error: data.error,
                },
                this.createSourceMetadata(url, 'application/x-mpegURL')
            )
        );
    }

    /**
     * Runs hls.js self-recovery for recoverable fatal errors. Returns `true`
     * when a recovery step was triggered (so the caller should suppress the
     * diagnostic overlay), or `false` when the error is unrecoverable or the
     * retry budget is spent.
     */
    private tryRecoverHls(data: ErrorData): boolean {
        if (!this.hls) {
            return false;
        }

        // `Hls.ErrorTypes` may be absent when hls.js is mocked (unit tests) or
        // built without the enum; guard so recovery degrades to "no recovery"
        // instead of throwing.
        const errorTypes = Hls.ErrorTypes;
        if (!errorTypes) {
            return false;
        }

        if (data.type === errorTypes.NETWORK_ERROR) {
            if (
                this.hlsNetworkRecoveryAttempts >=
                ArtPlayerComponent.MAX_HLS_NETWORK_RECOVERY_ATTEMPTS
            ) {
                return false;
            }
            this.hlsNetworkRecoveryAttempts += 1;
            this.hls.startLoad();
            return true;
        }

        if (data.type === errorTypes.MEDIA_ERROR) {
            // Codec failures are typed as MEDIA_ERROR but are not fixed by
            // `recoverMediaError()` retries — surface them immediately so the
            // external-player fallback is offered without a delay.
            if (isCodecFailure((data.details ?? '').toLowerCase())) {
                return false;
            }
            if (
                this.hlsMediaRecoveryAttempts >=
                ArtPlayerComponent.MAX_HLS_MEDIA_RECOVERY_ATTEMPTS
            ) {
                return false;
            }
            this.hlsMediaRecoveryAttempts += 1;
            this.hls.recoverMediaError();
            return true;
        }

        return false;
    }

    private getVideoType(url: string): string {
        const extension = getPlaybackMediaExtensionFromUrl(url);
        switch (extension) {
            case 'mkv':
                return 'video/matroska';
            case 'm3u8':
                return 'm3u8';
            case 'mp4':
                return 'mp4';
            case 'ts':
                return 'ts';
            case 'mpd':
                return 'mpd';
            default:
                // No recognized extension (e.g. IPTV proxy URL) → default to
                // MPEG-TS which is the most common format for live IPTV streams.
                return extension ? 'auto' : 'ts';
        }
    }

    private createSourceMetadata(
        url: string,
        mimeType?: string,
        audioCodecs: readonly string[] = [],
        videoCodecs: readonly string[] = []
    ) {
        return createPlaybackSourceMetadata({
            url,
            mimeType,
            player: InlinePlaybackPlayer.ArtPlayer,
            audioCodecs,
            videoCodecs,
        });
    }
}
