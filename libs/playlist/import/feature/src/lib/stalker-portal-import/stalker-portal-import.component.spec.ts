import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { StalkerSessionService } from '@iptvnator/portal/stalker/data-access';
import { StalkerPortalImportComponent } from './stalker-portal-import.component';

describe('StalkerPortalImportComponent', () => {
    let component: StalkerPortalImportComponent;
    let authenticate: jest.Mock;
    let store: { dispatch: jest.Mock };

    beforeEach(() => {
        authenticate = jest.fn();
        store = { dispatch: jest.fn() };

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: StalkerSessionService,
                    useValue: { authenticate },
                },
                { provide: Store, useValue: store },
                { provide: MatSnackBar, useValue: { open: jest.fn() } },
            ],
        });

        component = TestBed.runInInjectionContext(
            () => new StalkerPortalImportComponent()
        );
        component.form.patchValue({
            title: 'Demo portal',
            portalUrl: 'https://example.test/stalker_portal/c',
            macAddress: '00:1A:79:00:00:01',
        });
    });

    it('authenticates the normalized portal and reports an online connection', async () => {
        authenticate.mockResolvedValue({ token: 'token-1' });

        await component.testConnection();

        expect(authenticate).toHaveBeenCalledWith(
            'https://example.test/stalker_portal/server/load.php',
            '00:1A:79:00:00:01'
        );
        expect(component.connectionStatus()).toBe('online');
        expect(component.isTestingConnection()).toBe(false);
    });

    it('distinguishes rejected portals from unreachable portals', async () => {
        authenticate.mockRejectedValueOnce(
            new Error('HTTP Error: Unauthorized (status: 401)')
        );

        await component.testConnection();
        expect(component.connectionStatus()).toBe('offline');

        authenticate.mockRejectedValueOnce(
            new Error('getaddrinfo ENOTFOUND example.test')
        );

        await component.testConnection();
        expect(component.connectionStatus()).toBe('unavailable');
        expect(component.isTestingConnection()).toBe(false);
    });

    it('clears the previous connection result when the form is reset', async () => {
        authenticate.mockResolvedValue({ token: 'token-1' });
        await component.testConnection();

        component.clearForm();

        expect(component.connectionStatus()).toBeNull();
    });

    it('imports full portals with MAC-only identity fields', async () => {
        authenticate.mockResolvedValue({ token: 'token-1' });
        component.form.patchValue({
            _id: 'playlist-1',
            title: 'MAC Only Portal',
            macAddress: '00:1A:79:AA:BB:CC',
            portalUrl: 'https://portal.example.com/stalker_portal/c',
            importDate: '2026-05-15T00:00:00.000Z',
        });

        await component.addPlaylist();

        expect(authenticate).toHaveBeenCalledWith(
            'https://portal.example.com/stalker_portal/server/load.php',
            '00:1A:79:AA:BB:CC'
        );

        const playlist = store.dispatch.mock.calls[0][0].playlist;
        expect(playlist.stalkerSerialNumber).toBeUndefined();
        expect(playlist.stalkerDeviceId1).toBeUndefined();
        expect(playlist.stalkerDeviceId2).toBeUndefined();
        expect(playlist.stalkerSignature1).toBeUndefined();
        expect(playlist.stalkerSignature2).toBeUndefined();
        expect(component.form.contains('serialNumber')).toBe(false);
        expect(component.form.contains('deviceId1')).toBe(false);
        expect(component.form.contains('deviceId2')).toBe(false);
        expect(component.form.contains('signature1')).toBe(false);
        expect(component.form.contains('signature2')).toBe(false);
    });
});
