import { useState, useEffect, useRef } from 'react';
import { searchMulti } from '../utils/tmdb';
import { searchGames } from '../utils/rawg';
import { posterUrl } from '../config';

export default function SearchModal({ isOpen, onClose, onSelect, adminMode }) {
  const [tab, setTab] = useState('cinema'); // 'cinema' | 'games'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery(''); setResults([]); setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) { setQuery(''); setResults([]); setError(null); }
  }, [tab]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        if (tab === 'games') {
          const data = await searchGames(query.trim());
          setResults((data.results || []).slice(0, 10).map((g) => ({ ...g, _isGame: true })));
        } else {
          const data = await searchMulti(query.trim());
          const filtered = (data.results || [])
            .filter((r) => r.media_type !== 'person' && (r.title || r.name))
            .slice(0, 10);
          setResults(filtered);
        }
      } catch {
        setError(`Search failed. Check your ${tab === 'games' ? 'RAWG' : 'TMDB'} API key.`);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, tab]);

  if (!isOpen) return null;

  return (
    <div
      className="overlay-backdrop"
      style={{ alignItems: 'flex-start', paddingTop: '10vh' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: '620px',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        animation: 'fadeInDown 0.25s ease',
        boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          {[
            { key: 'cinema', label: '🎬 Movies & TV' },
            { key: 'games', label: '🎮 Games' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '0.85rem 1rem',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--color-accent)' : '2px solid transparent',
                color: tab === key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'games'
              ? (adminMode ? 'Search games to review…' : 'Search games…')
              : (adminMode ? 'Search movies & TV to review…' : 'Search movies & TV shows…')}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-primary)', fontSize: '1.05rem', fontFamily: 'var(--font-body)' }}
          />
          {loading && (
            <div style={{ width: '18px', height: '18px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '0.25rem' }}>✕</button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {error && <div style={{ padding: '2rem', textAlign: 'center', color: '#e05555', fontSize: '0.9rem' }}>{error}</div>}
          {!error && results.length === 0 && query.length >= 2 && !loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No results for "{query}"</div>
          )}
          {!error && query.length < 2 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>{tab === 'games' ? '🎮' : '🎬'}</span>
              {tab === 'games' ? 'Search for any video game' : 'Search movies & TV shows'}
            </div>
          )}

          {results.map((item) => {
            const isGame = !!item._isGame;
            const title = item.title || item.name;
            const year = isGame
              ? (item.released || '').slice(0, 4)
              : (item.release_date || item.first_air_date || '').slice(0, 4);
            const type = isGame ? 'Game' : item.media_type === 'tv' ? 'TV' : 'Film';
            const typeColor = isGame ? '#a78bfa' : item.media_type === 'tv' ? '#78b4c8' : 'var(--color-accent)';
            const typeBg = isGame ? 'rgba(167,139,250,0.1)' : item.media_type === 'tv' ? 'rgba(120,180,200,0.1)' : 'var(--color-accent-dim)';
            const imgSrc = isGame
              ? item.background_image
              : (item.poster_path ? posterUrl(item.poster_path, 'sm') : null);
            const score = isGame
              ? (item.rating > 0 ? `★ ${item.rating.toFixed(1)}` : null)
              : (item.vote_average > 0 ? `★ ${item.vote_average.toFixed(1)}` : null);

            return (
              <div
                key={`${isGame ? 'game' : item.media_type}-${item.id}`}
                onClick={() => onSelect({ ...item, media_type: isGame ? 'game' : item.media_type })}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.25rem', cursor: 'pointer', transition: 'background 0.15s ease', borderBottom: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: isGame ? '72px' : '44px', height: '64px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-card)' }}>
                  {imgSrc ? (
                    <img src={imgSrc} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{isGame ? '🎮' : '🎬'}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: typeColor, background: typeBg, padding: '0.1rem 0.4rem', borderRadius: '2px' }}>{type}</span>
                    {year && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{year}</span>}
                    {score && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{score}</span>}
                    {isGame && item.platforms?.slice(0, 2).map((p) => (
                      <span key={p.platform.id} style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.05rem 0.35rem', borderRadius: '2px' }}>{p.platform.name}</span>
                    ))}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
