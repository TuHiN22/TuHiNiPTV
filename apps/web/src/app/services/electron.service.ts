import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { PlaylistActions } from '@iptvnator/m3u-state';
import { DialogService } from '@iptvnator/ui/components';
import { DataService, SettingsStore } from '@iptvnator/services';
import {
    AUTO_UPDATE_PLAYLISTS,
    createDevLogger,
    ELECTRON_BRIDGE_SECURITY_ERROR_CODES,
    ERROR,
    normalizeHost,
    parseSecurityPolicyError,
    PlayerContentInfo,
    Playlist,
    PLAYLIST_PARSE_BY_URL,
    PLAYLIST_UPDATE,
    StalkerPortalActions,
    XTREAM_REQUEST,
    XTREAM_RESPONSE,
    XtreamCodeActions,
} from '@iptvnator/shared/interfaces';
import { AppConfig } from '../../environments/environment';
import {
    createPortalDebugRequestContext,
    logPortalDebugEvent,
} from '@iptvnator/portal/shared/util';

interface PlayerLaunchPayload {
    readonly headers?: Record<string, string>;
    readonly origin?: string;
    readonly referer?: string;
    readonly startTime?: number;
    readonly thumbnail?: string;
    readonly title?: string;
    readonly url: string;
    readonly ['user-agent']?: string;
    readonly contentInfo?: PlayerContentInfo;
}

interface ErrorStatus {
    readonly message?: string;
    readonly status?: number;
}

@Injectable({
    providedIn: 'root',
})
export class ElectronService extends DataService {
    private eventListeners: { [key: string]: () => void } = {};
    private messageListeners = new Map<string, EventListener>();
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialogService = inject(DialogService);
    private readonly store = inject(Store);
    private readonly settingsStore = inject(SettingsStore);
    private readonly debugLog = createDevLogger('ElectronService');
    private readonly silentXtreamActions = new Set<string>([
        XtreamCodeActions.GetAccountInfo,
        XtreamCodeActions.GetLiveCategories,
        XtreamCodeActions.GetVodCategories,
        XtreamCodeActions.GetSeriesCategories,
        XtreamCodeActions.GetShortEpg,
        XtreamCodeActions.GetSimpleDataTable,
        XtreamCodeActions.GetSimpleDateTable,
    ]);

    constructor() {
        super();
        this.debugLog('Electron service initialized...');
        this.setupPlayerErrorListener();
        this.setupPortalDebugListener();
    }

    private setupPlayerErrorListener() {
        // Listen for player errors from the backend
        if (window.electron?.onPlayerError) {
            window.electron.onPlayerError(
                (data: {
                    player: string;
                    error: string;
                    originalError: string;
                }) => {
                    console.error(`${data.player} Error:`, data.originalError);
                    this.snackBar.open(
                        `${data.player} Error: ${data.error}`,
                        'Close',
                        {
                            duration: 7000,
                            panelClass: ['error-snackbar'],
                        }
                    );
                }
            );
        }
    }

    private setupPortalDebugListener() {
        const onPortalDebugEvent = (
            window.electron as {
                onPortalDebugEvent?: (
                    callback: (
                        event: Parameters<typeof logPortalDebugEvent>[0]
                    ) => void
                ) => void;
            }
        ).onPortalDebugEvent;

        if (AppConfig.production || !onPortalDebugEvent) {
            return;
        }

        onPortalDebugEvent((event) => {
            logPortalDebugEvent(
                event as Parameters<typeof logPortalDebugEvent>[0]
            );
        });
    }

    getAppVersion(): string {
        return AppConfig.version;
    }

