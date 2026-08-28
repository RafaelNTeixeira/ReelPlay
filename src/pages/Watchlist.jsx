import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../utils/storage';
import { posterUrl } from '../config';
import { useAdmin } from '../context/AdminContext';
import SearchModal from '../components/SearchModal';

export default function Watchlist() {
  const { isAdmin } = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [searchOpen, setSearchOpen] = useState(false);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getWatchlist();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items
      .filter((w) => filter === 'all' || w.mediaType === filter)
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return new Date(b.addedAt) - new Date(a.addedAt);
      });
  }, [items, filter, sortBy]);

  const handleAdd = async (item) => {
    setError(null);
    const isGame = item.media_type === 'game';
    const title = item.title || item.name;
    const posterPath = isGame ? item.background_image : item.poster_path;
    const year = isGame
      ? (item.released || '').slice(0, 4)
      : (item.release_date || item.first_air_date || '').slice(0, 4);
    const tmdbRating = isGame ? item.rating : item.vote_average;

    try {
      const saved = await addToWatchlist({
        tmdbId: item.id,
        mediaType: item.media_type,
        title,
        posterPath,
        backdropPath: null,
        year,
        genres: [],
        tmdbRating,
      });
      setItems((prev) => [saved, ...prev.filter((w) => w.id !== saved.id)]);
      setSearchOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (item) => {
    setRemovingId(item.id);
    setError(null);
    try {
      await removeFromWatchlist(item.tmdbId, item.mediaType);
      setItems((prev) => prev.filter((w) => w.id !== item.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '5rem' }}>
      <div className="page-container" style={{ padding: '2.5rem clamp(1rem, 4vw, 2rem) 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--color-accent)' }}>
              ✦ UP NEXT
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 300, margin: '0.4rem 0 0' }}>
              Watchlist
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
              Films, series &amp; games queued up next.
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setSearchOpen(true)}>
              + Add to Watchlist
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.35)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', color: '#e05555', fontSize: '0.84rem', marginBottom: '1.5rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Toolbar */}
        {items.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { label: 'All',      value: 'all',   color: 'var(--color-text-primary)' },
                { label: '▶ Films',  value: 'movie', color: 'var(--color-cinema)' },
                { label: '⬛ Series', value: 'tv',    color: '#78b4c8' },
                { label: '🎮 Games', value: 'game',  color: 'var(--color-game)' },
              ].map(({ label, value, color }) => {
                const active = filter === value;
                return (
                  <button key={value}
                    onClick={() => setFilter(value)}
                    style={{
                      background: active ? color : 'transparent',
                      color: active ? '#07070f' : 'var(--color-text-secondary)',
                      border: `1px solid ${active ? color : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.38rem 0.9rem',
                      fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', padding: '0.38rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}>
                <option value="recent">Recently Added</option>
                <option value="title">A–Z</option>
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔖</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              Nothing queued up yet
            </h3>
            <p style={{ fontSize: '0.88rem' }}>{isAdmin ? 'Use "+ Add to Watchlist" to start building it.' : 'Check back soon.'}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '0.88rem' }}>Nothing in this category yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: filter === 'game' ? 'repeat(auto-fill, minmax(240px, 1fr))' : 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((w) => (
              <WatchlistCard key={w.id} item={w} isAdmin={isAdmin} onRemove={handleRemove} removing={removingId === w.id} />
            ))}
          </div>
        )}
      </div>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleAdd}
        adminMode={isAdmin}
      />
    </div>
  );
}

function WatchlistCard({ item, isAdmin, onRemove, removing }) {
  const isGame = item.mediaType === 'game';
  const isFullUrl = item.posterPath?.startsWith('http');
  const img = isFullUrl ? item.posterPath : (item.posterPath ? posterUrl(item.posterPath, 'md') : null);
  const typeLabel = isGame ? '🎮 GAME' : item.mediaType === 'tv' ? '⬛ SERIES' : '▶ FILM';

  return (
    <div className="card" style={{ opacity: removing ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
      <Link to={`/${item.mediaType}/${item.tmdbId}`} style={{ display: 'block', position: 'relative', aspectRatio: isGame ? '16/9' : '2/3', overflow: 'hidden' }}>
        {img ? (
          <img src={img} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div className="poster-placeholder" style={{ height: '100%' }}>{isGame ? '🎮' : '🎬'}</div>
        )}
        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem' }}>
          <span className={`badge ${isGame ? 'badge-game' : item.mediaType === 'tv' ? 'badge-series' : 'badge-cinema'}`}>{typeLabel}</span>
        </div>
      </Link>
      <div style={{ padding: '0.8rem 0.9rem', background: 'var(--color-bg-card)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.year || ''}</span>
          {isAdmin && (
            <button
              onClick={() => onRemove(item)}
              disabled={removing}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}