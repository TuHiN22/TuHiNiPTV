import { inject, Injectable } from '@angular/core';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';
import { STORE_KEY, Theme } from '@iptvnator/shared/interfaces';

type LegacyMediaQueryList = MediaQueryList & {
    addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

@Injectable({
    providedIn: 'root',
})
export class SettingsService {
    private storage = inject(StorageMap);
    private readonly systemThemeMediaQuery =
        typeof window !== 'undefined' && 'matchMedia' in window
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : null;
    private readonly systemThemeChangeHandler = (
        event: MediaQueryListEvent
    ): void => {
        this.applyResolvedTheme(
            event.matches ? Theme.DarkTheme : Theme.LightTheme
        );
    };
    private isSystemThemeSyncActive = false;

    /**
     * Changes the visual theme of the application
     * @param selectedTheme theme to set
     */
    changeTheme(selectedTheme: Theme): void {
        this.stopSystemThemeSync();

        if (selectedTheme === Theme.SystemTheme) {
            this.startSystemThemeSync();
            this.applyResolvedTheme(
                this.systemThemeMediaQuery?.matches
                    ? Theme.DarkTheme
                    : Theme.LightTheme
            );
            return;
        }

        this.applyResolvedTheme(selectedTheme);
    }

    private applyResolvedTheme(selectedTheme: Theme): void {
        if (selectedTheme === Theme.DarkTheme) {
            document.body.classList.add('dark-theme');
            return;
        }

        document.body.classList.remove('dark-theme');
    }

    private startSystemThemeSync(): void {
        if (!this.systemThemeMediaQuery || this.isSystemThemeSyncActive) {
            return;
        }

        const mediaQuery = this.systemThemeMediaQuery as LegacyMediaQueryList;

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener(
                'change',
                this.systemThemeChangeHandler
            );
        } else {
            mediaQuery.addListener?.(this.systemThemeChangeHandler);
        }

        this.isSystemThemeSyncActive = true;
    }

    private stopSystemThemeSync(): void {
        if (!this.systemThemeMediaQuery || !this.isSystemThemeSyncActive) {
            return;
        }

        const mediaQuery = this.systemThemeMediaQuery as LegacyMediaQueryList;

        if (mediaQuery.removeEventListener) {
            mediaQuery.removeEventListener(
                'change',
                this.systemThemeChangeHandler
            );
        } else {
            mediaQuery.removeListener?.(this.systemThemeChangeHandler);
        }

        this.isSystemThemeSyncActive = false;
    }

    /**
     * Returns the value of the given key from the local storage
     * @param key key to get
     * @returns returns the value of the given key
     */
    getValueFromLocalStorage<T = unknown>(key: STORE_KEY): Observable<T> {
        return this.storage.get(key) as Observable<T>;
    }

    /**
     * Sets the given key/value pair in the local storage
     * @param key key to set
     * @param value value to set
     * @param withCallback if true, the callback will be called after the value is set
     */
    setValueToLocalStorage(
        key: STORE_KEY,
        value: unknown,
        withCallback = false
    ): Observable<unknown> | void {
        if (withCallback) {
            return this.storage.set(key, value);
        }

        this.storage.set(key, value).subscribe();
    }

}
