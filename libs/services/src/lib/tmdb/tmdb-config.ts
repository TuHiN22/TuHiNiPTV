export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
export const TMDB_POSTER_SIZE = 'w500';
export const TMDB_BACKDROP_SIZE = 'w1280';
export const TMDB_PROFILE_SIZE = 'w185';
export const TMDB_STILL_SIZE = 'w300';

/**
 * Embedded application API key used when the user has not configured their
 * own key in settings. Empty by design: distributed builds ship without a
 * key (each user brings their own — that matches TMDB's personal-use
 * terms). CI can optionally inject a key via the TMDB_API_KEY secret and
 * tools/tmdb/inject-tmdb-key.mjs. With no key available, enrichment stays
 * inactive even when enabled in settings.
 */
export const DEFAULT_TMDB_API_KEY = '';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long cached TMDB details payloads stay fresh */
export const TMDB_DETAILS_CACHE_TTL_MS = 30 * DAY_MS;
/** How long a resolved title→id match stays fresh */
export const TMDB_MATCH_CACHE_TTL_MS = 30 * DAY_MS;
/** Negative matches retry sooner — providers fix titles, TMDB adds entries */
export const TMDB_NEGATIVE_MATCH_CACHE_TTL_MS = 7 * DAY_MS;

/** Weekly trending rotates slowly — refresh the dashboard rail daily */
export const TMDB_TRENDING_CACHE_TTL_MS = 1 * DAY_MS;

export const TMDB_LANGUAGE = 'en-US';

export function tmdbPosterUrl(path: string | null | undefined): string | null {
    return path ? `${TMDB_IMAGE_BASE_URL}/${TMDB_POSTER_SIZE}${path}` : null;
}

export function tmdbBackdropUrl(
    path: string | null | undefined
): string | null {
    return path ? `${TMDB_IMAGE_BASE_URL}/${TMDB_BACKDROP_SIZE}${path}` : null;
}

export function tmdbProfileUrl(path: string | null | undefined): string | null {
    return path ? `${TMDB_IMAGE_BASE_URL}/${TMDB_PROFILE_SIZE}${path}` : null;
}

export function tmdbStillUrl(path: string | null | undefined): string | null {
    return path ? `${TMDB_IMAGE_BASE_URL}/${TMDB_STILL_SIZE}${path}` : null;
}
