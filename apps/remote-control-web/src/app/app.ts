import { Component } from '@angular/core';
import { RemoteControlComponent } from '@iptvnator/ui/remote-control';

@Component({
    imports: [RemoteControlComponent],
    selector: 'app-root',
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {}
