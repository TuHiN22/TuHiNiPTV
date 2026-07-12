import { Component, inject, output, signal } from '@angular/core';
import {
    AbstractControl,
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { PlaylistActions } from '@iptvnator/m3u-state';
import { StalkerSessionService } from '@iptvnator/portal/stalker/data-access';
import { Playlist } from '@iptvnator/shared/interfaces';
import { v4 as uuid } from 'uuid';

function atLeastOneContentTypeValidator(
    control: AbstractControl
): ValidationErrors | null {
    const group = control as FormGroup;
    const anySelected =
        group.get('importLive')?.value ||
        group.get('importVod')?.value ||
        group.get('importSeries')?.value;
    return anySelected ? null : { noContentType: true };
}

@Component({
    imports: [
        FormsModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
    selector: 'app-stalker-portal-import',
    templateUrl: './stalker-portal-import.component.html',
    styleUrl: './stalker-portal-import.component.scss',
})
export class StalkerPortalImportComponent {
    readonly addClicked = output<void>();
    readonly URL_REGEX = /^(http|https|file):\/\/[^ "]+$/;

    readonly form = new FormGroup(
        {
            _id: new FormControl(uuid()),
            title: new FormControl('', [Validators.required]),
            macAddress: new FormControl('', [Validators.required]),
            password: new FormControl(''),
            username: new FormControl(''),
            portalUrl: new FormControl('', [
                Validators.required,
                Validators.pattern(this.URL_REGEX),
            ]),
            importDate: new FormControl(new Date().toISOString()),
            userAgent: new FormControl(''),
            importLive: new FormControl(true),
            importVod: new FormControl(true),
            importSeries: new FormControl(true),
        },
        { validators: atLeastOneContentTypeValidator }
    );

    private readonly stalkerSessionService = inject(StalkerSessionService);
    private readonly store = inject(Store);
    private readonly snackBar = inject(MatSnackBar);

    readonly isLoading = signal(false);

    readonly isTestingConnection = signal(false);
    readonly connectionStatus = signal<
        'online' | 'offline' | 'unavailable' | null
    >(null);

    async testConnection(): Promise<void> {
        if (!this.form.valid || this.isTestingConnection()) {
            return;
        }

        const formValue = this.form.getRawValue();
        const originalUrl = formValue.portalUrl ?? '';
        const transformedUrl = this.transformPortalUrl(originalUrl);
        const macAddress = formValue.macAddress ?? '';

        if (!transformedUrl || !macAddress) {
            this.connectionStatus.set('unavailable');
            return;
        }

        this.isTestingConnection.set(true);
        this.connectionStatus.set(null);

        try {
            const authResult = await this.stalkerSessionService.authenticate(
                transformedUrl,
                macAddress
            );

            this.connectionStatus.set(authResult.token ? 'online' : 'offline');
        } catch (error) {
            this.connectionStatus.set(
                this.isUnreachableError(error) ? 'unavailable' : 'offline'
            );
        } finally {
            this.isTestingConnection.set(false);
        }
    }

    getStatusMessage(): string {
        switch (this.connectionStatus()) {
            case 'online':
                return 'Connection successful — portal is online';
            case 'offline':
                return 'Portal reachable but rejected the connection. Check the MAC address or credentials.';
            case 'unavailable':
                return 'Could not reach the portal. Check the URL and your network.';
            default:
                return '';
        }
    }

    getStatusClass(): string {
        const status = this.connectionStatus();
        return status ? `connection-status--${status}` : '';
    }

    getStatusIcon(): string {
        switch (this.connectionStatus()) {
            case 'online':
                return 'check_circle';
            case 'offline':
                return 'error';
            case 'unavailable':
                return 'cloud_off';
            default:
                return '';
        }
    }

    /** True when the error indicates the portal host was not reachable. */
    private isUnreachableError(error: unknown): boolean {
        const message = (
            error instanceof Error ? error.message : String(error ?? '')
        ).toLowerCase();
        return (
            message.includes('network') ||
            message.includes('timeout') ||
            message.includes('enotfound') ||
            message.includes('econnrefused') ||
            message.includes('econnreset') ||
            message.includes('getaddrinfo') ||
            message.includes('unreachable')
        );
    }

    clearForm(): void {
        this.form.reset({
            _id: uuid(),
            title: '',
            macAddress: '',
            password: '',
            username: '',
            portalUrl: '',
            importDate: new Date().toISOString(),
            userAgent: '',
            importLive: true,
            importVod: true,
            importSeries: true,
        });
        this.connectionStatus.set(null);
    }

    async addPlaylist() {
        if (!this.form.valid || this.isLoading()) {
            return;
        }

        this.isLoading.set(true);

        try {
            const formValue = this.form.getRawValue();
            const originalUrl = formValue.portalUrl ?? '';
            const transformedUrl = this.transformPortalUrl(originalUrl);
            const isFullStalkerPortal =
                this.isFullStalkerPortalUrl(originalUrl);

            let stalkerToken: string | undefined;
            let stalkerAccountInfo: Playlist['stalkerAccountInfo'] | undefined;

            // For full stalker portal URLs, perform handshake and get profile
            if (isFullStalkerPortal) {
                try {
                    const authResult =
                        await this.stalkerSessionService.authenticate(
                            transformedUrl,
                            formValue.macAddress ?? ''
                        );

                    stalkerToken = authResult.token;

                    if (authResult.accountInfo) {
                        stalkerAccountInfo = {
                            login: authResult.accountInfo.login,
                            expireDate: authResult.accountInfo.expire_date,
                            tariffPlanName:
                                authResult.accountInfo.tariff_plan_name,
                            status: authResult.accountInfo.status,
                        };
                    }

                    // Show success notification with account info if available
                    if (stalkerAccountInfo?.expireDate) {
                        const expireDate = new Date(
                            stalkerAccountInfo.expireDate * 1000
                        );
                        this.snackBar.open(
                            `Portal validated. Expires: ${expireDate.toLocaleDateString('en-US')}`,
                            undefined,
                            { duration: 3000 }
                        );
                    }
                } catch (error) {
                    console.error(
                        '[StalkerImport] Authentication failed:',
                        error
                    );
                    this.snackBar.open(
                        'Failed to authenticate with portal. Please check URL and MAC address.',
                        undefined,
                        { duration: 5000 }
                    );
                    this.isLoading.set(false);
                    return;
                }
            }

            const {
                importLive,
                importVod,
                importSeries,
                ...playlistFormValue
            } = formValue;

            const importContentTypes = [
                importLive ? 'live' : null,
                importVod ? 'vod' : null,
                importSeries ? 'series' : null,
            ].filter(
                (type): type is 'live' | 'vod' | 'series' => type !== null
            );

            const playlist: Playlist = {
                ...playlistFormValue,
                portalUrl: transformedUrl,
                isFullStalkerPortal,
                stalkerToken,
                stalkerAccountInfo,
                importContentTypes,
            } as Playlist;

            this.store.dispatch(PlaylistActions.addPlaylist({ playlist }));
            this.addClicked.emit();
        } finally {
            this.isLoading.set(false);
        }
    }

    /**
     * Checks if the URL is a full stalker portal URL that requires handshake authentication
     * Pattern: example.com/stalker_portal/c or example.com/stalker_portal/...
     */
    isFullStalkerPortalUrl(url: string): boolean {
        return url.includes('/stalker_portal');
    }

    /**
     * Transforms the portal URL to the correct API endpoint
     * - Simple URL (example.com/c) -> example.com/portal.php
     * - Full stalker portal (example.com/stalker_portal/c) -> example.com/stalker_portal/server/load.php
     */
    transformPortalUrl(url: string): string {
        // Remove trailing slashes
        url = url.replace(/\/+$/, '');

        // Case 1: Simple URL ending with /c -> convert to /portal.php
        if (url.endsWith('/c')) {
            // Check if it's a full stalker portal URL
            if (url.includes('/stalker_portal')) {
                // example.com/stalker_portal/c -> example.com/stalker_portal/server/load.php
                return url.replace(
                    /\/stalker_portal\/c$/,
                    '/stalker_portal/server/load.php'
                );
            }
            // Simple URL: example.com/c -> example.com/portal.php
            return url.replace(/\/c$/, '/portal.php');
        }

        // Case 2: Full stalker portal URL without /c at the end
        if (
            url.includes('/stalker_portal') &&
            !url.includes('/server/load.php')
        ) {
            // example.com/stalker_portal -> example.com/stalker_portal/server/load.php
            if (url.endsWith('/stalker_portal')) {
                return url + '/server/load.php';
            }
            // If it has other path segments after /stalker_portal, append server/load.php
            if (!url.endsWith('/load.php')) {
                return url.replace(
                    /\/stalker_portal(\/.*)?$/,
                    '/stalker_portal/server/load.php'
                );
            }
        }

        // Otherwise keep the provided url
        return url;
    }
}
