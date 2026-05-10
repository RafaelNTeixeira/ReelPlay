export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'cinephile2024';

export const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || '';
export const RAWG_BASE_URL = 'https://api.rawg.io/api';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const IMAGE_SIZES = {
  poster: {
    sm: 'w185',
    md: 'w342',
    lg: 'w500',
    xl: 'w780',
    original: 'original',
  },
  backdrop: {
    sm: 'w300',
    md: 'w780',
    lg: 'w1280',
    original: 'original',
  },
  profile: {
    sm: 'w45',
    md: 'w185',
    lg: 'h632',
  },
};

export const posterUrl = (path, size = 'md') =>
  path ? `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.poster[size]}${path}` : null;

export const backdropUrl = (path, size = 'lg') =>
  path ? `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.backdrop[size]}${path}` : null;

export const profileUrl = (path, size = 'md') =>
  path ? `${TMDB_IMAGE_BASE}/${IMAGE_SIZES.profile[size]}${path}` : null;
