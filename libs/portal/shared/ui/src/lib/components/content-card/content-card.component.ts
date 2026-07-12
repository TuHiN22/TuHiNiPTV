import { DatePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    input,
    output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
    selector: 'app-content-card',
    standalone: true,
    imports: [DatePipe, MatIcon, MatIconButton, MatTooltip],
    templateUrl: './content-card.component.html',
    styleUrl: './content-card.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentCardComponent {
    /** URL of the poster image */
    readonly posterUrl = input<string>();

    /** Title to display */
    readonly title = input.required<string>();

    /** Content type (live, movie, series) */
    readonly type = input<string>();

    /** Optional date to display (Date, string, or timestamp number) */
    readonly date = input<Date | string | number>();

    /** Whether to show the remove button */
    readonly showRemoveButton = input<boolean>(false);

    /** Tooltip text for the remove button */
    readonly removeTooltip = input<string>('Remove');

    /** Whether to show placeholder when no poster */
    readonly showPlaceholder = input<boolean>(true);

    /** Whether to render the type badge (live/movie/series) on the poster */
    readonly showTypeBadge = input<boolean>(true);

    /** Emitted when the card is clicked */
    readonly cardClick = output<void>();

    /** Emitted when the remove button is clicked */
    readonly remove = output<void>();
    readonly currentLocale = () => 'en-US';

    /** Get the icon for the placeholder based on type */
    getPlaceholderIcon(): string {
        switch (this.type()) {
            case 'live':
                return 'live_tv';
            case 'radio':
                return 'radio';
            case 'series':
                return 'tv';
            default:
                return 'movie';
        }
    }

    onCardClick(): void {
        this.cardClick.emit();
    }

    onRemoveClick(event: Event): void {
        event.stopPropagation();
        this.remove.emit();
    }

    onImageError(event: Event): void {
        (event.target as HTMLImageElement).src =
            './assets/images/default-poster.png';
    }
}
