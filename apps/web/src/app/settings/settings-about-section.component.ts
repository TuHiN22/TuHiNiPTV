import {
    Component,
    computed,
    input,
    output,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
    ELECTRON_BRIDGE_APP_UPDATE_STATUSES,
    ElectronBridgeAppUpdateStatus,
} from '@iptvnator/shared/interfaces';

@Component({
    selector: 'app-settings-about-section',
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './settings-about-section.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [':host { display: contents; }'],
})
export class SettingsAboutSectionComponent {
    readonly activeSection = input.required<string>();
    readonly isDesktop = input(false);
    readonly version = input<string | undefined>();
    readonly updateMessage = input<string | undefined>();
    readonly appUpdateStatus = input<ElectronBridgeAppUpdateStatus | null>(
        null
    );

    readonly checkForAppUpdate = output<void>();
    readonly downloadAppUpdate = output<void>();
    readonly installAppUpdate = output<void>();
    readonly openManualAppUpdate = output<void>();
    readonly openAppUpdateReleaseNotes = output<void>();

    readonly isAppUpdateBusy = computed(() => {
        const status = this.appUpdateStatus()?.status;

        return (
            status === ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Checking ||
            status === ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Downloading
        );
    });

    readonly canDownloadAppUpdate = computed(() => {
        const status = this.appUpdateStatus();

        return (
            status?.supportedSelfUpdate === true &&
            status.status === ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Available
        );
    });

    readonly canInstallAppUpdate = computed(() => {
        const status = this.appUpdateStatus();

        return (
            status?.supportedSelfUpdate === true &&
            status.status === ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Downloaded
        );
    });

    readonly canOpenAppUpdateReleaseNotes = computed(() => {
        const status = this.appUpdateStatus();

        return Boolean(
            status?.currentVersion &&
            status.status !== ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Checking
        );
    });

    readonly canOpenManualAppUpdate = computed(() => {
        const status = this.appUpdateStatus();

        return Boolean(status && !status.supportedSelfUpdate);
    });

    readonly appUpdateStatusLabel = computed(() => {
        const updateStatus = this.appUpdateStatus();
        const status =
            updateStatus?.status ?? ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Idle;
        const version =
            updateStatus?.latestVersion ?? updateStatus?.currentVersion ?? '';

        switch (status) {
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Checking:
                return 'Checking for updates…';
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Available:
                return `Version ${version} is available`;
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.NotAvailable:
                return 'You are using the latest version';
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Downloading:
                return `Downloading version ${version}…`;
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Downloaded:
                return `Version ${version} is ready to install`;
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Unsupported:
                return 'Ready to check for updates';
            case ELECTRON_BRIDGE_APP_UPDATE_STATUSES.Error:
                return 'Update check failed';
            default:
                return 'Ready to check for updates';
        }
    });
}
