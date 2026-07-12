import { ClipboardModule } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import {
    getM3uArchiveDays,
    isM3uCatchupPlaybackSupported,
} from '@iptvnator/shared/m3u-utils';
import { Channel } from '@iptvnator/shared/interfaces';

interface ChannelDetailField {
    readonly empty?: boolean;
    readonly labelKey: string;
    readonly monospace?: boolean;
    readonly value: string;
}

interface HeroStat {
    readonly empty?: boolean;
    readonly icon: string;
    readonly labelKey: string;
    readonly mono?: boolean;
    readonly value: string;
}

@Component({
    selector: 'app-channel-details-dialog',
    templateUrl: './channel-details-dialog.component.html',
    styleUrls: ['./channel-details-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ClipboardModule, MatButtonModule, MatDialogModule, MatIconModule],
})
export class ChannelDetailsDialogComponent {
    readonly channel = inject<Channel>(MAT_DIALOG_DATA);

    readonly archiveDays = getM3uArchiveDays(this.channel);
    readonly catchupAvailable = this.archiveDays > 0;
    readonly catchupPlaybackSupported = isM3uCatchupPlaybackSupported(
        this.channel
    );

    logoError = false;

    readonly hasTvgData = !!(
        this.channel.tvg?.id ||
        this.channel.tvg?.name ||
        this.channel.tvg?.url ||
        this.channel.tvg?.rec
    );

    readonly hasHttpData = !!(
        this.channel.http?.origin ||
        this.channel.http?.referrer ||
        this.channel.http?.['user-agent']
    );

    readonly heroStats: HeroStat[] = [
        {
            icon: 'tag',
            labelKey: 'Channel ID',
            value: this.channel.id?.trim() || 'Not provided',
            mono: true,
            empty: !this.channel.id?.trim(),
        },
        {
            icon: 'folder',
            labelKey: 'Group',
            value: this.channel.group?.title?.trim() || 'Not provided',
            empty: !this.channel.group?.title?.trim(),
        },
        this.createArchiveHeroStat(),
        {
            icon: 'schedule',
            labelKey: 'Timeshift',
            value: this.channel.timeshift?.trim() || 'Not available',
            empty: !this.channel.timeshift?.trim(),
        },
    ];

    readonly streamFields: ChannelDetailField[] = [
        this.field('EPG params', this.channel.epgParams, true),
        this.field('TVG logo', this.channel.tvg?.logo, true),
    ];

    readonly tvgFields: ChannelDetailField[] = [
        this.field('TVG ID', this.channel.tvg?.id, true),
        this.field('TVG name', this.channel.tvg?.name),
        this.field('TVG URL', this.channel.tvg?.url, true),
        this.field('TVG rec', this.channel.tvg?.rec),
    ];

    readonly catchupFields: ChannelDetailField[] = [
        this.field('Catchup source', this.channel.catchup?.source, true),
        this.field('Catchup days', this.channel.catchup?.days),
    ];

    readonly httpFields: ChannelDetailField[] = [
        this.field('Origin', this.channel.http?.origin, true),
        this.field('Referrer', this.channel.http?.referrer, true),
        this.field('User-Agent', this.channel.http?.['user-agent'], true),
    ];

    private createArchiveHeroStat(): HeroStat {
        if (!this.catchupAvailable) {
            return {
                empty: true,
                icon: 'history',
                labelKey: 'Archive window',
                value: 'Not available',
            };
        }

        return {
            icon: 'history',
            labelKey: 'Archive window',
            value:
                this.archiveDays === 1 ? '1 day' : `${this.archiveDays} days`,
        };
    }

    private field(
        labelKey: string,
        value: string | null | undefined,
        monospace = false
    ): ChannelDetailField {
        const normalized = value?.trim() ?? '';

        if (!normalized) {
            return {
                empty: true,
                labelKey,
                monospace,
                value: 'Not provided',
            };
        }

        return { labelKey, monospace, value: normalized };
    }
}
