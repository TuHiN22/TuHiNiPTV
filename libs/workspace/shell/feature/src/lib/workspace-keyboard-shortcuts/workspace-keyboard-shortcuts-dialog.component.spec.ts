import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { WorkspaceKeyboardShortcutsDialogComponent } from './workspace-keyboard-shortcuts-dialog.component';

describe('WorkspaceKeyboardShortcutsDialogComponent', () => {
    let fixture: ComponentFixture<WorkspaceKeyboardShortcutsDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkspaceKeyboardShortcutsDialogComponent],
            providers: [
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        groups: [
                            {
                                id: 'global',
                                labelKey: 'Global',
                                icon: 'keyboard',
                                items: [
                                    {
                                        id: 'open-command-palette',
                                        labelKey: 'Open command palette',
                                        icon: 'terminal',
                                        chords: [
                                            {
                                                id: 'Cmd+K',
                                                ariaLabel: 'Command + K',
                                                keys: [
                                                    {
                                                        id: 'cmd',
                                                        label: 'Cmd',
                                                        ariaLabel: 'Command',
                                                        isModifier: true,
                                                    },
                                                    {
                                                        id: 'k',
                                                        label: 'K',
                                                        ariaLabel: 'K',
                                                        isModifier: false,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        id: 'play-pause',
                                        labelKey:
                                            'Play or pause embedded MPV playback',
                                        icon: 'play_arrow',
                                        chords: [
                                            {
                                                id: 'Space',
                                                ariaLabel: 'Space',
                                                keys: [
                                                    {
                                                        id: 'space',
                                                        label: 'Space',
                                                        ariaLabel: 'Space',
                                                        isModifier: false,
                                                    },
                                                ],
                                            },
                                            {
                                                id: 'K',
                                                ariaLabel: 'K',
                                                keys: [
                                                    {
                                                        id: 'k',
                                                        label: 'K',
                                                        ariaLabel: 'K',
                                                        isModifier: false,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                        platformIcon: 'laptop_mac',
                        platformLabelKey: 'macOS layout',
                    },
                },
                {
                    provide: MatDialogRef,
                    useValue: { close: jest.fn() },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(
            WorkspaceKeyboardShortcutsDialogComponent
        );
        fixture.detectChanges();
    });

    it('renders the dialog title and groups', () => {
        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Keyboard shortcuts');
        expect(text).toContain('Global');
    });

    it('renders shortcut labels and multiple keys', () => {
        const text = fixture.nativeElement.textContent;

        expect(text).toContain('Open command palette');
        expect(text).toContain('Play or pause embedded MPV playback');
        expect(text).toContain('Cmd');
        expect(text).toContain('Space');
        expect(text).toContain('K');
    });

    it('renders the detected platform label', () => {
        expect(fixture.nativeElement.textContent).toContain('macOS layout');
    });
});
