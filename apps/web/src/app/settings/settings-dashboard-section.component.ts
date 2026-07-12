import { CommonModule } from '@angular/common';
import { Component, input, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-settings-dashboard-section',
    imports: [
        CommonModule,
        MatCheckboxModule,
        MatIconModule,
        ReactiveFormsModule,
    ],
    templateUrl: './settings-dashboard-section.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [':host { display: contents; }'],
})
export class SettingsDashboardSectionComponent {
    readonly form = input.required<FormGroup>();
    readonly activeSection = input.required<string>();
}
