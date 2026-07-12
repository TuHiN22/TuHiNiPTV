import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WorkspaceShellXtreamImportService } from '../../services/workspace-shell-xtream-import.service';

@Component({
    selector: 'app-workspace-shell-import-overlay',
    imports: [MatButtonModule, MatProgressBarModule],
    templateUrl: './workspace-shell-import-overlay.component.html',
    styleUrl: './workspace-shell-import-overlay.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceShellImportOverlayComponent {
    protected readonly xtreamImport = inject(WorkspaceShellXtreamImportService);

    onCancel(): void {
        this.xtreamImport.cancelXtreamImport();
    }
}
