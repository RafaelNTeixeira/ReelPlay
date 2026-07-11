import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// -- Supabase client (lazy, only if configured) -----------------
let _supabase = null;
const db = () => {
  if (!_supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
};

// -- Shape converters -------------------------------------------
const fromDb = (row) => ({
  id: row.id,
  tmdbId: row.tmdb_id,
  mediaType: row.media_type,
  title: row.title,
  posterPath: row.poster_path,
  backdropPath: row.backdrop_path,
  rating: row.rating,
  reviewTitle: row.review_title,
  reviewText: row.review_text,
  watchedDate: row.watched_date,
  recommended: row.recommended,
  containsSpoilers: row.contains_spoilers,
  reviewerPick: row.reviewer_pick ?? false,
  episodeRatings: row.episode_ratings || {},
  rewatchCount: row.rewatch_count ?? 0,
  year: row.year,
  genres: row.genres || [],
  tmdbRating: row.tmdb_rating,
  runtime: row.runtime,
  director: row.director,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toDb = (r) => ({
  id: r.id,
  tmdb_id: r.tmdbId,
  media_type: r.mediaType,
  title: r.title,
  poster_path: r.posterPath,
  backdrop_path: r.backdropPath,
  rating: r.rating,
  review_title: r.reviewTitle,
  review_text: r.reviewText,
  watched_date: r.watchedDate,
  recommended: r.recommended,
  contains_spoilers: r.containsSpoilers,
  reviewer_pick: r.reviewerPick ?? false,
  episode_ratings: r.episodeRatings ?? {},
  rewatch_count: r.rewatchCount ?? 0,
  year: r.year,
  genres: r.genres,
  tmdb_rating: r.tmdbRating,
  runtime: r.runtime,
  director: r.director,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

// -- LocalStorage fallback --------------------------------------
const LS_KEY = 'reelplay_reviews';
const ls = {
  all: () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; } },
  set: (data) => localStorage.setItem(LS_KEY, JSON.stringify(data)),
};

// -- Public API (all async) -------------------------------------

export const getReviews = async () => {
  const client = db();
  if (client) {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data.map(fromDb);
  }
  return ls.all();
};

export const getReview = async (tmdbId, mediaType) => {
  const client = db();
  if (client) {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
      .maybeSingle();
    if (!error) return data ? fromDb(data) : null;
  }
  return ls.all().find((r) => r.tmdbId === tmdbId && r.mediaType === mediaType) || null;
};

// -- Shared upsert (used by saveReview and saveEpisodeRating) ---
const upsertRow = async (id, review) => {
  const client = db();
  if (client) {
    const { data, error } = await client
      .from('reviews')
      .upsert(toDb(review), { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('Supabase write failed:', error);
      throw new Error(
        `Could not save to Supabase (${error.message}). This is usually a Row Level Security policy blocking writes. Nothing was saved — your data was NOT silently stored elsewhere.`
      );
    }
    return fromDb(data);
  }
  // LocalStorage fallback — only used when Supabase isn't configured at all
  const all = ls.all();
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) all[idx] = review; else all.unshift(review);
  ls.set(all);
  return review;
};

export const saveReview = async (reviewData) => {
  const id = `${reviewData.tmdbId}-${reviewData.mediaType}`;
  const now = new Date().toISOString();
  const existing = await getReview(reviewData.tmdbId, reviewData.mediaType);

  const review = {
    episodeRatings: existing?.episodeRatings || {},
    ...reviewData,
    id,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
  return upsertRow(id, review);
};

// -- Per-episode ratings (independent of the overall series review) ---
// `seed` supplies title/poster/etc. so a first-time episode rating can
// create a minimal review row even if no overall review exists yet.
export const saveEpisodeRating = async (tmdbId, mediaType, seasonNumber, episodeNumber, rating, seed = {}) => {
  const id = `${tmdbId}-${mediaType}`;
  const now = new Date().toISOString();
  const existing = await getReview(tmdbId, mediaType);

  const episodeRatings = { ...(existing?.episodeRatings || {}) };
  const seasonKey = String(seasonNumber);
  const seasonRatings = { ...(episodeRatings[seasonKey] || {}) };
  if (rating > 0) {
    seasonRatings[String(episodeNumber)] = rating;
  } else {
    delete seasonRatings[String(episodeNumber)];
  }
  if (Object.keys(seasonRatings).length > 0) {
    episodeRatings[seasonKey] = seasonRatings;
  } else {
    delete episodeRatings[seasonKey];
  }

  const review = {
    tmdbId,
    mediaType,
    title: seed.title ?? null,
    posterPath: seed.posterPath ?? null,
    backdropPath: seed.backdropPath ?? null,
    rating: 0,
    reviewTitle: '',
    reviewText: '',
    watchedDate: null,
    recommended: false,
    containsSpoilers: false,
    reviewerPick: false,
    year: seed.year ?? null,
    genres: seed.genres ?? [],
    tmdbRating: seed.tmdbRating ?? null,
    runtime: null,
    director: null,
    ...existing,
    episodeRatings,
    id,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
  return upsertRow(id, review);
};

// -- Quick rewatch logging (admin can +1 without opening the edit form) ---
export const logRewatch = async (tmdbId, mediaType) => {
  const id = `${tmdbId}-${mediaType}`;
  const existing = await getReview(tmdbId, mediaType);
  if (!existing) throw new Error('Write an overall review before logging a rewatch.');
  const review = {
    ...existing,
    rewatchCount: (existing.rewatchCount || 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  return upsertRow(id, review);
};

// -- Partial flag updates (used by the bulk admin manager) ---
export const updateReviewFlags = async (tmdbId, mediaType, patch) => {
  const id = `${tmdbId}-${mediaType}`;
  const existing = await getReview(tmdbId, mediaType);
  if (!existing) throw new Error('Review not found — write an overall review first.');
  const review = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  return upsertRow(id, review);
};

export const deleteReview = async (tmdbId, mediaType) => {
  const client = db();
  if (client) {
    const { error } = await client
      .from('reviews')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType);
    if (error) {
      console.error('Supabase deleteReview failed:', error);
      throw new Error(`Could not delete from Supabase (${error.message}).`);
    }
    return;
  }
  ls.set(ls.all().filter((r) => !(r.tmdbId === tmdbId && r.mediaType === mediaType)));
};

export const getStats = async () => {
  const all = await getReviews();
  const reviews = all.filter((r) => r.rating > 0); // exclude in-progress stubs (episode-only ratings, no overall review)
  const ratings = reviews.map((r) => r.rating).filter(Boolean);
  const avg = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : null;
  return {
    total: reviews.length,
    movies: reviews.filter((r) => r.mediaType === 'movie').length,
    tv: reviews.filter((r) => r.mediaType === 'tv').length,
    games: reviews.filter((r) => r.mediaType === 'game').length,
    recommended: reviews.filter((r) => r.recommended).length,
    picks: reviews.filter((r) => r.reviewerPick).length,
    avgRating: avg,
  };
};

// ═══════════════════════════════════════════════════════════════
// WATCHLIST — separate table from reviews (unwatched/unplayed titles)
// ═══════════════════════════════════════════════════════════════

const fromWatchlistDb = (row) => ({
  id: row.id,
  tmdbId: row.tmdb_id,
  mediaType: row.media_type,
  title: row.title,
  posterPath: row.poster_path,
  backdropPath: row.backdrop_path,
  year: row.year,
  genres: row.genres || [],
  tmdbRating: row.tmdb_rating,
  addedAt: row.added_at,
});

const toWatchlistDb = (w) => ({
  id: w.id,
  tmdb_id: w.tmdbId,
  media_type: w.mediaType,
  title: w.title,
  poster_path: w.posterPath,
  backdrop_path: w.backdropPath,
  year: w.year,
  genres: w.genres,
  tmdb_rating: w.tmdbRating,
  added_at: w.addedAt,
});

const LS_WATCHLIST_KEY = 'reelplay_watchlist';
const lsWatchlist = {
  all: () => { try { return JSON.parse(localStorage.getItem(LS_WATCHLIST_KEY) || '[]'); } catch { return []; } },
  set: (data) => localStorage.setItem(LS_WATCHLIST_KEY, JSON.stringify(data)),
};

export const getWatchlist = async () => {
  const client = db();
  if (client) {
    const { data, error } = await client
      .from('watchlist')
      .select('*')
      .order('added_at', { ascending: false });
    if (!error && data) return data.map(fromWatchlistDb);
  }
  return lsWatchlist.all();
};

export const addToWatchlist = async (item) => {
  const id = `${item.tmdbId}-${item.mediaType}`;
  const entry = { ...item, id, addedAt: new Date().toISOString() };
  const client = db();
  if (client) {
    const { data, error } = await client
      .from('watchlist')
      .upsert(toWatchlistDb(entry), { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('Supabase addToWatchlist failed:', error);
      throw new Error(`Could not add to watchlist (${error.message}). Make sure the "watchlist" table exists with RLS policies allowing writes.`);
    }
    return fromWatchlistDb(data);
  }
  const all = lsWatchlist.all();
  const idx = all.findIndex((w) => w.id === id);
  if (idx >= 0) all[idx] = entry; else all.unshift(entry);
  lsWatchlist.set(all);
  return entry;
};

export const removeFromWatchlist = async (tmdbId, mediaType) => {
  const id = `${tmdbId}-${mediaType}`;
  const client = db();
  if (client) {
    const { error } = await client.from('watchlist').delete().eq('id', id);
    if (error) {
      console.error('Supabase removeFromWatchlist failed:', error);
      throw new Error(`Could not remove from watchlist (${error.message}).`);
    }
    return;
  }
  lsWatchlist.set(lsWatchlist.all().filter((w) => w.id !== id));
};