import { inject, Provider } from '@angular/core';
import { PLAYLIST_DELETE_CLEANUP } from '@iptvnator/services';
import { ElectronXtreamDataSource } from './electron-xtream-data-source';
import {
    IXtreamDataSource,
    XTREAM_DATA_SOURCE,
} from './xtream-data-source.interface';

// Re-export all types and interfaces
export * from './xtream-data-source.interface';
export { ElectronXtreamDataSource } from './electron-xtream-data-source';

/**
 * Factory function that returns the Electron (SQLite DB-first) data source.
 * This is a desktop-only application, so the Electron implementation is always used.
 */
export function xtreamDataSourceFactory(): IXtreamDataSource {
    return inject(ElectronXtreamDataSource);
}

/**
 * Provider for the Xtream data source.
 * Add this to your app providers to enable the data source abstraction.
 */
export function provideXtreamDataSource(): Provider[] {
    return [
        ElectronXtreamDataSource,
        {
            provide: XTREAM_DATA_SOURCE,
            useFactory: xtreamDataSourceFactory,
        },
        {
            provide: PLAYLIST_DELETE_CLEANUP,
            multi: true,
            // Electron playlist deletion must use DatabaseService so SQLite
            // content and sidecars are cleaned together; do not invoke this
            // cleanup path through PlaylistsService.
            useFactory: () => () => Promise.resolve(),
        },
    ];
}
