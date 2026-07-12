import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { PlaylistErrorViewComponent } from '@iptvnator/portal/shared/ui';
import { XtreamStore } from '@iptvnator/portal/xtream/data-access';
import { XtreamCachedOfflineNoticeComponent } from './xtream-cached-offline-notice.component';

@Component({
    selector: 'app-xtream-content-gate',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        PlaylistErrorViewComponent,
        RouterOutlet,
        XtreamCachedOfflineNoticeComponent,
    ],
    template: `
        @if (contentInitBlockReason(); as blockReason) {
            <div class="xtream-content-gate">
                <app-playlist-error-view
                    [title]="errorView().title"
                    [description]="errorView().description"
                />

                <div class="xtream-content-gate__actions">
                    <button
                        mat-flat-button
                        color="primary"
                        type="button"
                        (click)="retryContentInitialization()"
                    >
                        <mat-icon>refresh</mat-icon>
                        {{ 'Retry' }}
                    </button>
                </div>
            </div>
        } @else {
            <app-xtream-cached-offline-notice />
            <router-outlet />
        }
    `,
    styles: [
        `
            .xtream-content-gate {
                display: grid;
                gap: 16px;
                justify-items: center;
                padding: 24px;
            }

            .xtream-content-gate__actions {
                display: flex;
                justify-content: center;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XtreamContentGateComponent {
    private readonly xtreamStore = inject(XtreamStore);

    readonly contentInitBlockReason = this.xtreamStore.contentInitBlockReason;
    readonly errorView = computed(() => {
        switch (this.contentInitBlockReason()) {
            case 'cancelled':
                return {
                    title: 'Import cancelled',
                    description:
                        'The playlist import was cancelled. Retry when you want to continue loading this source.',
                };
            case 'expired':
                return {
                    title: 'Account expired',
                    description:
                        'This account has been expired. Please check the credentials in playlist settings or remove it.',
                };
            case 'inactive':
                return {
                    title: 'Account inactive',
                    description:
                        'This account is inactive. Please check the credentials in playlist settings or remove it.',
                };
            case 'unavailable':
                return {
                    title: 'Portal unavailable',
                    description:
                        'The portal could not be reached. Check the server URL or retry when the source is available again.',
                };
            case 'error':
            default:
                return {
                    title: 'Something went wrong',
                    description: 'Unknown error, please try again later',
                };
        }
    });

    retryContentInitialization(): void {
        void this.xtreamStore.retryContentInitialization();
    }
}