    async sendIpcEvent<T = unknown>(
        type: string,
        payload?: unknown
    ): Promise<T> {
        if (type === PLAYLIST_PARSE_BY_URL) {
            this.fetchM3uPlaylistFromUrl(payload as Partial<Playlist>);
            return undefined as T;
        }

        if (type === PLAYLIST_UPDATE) {
            this.updateM3uPlaylistFromFile(
                payload as {
                    id: string;
                    filePath?: string;
                    url?: string;
                    title: string;
                }
            );
            return undefined as T;
        }

        if (type === XTREAM_REQUEST) {
            return (await this.forwardXtreamRequest(
                payload as { url: string; params: Record<string, string> }
            )) as T;
        }

        if (type === 'STALKER_REQUEST') {
            return (await this.fetchStalkerData(
                payload as {
                    url: string;
                    macAddress: string;
                    params: Record<string, string>;
                }
            )) as T;
        }

        if (type === 'OPEN_MPV_PLAYER') {
            const data = payload as PlayerLaunchPayload;
            try {
                return (await window.electron.openInMpv(
                    data.url,
                    data.title ?? '',
                    data.thumbnail ?? '',
                    data['user-agent'],
                    data.referer ?? undefined,
                    data.origin ?? undefined,
                    data.contentInfo,
                    data.startTime,
                    data.headers ?? undefined
                )) as T;
            } catch (error: unknown) {
                const errorMessage =
                    this.getErrorDetails(error)?.message ?? String(error);
                this.snackBar.open(
                    `Error launching MPV: ${errorMessage}`,
                    'Close',
                    {
                        duration: 5000,
                    }
                );
                console.error('MPV launch error:', error);
                throw error;
            }
        }

        if (type === 'OPEN_VLC_PLAYER') {
            const data = payload as PlayerLaunchPayload;
            try {
                return (await window.electron.openInVlc(
                    data.url,
                    data.title ?? '',
                    data.thumbnail ?? '',
                    data['user-agent'],
                    data.referer ?? undefined,
                    data.origin ?? undefined,
                    data.contentInfo,
                    data.startTime,
                    data.headers ?? undefined
                )) as T;
            } catch (error: unknown) {
                const errorMessage =
                    this.getErrorDetails(error)?.message ?? String(error);
                this.snackBar.open(
                    `Error launching VLC: ${errorMessage}`,
                    'Close',
                    {
                        duration: 5000,
                    }
                );
                console.error('VLC launch error:', error);
                throw error;
            }
        }

        if (type === AUTO_UPDATE_PLAYLISTS) {
            const data = payload as Playlist[];
            const playlists = await window.electron.autoUpdatePlaylists(
                data,
                this.settingsStore.getTrustOptions()
            );
            this.store.dispatch(
                PlaylistActions.updateManyPlaylists({
                    playlists,
                })
            );
            this.snackBar.open(
                'Success! The playlists were successfully updated',
                undefined,
                { duration: 2000 }
            );
            return playlists as T;
        }

        this.debugLog('Unknown IPC event type:', type);
        return undefined as T;
    }

    private async fetchStalkerData(payload: {
        url: string;
        macAddress: string;
        params: Record<string, string>;
        requestId?: string;
        token?: string;
        serialNumber?: string;
    }) {
        const context = createPortalDebugRequestContext({
            provider: 'stalker',
            operation: payload.params?.action ?? 'unknown',
            transport: 'electron-renderer',
            request: payload,
        });

        try {
            // Use Electron IPC to make the Stalker request
            const response = await window.electron.stalkerRequest({
                ...payload,
                requestId: context.requestId,
            });
            return response;
        } catch (err: unknown) {
            const errorInfo = this.getErrorDetails(err);
            console.error('Stalker request error:', err);
            // Playback callers translate create_link failures into a focused
            // STREAM OFFLINE diagnostic. Avoid showing the lower-level IPC
            // error first, which otherwise produces two competing snackbars.
            if (payload.params?.action !== StalkerPortalActions.CreateLink) {
                this.snackBar.open(
                    `Error: ${errorInfo?.message ?? ' Not found'}, status: ${errorInfo?.status ?? 404}`,
                    'Close',
                    {
                        duration: 5000,
                    }
                );
            }
            throw err;
        }
    }

