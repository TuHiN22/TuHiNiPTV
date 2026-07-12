import { Component, input, output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-settings-backup-section',
    imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './settings-backup-section.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [':host { display: contents; }'],
})
export class SettingsBackupSectionComponent {
    readonly activeSection = input.required<string>();
    readonly isPwa = input(false);
    readonly isRemovingAllPlaylists = input(false);
    readonly isExportingData = input(false);

    readonly importData = output<void>();
    readonly exportData = output<void>();
}
