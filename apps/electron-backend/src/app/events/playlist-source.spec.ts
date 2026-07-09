import { sanitizePlaylistContent } from './playlist-source';

describe('sanitizePlaylistContent', () => {
    it('returns content unchanged when #EXTM3U is already first', () => {
        const content = '#EXTM3U\n#EXTINF:-1,Channel\nhttp://example.com/a';
        expect(sanitizePlaylistContent(content)).toBe(content);
    });

    it('strips decorative comment lines before the #EXTM3U header', () => {
        const content = [
            '#=================================',
            '# Developed by: Someone',
            '# Telegram: https://t.me/someone',
            '#EXTM3U url-tvg="http://example.com/epg.xml"',
            '#EXTINF:-1,Channel',
            'http://example.com/a',
        ].join('\n');

        const result = sanitizePlaylistContent(content);

        expect(result.startsWith('#EXTM3U')).toBe(true);
        expect(result).not.toContain('Developed by');
        expect(result).toContain('#EXTINF:-1,Channel');
    });

    it('strips a leading UTF-8 BOM before the header', () => {
        const content = '\uFEFF#EXTM3U\n#EXTINF:-1,Channel\nhttp://example.com/a';
        const result = sanitizePlaylistContent(content);
        expect(result.startsWith('#EXTM3U')).toBe(true);
    });

    it('strips a BOM followed by comment lines before the header', () => {
        const content =
            '\uFEFF# banner line\n#EXTM3U\n#EXTINF:-1,Channel\nhttp://example.com/a';
        const result = sanitizePlaylistContent(content);
        expect(result.startsWith('#EXTM3U')).toBe(true);
        expect(result).not.toContain('banner line');
    });

    it('tolerates leading whitespace before the header token', () => {
        const content =
            '# banner\n   #EXTM3U\n#EXTINF:-1,Channel\nhttp://example.com/a';
        const result = sanitizePlaylistContent(content);
        expect(result.startsWith('#EXTM3U')).toBe(true);
    });

    it('leaves content untouched when no #EXTM3U header is present', () => {
        const content = '# just some notes\nnot a playlist';
        expect(sanitizePlaylistContent(content)).toBe(content);
    });
});
