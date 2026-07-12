import { TMDB_LANGUAGE } from './tmdb-config';

describe('TMDB_LANGUAGE', () => {
    it('uses English for every metadata request', () => {
        expect(TMDB_LANGUAGE).toBe('en-US');
    });
});
