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
  year: r.year,
  genres: r.genres,
  tmdb_rating: r.tmdbRating,
  runtime: r.runtime,
  director: r.director,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

// -- LocalStorage fallback --------------------------------------
const LS_KEY = 'cineverse_reviews';
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

export const saveReview = async (reviewData) => {
  const id = `${reviewData.tmdbId}-${reviewData.mediaType}`;
  const now = new Date().toISOString();
  const client = db();

  if (client) {
    const { data: existing } = await client
      .from('reviews')
      .select('created_at')
      .eq('id', id)
      .maybeSingle();

    const review = {
      ...reviewData,
      id,
      updatedAt: now,
      createdAt: existing?.created_at || now,
    };

    const { data, error } = await client
      .from('reviews')
      .upsert(toDb(review), { onConflict: 'id' })
      .select()
      .single();

    if (!error && data) return fromDb(data);
  }

  // LocalStorage fallback
  const all = ls.all();
  const idx = all.findIndex((r) => r.id === id);
  const review = {
    ...reviewData,
    id,
    updatedAt: now,
    createdAt: idx >= 0 ? all[idx].createdAt : now,
  };
  if (idx >= 0) all[idx] = review; else all.unshift(review);
  ls.set(all);
  return review;
};

export const deleteReview = async (tmdbId, mediaType) => {
  const client = db();
  if (client) {
    await client
      .from('reviews')
      .delete()
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType);
    return;
  }
  ls.set(ls.all().filter((r) => !(r.tmdbId === tmdbId && r.mediaType === mediaType)));
};

export const getStats = async () => {
  const reviews = await getReviews();
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
    avgRating: avg,
  };
};
