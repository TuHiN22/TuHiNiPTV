import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

/**
 * Reasons the timeline ribbon has nothing to show. `none` means programmes are
 * present and the ribbon renders instead of this component.
 */
export type EpgTimelineEmptyReason =
    | 'none'
    | 'empty-day'
    | 'channel-unmapped'
    | 'provider-no-epg'
    | 'm3u-needs-setup'
    | 'error';

type EmptyTone = 'neutral' | 'action' | 'warn';

interface EmptyStatePreset {
    readonly icon: string;
    readonly tone: EmptyTone;
    readonly titleKey: string;
    readonly subKey: string;
}

const PRESETS: Record<
    Exclude<EpgTimelineEmptyReason, 'none'>,
    EmptyStatePreset
> = {
    'empty-day': {
        icon: 'event_busy',
        tone: 'neutral',
        titleKey: 'No programme for this day',
        subKey: "The schedule for the selected day hasn't arrived yet. Other days have data.",
    },
    'channel-unmapped': {
        icon: 'tv_off',
        tone: 'neutral',
        titleKey: 'No programme for this channel',
        subKey: "This channel isn't matched to the EPG source (no tvg-id found). Other channels are unaffected.",
    },
    'provider-no-epg': {
        icon: 'cell_tower',
        tone: 'neutral',
        titleKey: "Provider doesn't supply a guide",
        subKey: "This source doesn't expose a TV guide for any channel. If you need a schedule, ask your provider.",
    },
    'm3u-needs-setup': {
        icon: 'cable',
        tone: 'action',
        titleKey: 'Connect a programme guide',
        subKey: 'M3U playlists need an external EPG source (XMLTV). Add a url-tvg link and the schedule will appear here.',
    },
    error: {
        icon: 'error_outline',
        tone: 'warn',
        titleKey: "Couldn't load the guide",
        subKey: "The EPG source didn't respond. Check your connection or refresh the source.",
    },
};

@Component({
    selector: 'app-epg-timeline-empty-state',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatButton, MatIcon],
    template: `
        @let activePreset = preset();
        @if (activePreset) {
            <div class="epg-empty">
                <div
                    class="epg-empty__icon"
                    [class]="'tone-' + activePreset.tone"
                >
                    <mat-icon>{{ activePreset.icon }}</mat-icon>
                </div>
                <div class="epg-empty__title">
                    {{ activePreset.titleKey }}
                </div>
                <div class="epg-empty__sub">
                    {{ activePreset.subKey }}
                </div>

                @switch (reason()) {
                    @case ('empty-day') {
                        <div class="epg-empty__actions">
                            <button
                                mat-flat-button
                                color="primary"
                                type="button"
                                (click)="jumpToday.emit()"
                            >
                                <mat-icon>my_location</mat-icon>
                                {{ 'Go to today' }}
                            </button>
                            @if (hasOtherDays()) {
                                <button
                                    mat-stroked-button
                                    type="button"
                                    (click)="jumpNearest.emit()"
                                >
                                    {{ 'Nearest day with programme' }}
                                </button>
                            }
                        </div>
                    }
                    @case ('m3u-needs-setup') {
                        <div class="epg-empty__actions">
                            <button
                                mat-flat-button
                                color="primary"
                                type="button"
                                (click)="openSettings.emit()"
                            >
                                <mat-icon>settings</mat-icon>
                                {{ 'Open EPG settings' }}
                            </button>
                        </div>
                    }
                    @case ('error') {
                        <div class="epg-empty__actions">
                            <button
                                mat-flat-button
                                color="primary"
                                type="button"
                                (click)="retry.emit()"
                            >
                                <mat-icon>refresh</mat-icon>
                                {{ 'Retry' }}
                            </button>
                        </div>
                    }
                }
            </div>
        }
    `,
    styleUrl: './epg-timeline-empty-state.component.scss',
})
export class EpgTimelineEmptyStateComponent {
    readonly reason = input.required<EpgTimelineEmptyReason>();
    readonly hasOtherDays = input(false);

    readonly jumpToday = output<void>();
    readonly jumpNearest = output<void>();
    readonly openSettings = output<void>();
    readonly retry = output<void>();

    readonly preset = computed<EmptyStatePreset | null>(() => {
        const reason = this.reason();
        return reason === 'none' ? null : PRESETS[reason];
    });
}
