import { TMDB_BASE_URL, TMDB_API_KEY } from '../config';

const request = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB Error: ${res.status}`);
  return res.json();
};

export const searchMulti = (query) =>
  request('/search/multi', { query, include_adult: false });

export const getMovieDetails = (id) =>
  request(`/movie/${id}`, { append_to_response: 'videos,credits,similar,release_dates' });

export const getTVDetails = (id) =>
  request(`/tv/${id}`, { append_to_response: 'videos,credits,similar,content_ratings' });

export const getMovieVideos = (id) => request(`/movie/${id}/videos`);
export const getTVVideos = (id) => request(`/tv/${id}/videos`);

export const getTVSeasonDetails = (id, seasonNumber) =>
  request(`/tv/${id}/season/${seasonNumber}`);

export const getMovieCredits = (id) => request(`/movie/${id}/credits`);
export const getTVCredits = (id) => request(`/tv/${id}/aggregate_credits`);

export const getSimilarMovies = (id) => request(`/movie/${id}/similar`);
export const getSimilarTV = (id) => request(`/tv/${id}/similar`);

export const getPopularMovies = () => request('/movie/popular');
export const getTopRatedMovies = () => request('/movie/top_rated');
export const getNowPlaying = () => request('/movie/now_playing');

export const extractTrailer = (videos) => {
  if (!videos?.results) return null;
  const priority = ['Official Trailer', 'Trailer', 'Teaser', 'Clip', 'Featurette'];
  for (const label of priority) {
    const found = videos.results.find(
      (v) =>
        v.site === 'YouTube' &&
        v.type !== 'Behind the Scenes' &&
        v.name.toLowerCase().includes(label.toLowerCase())
    );
    if (found) return found;
  }
  return videos.results.find((v) => v.site === 'YouTube') || null;
};

export const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const formatMoney = (amount) => {
  if (!amount) return 'N/A';
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  return `$${amount.toLocaleString()}`;
};

export const getContentRating = (details, mediaType) => {
  if (mediaType === 'movie') {
    const usReleases = details.release_dates?.results?.find((r) => r.iso_3166_1 === 'US');
    return usReleases?.release_dates?.[0]?.certification || null;
  } else {
    const usRating = details.content_ratings?.results?.find((r) => r.iso_3166_1 === 'US');
    return usRating?.rating || null;
  }
};