import { RAWG_BASE_URL, RAWG_API_KEY } from '../config';

const request = async (endpoint, params = {}) => {
  const url = new URL(`${RAWG_BASE_URL}${endpoint}`);
  url.searchParams.set('key', RAWG_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`RAWG Error: ${res.status}`);
  return res.json();
};

export const searchGames = (query) =>
  request('/games', { search: query, page_size: 10, search_precise: true });

export const getGameDetails = (id) => request(`/games/${id}`);
export const getGameScreenshots = (id) => request(`/games/${id}/screenshots`, { page_size: 12 });
export const getGameTrailers = (id) => request(`/games/${id}/movies`);
export const getSuggestedGames = (id) => request(`/games/${id}/suggested`, { page_size: 8 });

export const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const getPlatformLabel = (platformName) => {
  const name = platformName.toLowerCase();
  if (name.includes('pc') || name.includes('windows')) return 'PC';
  if (name.includes('playstation 5')) return 'PS5';
  if (name.includes('playstation 4')) return 'PS4';
  if (name.includes('playstation 3')) return 'PS3';
  if (name.includes('playstation')) return 'PlayStation';
  if (name.includes('xbox series')) return 'Xbox Series';
  if (name.includes('xbox one')) return 'Xbox One';
  if (name.includes('xbox 360')) return 'Xbox 360';
  if (name.includes('xbox')) return 'Xbox';
  if (name.includes('nintendo switch')) return 'Switch';
  if (name.includes('nintendo 3ds')) return '3DS';
  if (name.includes('wii u')) return 'Wii U';
  if (name.includes('wii')) return 'Wii';
  if (name.includes('macos') || name.includes('mac')) return 'macOS';
  if (name.includes('linux')) return 'Linux';
  if (name.includes('android')) return 'Android';
  if (name.includes('ios')) return 'iOS';
  if (name.includes('atari')) return 'Atari';
  return platformName;
};

export const metacriticColor = (score) => {
  if (!score) return 'var(--color-text-muted)';
  if (score >= 75) return '#6dc849';
  if (score >= 50) return '#fc3';
  return '#f00';
};
