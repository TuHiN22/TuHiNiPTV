import {
    provideHttpClient,
    withInterceptorsFromDi,
} from '@angular/common/http';
import {
    ApplicationConfig,
    inject,
    importProvidersFrom,
    provideZoneChangeDetection,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore, routerReducer } from '@ngrx/router-store';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { PlaylistEffects, playlistReducer } from '@iptvnator/m3u-state';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
    PORTAL_EXTERNAL_PLAYBACK,
    PORTAL_PLAYER,
} from '@iptvnator/portal/shared/util';
import { PLAYLIST_PLAYER_ACTIONS } from '@iptvnator/playlist/shared/util';
import { provideXtreamDataSource } from '@iptvnator/portal/xtream/data-access';
import { DataService } from '@iptvnator/services';
import { dbConfig } from '@iptvnator/shared/interfaces';
import { AppConfig } from '../environments/environment';
import { routes } from './app.routes';
import { ElectronService } from './services/electron.service';
import { ExternalPlaybackService } from './services/external-playback.service';
import { PlayerService } from './services/player.service';
import {
    AppPortalNavigationActionsService,
    providePortalNavigationActions,
} from './services/portal-navigation-actions.service';
import { providePortalPlaybackPositions } from './services/portal-playback-positions.service';
import { provideWorkspaceShellActions } from './services/workspace-shell-actions.service';

/**
 * Conditionally provides the necessary service based on the current environment
 */
export function DataFactory() {
    return inject(ElectronService);
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withComponentInputBinding()),
        provideAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideStore({
            router: routerReducer,
            playlistState: playlistReducer,
        }),
        provideEffects([PlaylistEffects]),
        provideRouterStore(),
        ...(AppConfig.production ? [] : [provideStoreDevtools({ maxAge: 25 })]),
        importProvidersFrom(
            NgxIndexedDBModule.forRoot(dbConfig),
            NgxSkeletonLoaderModule.forRoot({
                animation: 'pulse',
                loadingText: 'This item is actually loading...',
            })
        ),
        {
            provide: DataService,
            useFactory: DataFactory,
        },
        {
            provide: PORTAL_PLAYER,
            useExisting: PlayerService,
        },
        {
            provide: PORTAL_EXTERNAL_PLAYBACK,
            useExisting: ExternalPlaybackService,
        },
        ...providePortalPlaybackPositions(),
        ...providePortalNavigationActions(),
        {
            provide: PLAYLIST_PLAYER_ACTIONS,
            useExisting: AppPortalNavigationActionsService,
        },
        ...provideWorkspaceShellActions(),
        ...provideXtreamDataSource(),
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
        },
    ],
};