    private async fetchM3uPlaylistFromUrl(payload?: Partial<Playlist>) {
        if (!payload?.url) {
            return;
        }

        const title = payload.title?.trim() || undefined;

        window.electron
            .fetchPlaylistByUrl(
                payload.url,
                title,
                this.settingsStore.getTrustOptions()
            )
            .then((result) => {
                this.store.dispatch(
                    PlaylistActions.handleAddingPlaylistByUrl({
                        isTemporary: !!payload?.isTemporary,
                        playlist: result,
                    })
                );
            })
            .catch((error: unknown) => {
                if (
                    this.handlePlaylistSecurityError(error, () =>
                        this.fetchM3uPlaylistFromUrl(payload)
                    )
                ) {
                    return;
                }

                const statusCode = this.extractHttpStatusCode(error);
                let messageKey =
                    'Failed to fetch the playlist. Please check the URL and try again.';
                if (statusCode === 403) {
                    messageKey =
                        'Access denied (403): The server refused the request. The URL may require authentication or the playlist is restricted.';
                } else if (statusCode === 404) {
                    messageKey =
                        'Playlist not found (404): The URL does not point to a valid playlist. Please check the URL.';
                } else if (statusCode === 401) {
                    messageKey =
                        'Unauthorized (401): Authentication is required to access this playlist.';
                }
                this.snackBar.open(messageKey, 'Close', { duration: 5000 });
            });
    }

    private extractHttpStatusCode(error: unknown): number | null {
        if (
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'status' in error.response
        ) {
            return error.response.status as number;
        }
        // Parse status from error message string (IPC serialization)
        const msg = String((error as { message?: string })?.message ?? error);
        const match = msg.match(/status code (\d{3})/);
        return match ? parseInt(match[1], 10) : null;
    }

    private async updateM3uPlaylistFromFile(data: {
        id: string;
        url?: string;
        filePath?: string;
        title: string;
    }) {
        try {
            let playlistObject: Playlist;
            if (data.url && !data.filePath) {
                playlistObject = await window.electron.fetchPlaylistByUrl(
                    data.url,
                    data.title,
                    this.settingsStore.getTrustOptions()
                );
            } else if (data.filePath && !data.url) {
                playlistObject =
                    await window.electron.updatePlaylistFromFilePath(
                        data.filePath,
                        data.title
                    );
            } else {
                console.error(
                    'Either url or filePath must be provided, but not both.'
                );
                return;
            }

            this.store.dispatch(
                PlaylistActions.updatePlaylist({
                    playlist: {
                        ...playlistObject,
                        _id: data.id,
                    },
                    playlistId: data.id,
                    refreshEpg: true,
                })
            );

            this.snackBar.open(
                'Success! The playlist was successfully updated.',
                undefined,
                { duration: 2000 }
            );
        } catch (error: unknown) {
            console.error('Playlist refresh error:', error);
            if (
                data.url &&
                this.handlePlaylistSecurityError(error, () => {
                    void this.updateM3uPlaylistFromFile(data);
                })
            ) {
                return;
            }
            this.snackBar.open(
                this.getPlaylistRefreshErrorMessage(error, data),
                'Close',
                { duration: 5000 }
            );
        }
    }

    private getPlaylistRefreshErrorMessage(
        error: unknown,
        data: { url?: string; filePath?: string }
    ): string {
        if (data.filePath) {
            const errorMessage = String(
                this.getErrorDetails(error)?.message ?? error ?? ''
            );

            if (
                /(ENOENT|no such file or directory|not found)/i.test(
                    errorMessage
                )
            ) {
                return 'Playlist refresh failed. The local file is no longer available. Check the file path or re-import the playlist.';
            }

            if (/(EACCES|EPERM|permission denied)/i.test(errorMessage)) {
                return 'Playlist refresh failed. The app can no longer access the local file.';
            }

            return 'Error updating playlist details.';
        }

        const statusCode = this.extractHttpStatusCode(error);
        if (statusCode === 404) {
            return 'Playlist not found (404): The URL does not point to a valid playlist. Please check the URL.';
        }
        if (statusCode === 403) {
            return 'Access denied (403): The server refused the request. The URL may require authentication or the playlist is restricted.';
        }
        if (statusCode === 401) {
            return 'Unauthorized (401): Authentication is required to access this playlist.';
        }
        return 'Failed to fetch the playlist. Please check the URL and try again.';
    }

