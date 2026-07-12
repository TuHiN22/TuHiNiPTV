import { interpolateText } from './interpolate-text';

describe('interpolateText', () => {
    it('replaces named placeholders without a localization runtime', () => {
        expect(
            interpolateText('{{count}} of {{total}} items', {
                count: 2,
                total: 5,
            })
        ).toBe('2 of 5 items');
    });

    it('returns text unchanged when no parameters are supplied', () => {
        expect(interpolateText('English only')).toBe('English only');
    });
});
