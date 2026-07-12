import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsDeleteAllPlaylistsDialogComponent } from './settings-delete-all-playlists-dialog.component';

describe('SettingsDeleteAllPlaylistsDialogComponent', () => {
    let component: SettingsDeleteAllPlaylistsDialogComponent;
    let fixture: ComponentFixture<SettingsDeleteAllPlaylistsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SettingsDeleteAllPlaylistsDialogComponent,
                NoopAnimationsModule,
            ],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        summary: {
                            total: 6,
                            m3u: 3,
                            xtream: 2,
                            stalker: 1,
                        },
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(
            SettingsDeleteAllPlaylistsDialogComponent
        );
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('renders the playlist type summary and destructive guidance', () => {
        const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

        expect(component.summaryItems().map((item) => item.count)).toEqual([
            3, 2, 1,
        ]);
        expect(text).toContain('Delete all playlists?');
        expect(text).toContain('Delete all 6 playlists from the app.');
        expect(text).toContain('Playlist sources');
        expect(text).toContain('M3U');
        expect(text).toContain('Xtream');
        expect(text).toContain('Stalker');
        expect(text).toContain('Favorites');
        expect(text).toContain(
            'Use Export first if you want a restorable backup before deleting.'
        );
    });

    it('renders cancel and confirm actions', () => {
        const buttons = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('button')
        ).map((button) => button.textContent?.trim());

        expect(buttons).toEqual(['Cancel', 'Delete everything']);
    });
});
