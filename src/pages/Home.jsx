import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getReviews, getStats } from '../utils/storage';
import { posterUrl, backdropUrl } from '../config';
import MovieCard from '../components/MovieCard';
import StarRating from '../components/StarRating';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, movies: 0, tv: 0, games: 0, recommended: 0, picks: 0, avgRating: null });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('type') || 'all';
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, s] = await Promise.all([getReviews(), getStats()]);
      setReviews(data.filter((r) => r.rating > 0));
      setStats(s);
      setLoading(false);
    };
    load();
  }, []);

  const featured = reviews[0];

  const filtered = reviews
    .filter((r) => {
      if (filter === 'movie') return r.mediaType === 'movie';
      if (filter === 'tv')    return r.mediaType === 'tv';
      if (filter === 'game')  return r.mediaType === 'game';
      if (filter === 'pick')  return r.reviewerPick === true;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title')  return a.title.localeCompare(b.title);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Separate for "all" view with section headers
  const cinemaReviews = filtered.filter((r) => r.mediaType !== 'game');
  const gameReviews   = filtered.filter((r) => r.mediaType === 'game');
  const showSections  = (filter === 'all' || filter === 'pick') && cinemaReviews.length > 0 && gameReviews.length > 0;

  return (
    <div style={{ paddingTop: 'var(--navbar-height)' }}>

      {/* -- Hero -- */}
      {loading
        ? <div className="skeleton" style={{ height: 'clamp(360px, 55vh, 520px)' }} />
        : featured
          ? <FeaturedHero review={featured} />
          : <EmptyHero />
      }

      {/* -- Stats bar -- */}
      {!loading && stats.total > 0 && (
        <div style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="page-container" style={{ padding: '1.1rem 2rem' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Reviews',     value: stats.total,       accent: 'var(--color-text-primary)' },
                { label: 'Films',       value: stats.movies,      accent: 'var(--color-cinema)' },
                { label: 'Series',      value: stats.tv,          accent: '#78b4c8' },
                { label: 'Games',       value: stats.games,       accent: 'var(--color-game)' },
                { label: 'Recommended', value: stats.recommended, accent: '#6bc87a' },
                { label: "Reviewer's Picks", value: stats.picks, accent: '#e2a84b' },
                ...(stats.avgRating ? [{ label: 'Avg Rating', value: `${stats.avgRating} ★`, accent: 'var(--color-text-primary)' }] : []),
              ].map(({ label, value, accent }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '1.3rem', color: accent, letterSpacing: '0.05em' }}>{value}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- Grid -- */}
      <div className="page-container" style={{ padding: '3rem 2rem 5rem' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { label: 'All',      value: 'all',   color: 'var(--color-text-primary)' },
              { label: '▶ Films',  value: 'movie', color: 'var(--color-cinema)' },
              { label: '⬛ Series', value: 'tv',    color: '#78b4c8' },
              { label: '🎮 Games', value: 'game',  color: 'var(--color-game)' },
              { label: '⭐ Picks',  value: 'pick',  color: '#e2a84b' },
            ].map(({ label, value, color }) => {
              const active = filter === value;
              return (
                <button key={value}
                  onClick={() => setSearchParams(value === 'all' ? {} : { type: value })}
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
              <option value="latest">Latest</option>
              <option value="rating">Highest Rated</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} hasAny={reviews.length > 0} />
        ) : showSections ? (
          /* Split sections when showing all with mixed content */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            {cinemaReviews.length > 0 && (
              <div>
                <div className="media-section-header media-section-header-cinema">
                  <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', letterSpacing: '0.2em', color: 'var(--color-cinema)', background: 'var(--color-cinema-dim)', padding: '0.2rem 0.6rem', borderRadius: '2px' }}>🎬 CINEMA</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{cinemaReviews.length} review{cinemaReviews.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                  {cinemaReviews.map((r, i) => <MovieCard key={r.id} review={r} index={i} />)}
                </div>
              </div>
            )}
            {gameReviews.length > 0 && (
              <div>
                <div className="media-section-header media-section-header-game">
                  <span style={{ fontFamily: 'var(--font-game)', fontSize: '0.8rem', letterSpacing: '0.2em', fontWeight: 700, color: 'var(--color-game)', background: 'var(--color-game-dim)', padding: '0.2rem 0.6rem', borderRadius: '2px', textTransform: 'uppercase' }}>🎮 GAMES</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{gameReviews.length} review{gameReviews.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                  {gameReviews.map((r, i) => <MovieCard key={r.id} review={r} index={i} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single-type filtered view */
          <div style={{
            display: 'grid',
            gridTemplateColumns: (filter === 'game' || (filter === 'pick' && gameReviews.length > 0 && cinemaReviews.length === 0))
              ? 'repeat(auto-fill, minmax(240px, 1fr))'
              : 'repeat(auto-fill, minmax(195px, 1fr))',
            gap: '1.5rem',
            alignItems: 'start',
          }}>
            {filtered.map((r, i) => <MovieCard key={r.id} review={r} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedHero({ review }) {
  const isGame = review.mediaType === 'game';
  const isFullUrl = review.posterPath?.startsWith('http');
  const backdrop = (isGame || isFullUrl)
    ? (review.backdropPath || review.posterPath)
    : (review.backdropPath ? backdropUrl(review.backdropPath, 'original') : null);
  const poster = (isGame || isFullUrl)
    ? review.posterPath
    : (review.posterPath ? posterUrl(review.posterPath, 'lg') : null);

  const accentColor = isGame ? 'var(--color-game)' : 'var(--color-cinema)';
  const accentDim   = isGame ? 'var(--color-game-dim)' : 'var(--color-cinema-dim)';
  const typeLabel   = isGame ? '🎮 NOW PLAYING' : review.mediaType === 'tv' ? '⬛ NOW SCREENING' : '▶ NOW SCREENING';
  const subLabel    = isGame ? 'Video Game' : review.mediaType === 'tv' ? 'TV Series' : 'Film';

  return (
    <div style={{ position: 'relative', height: 'clamp(360px, 55vh, 520px)', overflow: 'hidden' }}>
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: backdrop ? `url(${backdrop})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center 20%', filter: 'brightness(0.3) saturate(0.85)' }} />
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, rgba(7,7,15,0.96) 0%, rgba(7,7,15,0.55) 50%, transparent 100%), linear-gradient(to top, rgba(7,7,15,1) 0%, transparent 40%)` }} />
      {/* Accent tint for games */}
      {isGame && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(129,140,248,0.06) 0%, transparent 60%)' }} />}

      <div className="page-container" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {poster && (
          <div style={{ flexShrink: 0, width: '115px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${accentDim}`, animation: 'fadeInUp 0.6s ease' }}>
            <img src={poster} alt={review.title} style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: isGame ? '16/9' : '2/3' }} />
          </div>
        )}
        <div style={{ maxWidth: '560px' }}>
          <div style={{ marginBottom: '0.65rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontFamily: isGame ? 'var(--font-game)' : 'var(--font-label)', fontSize: '0.68rem', letterSpacing: '0.22em', color: accentColor, background: accentDim, padding: '0.2rem 0.55rem', borderRadius: '2px', fontWeight: isGame ? 700 : 400, textTransform: 'uppercase' }}>
              {typeLabel}
            </span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.62rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.42)', textTransform: 'uppercase' }}>{subLabel}</span>
          </div>
          <h2 style={{ fontFamily: isGame ? 'var(--font-game)' : 'var(--font-display)', fontSize: isGame ? 'clamp(1.8rem, 5vw, 3.2rem)' : 'clamp(1.8rem, 4vw, 3rem)', fontWeight: isGame ? 700 : 400, letterSpacing: isGame ? '0.06em' : '0.03em', textTransform: isGame ? 'uppercase' : 'none', color: 'var(--color-text-primary)', marginBottom: '0.55rem', animation: 'fadeInUp 0.5s ease 0.1s both', lineHeight: 1.1 }}>
            {review.title}
          </h2>
          <div style={{ marginBottom: '0.7rem', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            <StarRating value={review.rating} readOnly size={15} showValue />
          </div>
          {review.reviewText && (
            <p style={{ fontSize: '0.88rem', color: 'rgba(240,236,248,0.68)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', animation: 'fadeInUp 0.5s ease 0.3s both', margin: 0 }}>
              {review.reviewText}
            </p>
          )}
          <Link to={`/${review.mediaType}/${review.tmdbId}`} className="btn btn-primary" style={{ marginTop: '1.2rem', display: 'inline-flex', animation: 'fadeInUp 0.5s ease 0.4s both', background: accentColor }}>
            Read Review →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter, hasAny }) {
  const isGame = filter === 'game';
  return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{isGame ? '🎮' : '🎞️'}</div>
      <h3 style={{ fontFamily: isGame ? 'var(--font-game)' : 'var(--font-display)', fontSize: '1.5rem', fontWeight: isGame ? 700 : 400, color: 'var(--color-text-secondary)', marginBottom: '0.5rem', textTransform: isGame ? 'uppercase' : 'none', letterSpacing: isGame ? '0.1em' : '0' }}>
        {hasAny ? 'No reviews match this filter' : isGame ? 'No games reviewed yet' : 'The reel is empty'}
      </h3>
      <p style={{ fontSize: '0.88rem' }}>{hasAny ? 'Try a different filter.' : 'Log in as admin to start adding reviews.'}</p>
    </div>
  );
}

function EmptyHero() {
  return (
    <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at 35% 50%, rgba(226,168,75,0.05) 0%, transparent 55%), radial-gradient(ellipse at 70% 50%, rgba(129,140,248,0.05) 0%, transparent 55%), var(--color-bg)`, borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>🎬 🎮</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 300, letterSpacing: '0.08em', marginBottom: '0.6rem' }}>
          Where Every Story Plays
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', maxWidth: '380px', margin: '0 auto' }}>
          Personal reviews of the films, series &amp; games that left a mark.
        </p>
      </div>
    </div>
  );
}