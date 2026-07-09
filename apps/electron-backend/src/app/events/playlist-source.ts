import type { Playlist } from '@iptvnator/shared/interfaces';
import {
    createPlaylistObject,
    getFilenameFromUrl,
} from '@iptvnator/shared/m3u-utils';
import { parse } from 'iptv-playlist-parser';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createPlaylistAgentFactory } from '../util/secure-https';
import {
    createInvalidTlsCertificateError,
    getHostnameFromErrorUrl,
    isInvalidTlsCertificateError,
} from '../util/security-errors';
import { requestWithValidatedRedirects } from '../util/validated-axios';

export interface PlaylistFetchOptions {
    trustedInsecureTlsHosts?: readonly string[];
}

/**
 * Normalizes raw playlist text so it parses reliably.
 *
 * Some providers prepend decorative banners/comment lines (e.g. `#====`,
 * `# Developed by ...`) before the `#EXTM3U` header. `iptv-playlist-parser`
 * expects `#EXTM3U` to be the first meaningful line, so those leading lines
 * make it treat the file as empty/invalid. Strip a leading UTF-8 BOM and any
 * lines before the first `#EXTM3U` header. If no header is present the content
 * is returned unchanged so the caller's own error handling still applies.
 */
export function sanitizePlaylistContent(content: string): string {
    const withoutBom = content.replace(/^\uFEFF/, '');
    // Match the header token itself (ignoring any leading indentation) so the
    // returned content always begins exactly at `#EXTM3U`.
    const headerMatch = /#EXTM3U\b/i.exec(withoutBom);
    if (!headerMatch || headerMatch.index === 0) {
        return withoutBom;
    }
    return withoutBom.slice(headerMatch.index);
}

export async function fetchPlaylistFromUrl(
    url: string,
    title?: string,
    options: PlaylistFetchOptions = {}
): Promise<Playlist> {
    let result;
    try {
        result = await requestWithValidatedRedirects<string>(
            url,
            {
                agentFactory: createPlaylistAgentFactory({
                    trustedInsecureTlsHosts: options.trustedInsecureTlsHosts,
                }),
                method: 'GET',
            },
            { allowPrivateNetworks: true }
        );
    } catch (error) {
        if (isInvalidTlsCertificateError(error)) {
            throw createInvalidTlsCertificateError(
                getHostnameFromErrorUrl(error, url)
            );
        }
        throw error;
    }

    const parsedPlaylist = parse(sanitizePlaylistContent(result.data));
    const extractedName = url && url.length > 1 ? getFilenameFromUrl(url) : '';
    const playlistName =
        !extractedName || extractedName === 'Untitled playlist'
            ? 'Imported from URL'
            : extractedName;

    return createPlaylistObject(
        title ?? playlistName,
        parsedPlaylist,
        url,
        'URL'
    );
}

export async function fetchPlaylistFromFile(
    filePath: string,
    title: string
): Promise<Playlist> {
    const fileContent = await readFile(filePath, 'utf-8');
    return createPlaylistObject(
        title,
        parse(sanitizePlaylistContent(fileContent)),
        filePath,
        'FILE'
    );
}

export function derivePlaylistTitleFromFilePath(filePath: string): string {
    const filename = basename(filePath);
    return filename.replace(/\.(m3u8?|pls|txt)$/i, '') || 'from file';
}

export function preserveAutoUpdatedPlaylistFields(
    playlistObject: Playlist,
    playlist: Playlist
): Playlist {
    return {
        ...playlistObject,
        _id: playlist._id,
        autoRefresh: playlist.autoRefresh,
        favorites: playlist.favorites || [],
        userAgent: playlist.userAgent,
    };
}
