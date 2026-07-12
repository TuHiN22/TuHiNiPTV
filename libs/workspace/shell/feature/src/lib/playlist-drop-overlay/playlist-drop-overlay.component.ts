import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

export type PlaylistDropOverlayState =
    | { kind: 'idle' }
    | { kind: 'dragging' }
    | { kind: 'rejected'; reason: 'unsupported' | 'empty' | 'read-error' };

@Component({
    selector: 'app-playlist-drop-overlay',
    templateUrl: './playlist-drop-overlay.component.html',
    styleUrl: './playlist-drop-overlay.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon],
    host: {
        '[class.is-visible]': 'isVisible()',
        '[attr.aria-hidden]': '!isVisible()',
    },
})
export class PlaylistDropOverlayComponent {
    readonly state = input<PlaylistDropOverlayState>({ kind: 'idle' });

    readonly isVisible = (): boolean => this.state().kind !== 'idle';

    readonly isRejected = (): boolean => this.state().kind === 'rejected';

    readonly rejectionKey = (): string => {
        const current = this.state();
        if (current.kind !== 'rejected') return '';
        switch (current.reason) {
            case 'unsupported':
                return 'Unsupported file type';
            case 'empty':
                return 'That file is empty';
            case 'read-error':
                return 'Could not read that file';
        }
    };
}