    private handlePlaylistSecurityError(
        error: unknown,
        retry: () => void
    ): boolean {
        const securityError = parseSecurityPolicyError(error);
        if (
            securityError?.code !==
            ELECTRON_BRIDGE_SECURITY_ERROR_CODES.InvalidTlsCertificate
        ) {
            return false;
        }

        const ref = this.snackBar.open(
            'Certificate for this playlist host is invalid.',
            'Trust host',
            { duration: 10000 }
        );

        ref.onAction().subscribe(() => {
            this.confirmTrustPlaylistHost(securityError.host, retry);
        });
        return true;
    }

    private confirmTrustPlaylistHost(
        host: string | undefined,
        retry: () => void
    ): void {
        if (!host) {
            this.snackBar.open(
                'Could not determine the playlist host. Please retry manually.',
                'Close',
                { duration: 5000 }
            );
            return;
        }

        this.dialogService.openConfirmDialog({
            title: 'Trust invalid certificate?',
            message:
                'Only continue if you trust this playlist host. TuHiN iPTV will allow invalid TLS certificates for this host, but other hosts still require valid certificates.',
            confirmLabel: 'Trust host',
            width: '420px',
            onConfirm: () => {
                void this.trustPlaylistHost(host).then(retry);
            },
        });
    }

    private async trustPlaylistHost(host: string): Promise<void> {
        const settings = this.settingsStore.getSettings();
        const trustedHosts = new Set(
            (settings.trustedInsecureTlsHosts ?? []).map((item) =>
                normalizeHost(item)
            )
        );
        trustedHosts.add(normalizeHost(host));

        await this.settingsStore.updateSettings({
            trustedInsecureTlsHosts: Array.from(trustedHosts),
        });
    }

    /* private getErrorMessageByStatusCode(status: number) {
        let message = 'Something went wrong';
        switch (status) {
            case 0:
                message = 'The backend is not reachable';
                break;
            case 413:
                message =
                    'This file is too big. Use standalone or self-hosted version of the app.';
                break;
            default:
                break;
        }
        return message;
    } */

    private async forwardXtreamRequest(payload: {
        url: string;
        params: Record<string, string>;
        requestId?: string;
        sessionId?: string;
        suppressErrorLog?: boolean;
    }) {
        const context = createPortalDebugRequestContext({
            provider: 'xtream',
            operation: payload.params?.action ?? 'unknown',
            transport: 'electron-renderer',
            request: payload,
        });

        try {
            // Use Electron IPC to make the Xtream request
            const response = await window.electron.xtreamRequest({
                ...payload,
                requestId: context.requestId,
            });

            const result = {
                type: XTREAM_RESPONSE,
                payload: response.payload,
                action: response.action,
            };
            window.postMessage(result);
            return result;
        } catch (error: unknown) {
            const action = payload.params?.action;
            const isSilentAction =
                payload.suppressErrorLog === true ||
                (action ? this.silentXtreamActions.has(action) : false);
            const normalizedMessage = this.getReadableXtreamErrorMessage(error);
            const errorInfo = this.getErrorDetails(error);

            // Log error to console
            if (isSilentAction) {
                this.debugLog(
                    `Background Xtream action failed (${action ?? 'unknown'}):`,
                    normalizedMessage
                );
            } else {
                console.error('Xtream request error:', normalizedMessage);
            }

            // Only show snackbar for user-triggered Xtream requests
            if (!isSilentAction) {
                this.snackBar.open(
                    `Xtream request failed: ${normalizedMessage}`,
                    'Close',
                    {
                        duration: 5000,
                    }
                );
            }

            return {
                type: ERROR,
                status: errorInfo?.status ?? 500,
                message: normalizedMessage,
            };
        }
    }

