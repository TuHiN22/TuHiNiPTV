import { TestBed } from '@angular/core/testing';
import { EpgTimelineEmptyStateComponent } from './epg-timeline-empty-state.component';

describe('EpgTimelineEmptyStateComponent', () => {
    function create(reason: string) {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            imports: [EpgTimelineEmptyStateComponent],
        });
        const fixture = TestBed.createComponent(EpgTimelineEmptyStateComponent);
        fixture.componentRef.setInput('reason', reason);
        return fixture.componentInstance;
    }

    it('returns no preset for the "none" reason', () => {
        expect(create('none').preset()).toBeNull();
    });

    it('uses the action tone + plug icon for m3u setup', () => {
        const preset = create('m3u-needs-setup').preset();
        expect(preset?.tone).toBe('action');
        expect(preset?.icon).toBe('cable');
    });

    it('uses the warn tone for errors', () => {
        expect(create('error').preset()?.tone).toBe('warn');
    });

    it('uses a neutral tone for informational states', () => {
        expect(create('provider-no-epg').preset()?.tone).toBe('neutral');
        expect(create('channel-unmapped').preset()?.tone).toBe('neutral');
        expect(create('empty-day').preset()?.tone).toBe('neutral');
    });
});
