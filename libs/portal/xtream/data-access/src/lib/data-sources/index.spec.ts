import { TestBed } from '@angular/core/testing';
import {
    PLAYLIST_DELETE_CLEANUP,
    PlaylistDeleteCleanup,
} from '@iptvnator/services';
import { ElectronXtreamDataSource, provideXtreamDataSource } from './index';
import {
    IXtreamDataSource,
    XTREAM_DATA_SOURCE,
} from './xtream-data-source.interface';

describe('provideXtreamDataSource', () => {
    let electronSource: IXtreamDataSource;

    function configure(): void {
        electronSource = {
            deletePlaylist: jest.fn().mockResolvedValue(undefined),
        } as Partial<IXtreamDataSource> as IXtreamDataSource;

        TestBed.configureTestingModule({
            providers: [
                ...provideXtreamDataSource(),
                {
                    provide: ElectronXtreamDataSource,
                    useValue: electronSource,
                },
            ],
        });
    }

    afterEach(() => TestBed.resetTestingModule());

    it('uses the Electron (SQLite) data source', () => {
        configure();

        expect(TestBed.inject(XTREAM_DATA_SOURCE)).toBe(electronSource);
    });

    it('skips playlist sidecar cleanup because SQLite content is removed via DatabaseService', async () => {
        configure();
        const [cleanup] = TestBed.inject(
            PLAYLIST_DELETE_CLEANUP
        ) as PlaylistDeleteCleanup[];

        await cleanup('playlist-1');

        expect(electronSource.deletePlaylist).not.toHaveBeenCalled();
    });
});