    private getReadableXtreamErrorMessage(error: unknown): string {
        const fallback = 'Failed to connect to Xtream server';
        if (!error) {
            return fallback;
        }

        const maybeError = error as {
            message?: unknown;
            statusText?: unknown;
            status?: unknown;
            error?: unknown;
        };

        if (typeof maybeError.message === 'string') {
            if (maybeError.message.includes('[object Object]')) {
                if (typeof maybeError.error === 'string') {
                    return maybeError.error;
                }
                if (
                    maybeError.error &&
                    typeof maybeError.error === 'object' &&
                    'message' in
                        (maybeError.error as Record<string, unknown>) &&
                    typeof (maybeError.error as Record<string, unknown>)
                        .message === 'string'
                ) {
                    return (maybeError.error as Record<string, string>).message;
                }
                return fallback;
            }
            return maybeError.message;
        }

        if (typeof maybeError.statusText === 'string') {
            return maybeError.statusText;
        }

        if (typeof error === 'string') {
            return error;
        }

        return fallback;
    }

    private getErrorDetails(error: unknown): ErrorStatus | null {
        if (!error) {
            return null;
        }

        // Prefer a structured object with message/status (e.g. from a thrown
        // StalkerRequestError before serialization).
        if (typeof error === 'object') {
            const candidate = error as Partial<ErrorStatus> & {
                message?: unknown;
            };
            const rawMessage =
                typeof candidate.message === 'string'
                    ? candidate.message
                    : undefined;
            const status =
                typeof candidate.status === 'number'
                    ? candidate.status
                    : this.parseStatusFromMessage(rawMessage);

            if (rawMessage !== undefined || status !== undefined) {
                return {
                    ...(error as ErrorStatus),
                    message: this.cleanErrorMessage(rawMessage),
                    status,
                } as ErrorStatus;
            }
            return error as ErrorStatus;
        }

        // Electron flattens a rejected IPC Error to a string such as
        // "Error invoking remote method 'STALKER_REQUEST': StalkerRequestError:
        // HTTP Error: Not Found (status: 404)". Recover message + status from it.
        if (typeof error === 'string') {
            return {
                message: this.cleanErrorMessage(error),
                status: this.parseStatusFromMessage(error),
            } as ErrorStatus;
        }

        return null;
    }

    /** Extracts a trailing `(status: NNN)` HTTP status code from a message. */
    private parseStatusFromMessage(message?: string): number | undefined {
        if (!message) {
            return undefined;
        }
        const match = message.match(/\(status:\s*(\d{3})\)/i);
        return match ? Number(match[1]) : undefined;
    }

    /**
     * Strips Electron's IPC wrapper and error-class prefixes so the user sees a
     * clean provider message instead of "Error invoking remote method '…':".
     */
    private cleanErrorMessage(message?: string): string | undefined {
        if (!message) {
            return undefined;
        }
        return message
            .replace(/^Error invoking remote method '[^']*':\s*/i, '')
            .replace(/^StalkerRequestError:\s*/i, '')
            .replace(/\s*\(status:\s*\d{3}\)\s*$/i, '')
            .trim();
    }

    removeAllListeners(type: string): void {
        if (type === 'all') {
            // Unsubscribe from all event listeners
            Object.values(this.eventListeners).forEach((unsubscribe) =>
                unsubscribe()
            );
            this.eventListeners = {};
            // Remove all tracked window message listeners
            this.messageListeners.forEach((listener) =>
                window.removeEventListener('message', listener)
            );
            this.messageListeners.clear();
            return;
        }

        if (this.eventListeners[type]) {
            // Unsubscribe from a specific event
            this.eventListeners[type]();
            delete this.eventListeners[type];
        }

        // Remove the window message listener registered for this command
        const messageListener = this.messageListeners.get(type);
        if (messageListener) {
            window.removeEventListener('message', messageListener);
            this.messageListeners.delete(type);
        }
    }

    listenOn(command: string, callback: (...args: unknown[]) => void): void {
        // Drop any existing listener for this command so calling listenOn()
        // again rebinds rather than accumulating duplicates.
        const existing = this.messageListeners.get(command);
        if (existing) {
            window.removeEventListener('message', existing);
        }

        const listener = callback as EventListener;
        window.addEventListener('message', listener);
        this.messageListeners.set(command, listener);
    }

    getAppEnvironment(): string {
        return 'electron';
    }
}
