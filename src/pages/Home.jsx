import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getReviews, getStats } from '../utils/storage';
import { posterUrl, backdropUrl } from '../config';
import MovieCard from '../components/MovieCard';
import StarRating from '../components/StarRating';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, movies: 0, tv: 0, games: 0, recommended: 0, avgRating: null });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('type') || 'all';
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [data, s] = await Promise.all([getReviews(), getStats()]);
      setReviews(data);
      setStats(s);
      setLoading(false);
    };
    load();
  }, []);

  const featured = reviews[0];

  const filtered = reviews
    .filter((r) => {
      if (filter === 'movie') return r.mediaType === 'movie';
      if (filter === 'tv') return r.mediaType === 'tv';
      if (filter === 'game') return r.mediaType === 'game';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div style={{ paddingTop: 'var(--navbar-height)' }}>

      {/* -- Hero / Featured -- */}
      {loading ? (
        <div className="skeleton" style={{ height: 'clamp(360px, 55vh, 520px)' }} />
      ) : featured ? (
        <FeaturedHero review={featured} />
      ) : (
        <EmptyHero />
      )}

      {/* -- Stats bar -- */}
      {!loading && stats.total > 0 && (
        <div style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
          <div className="page-container" style={{ padding: '1.25rem 2rem' }}>
            <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Total Reviews', value: stats.total },
                { label: 'Films', value: stats.movies },
                { label: 'Series', value: stats.tv },
                { label: 'Games', value: stats.games },
                { label: 'Recommended', value: stats.recommended },
                ...(stats.avgRating ? [{ label: 'Avg Rating', value: `${stats.avgRating}/5 ★` }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: '1.3rem', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginTop: '0.1rem' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -- Reviews grid -- */}
      <div className="page-container" style={{ padding: '3rem 2rem 5rem' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'All', value: 'all' },
              { label: '▶ Films', value: 'movie' },
              { label: '⬛ Series', value: 'tv' },
              { label: '🎮 Games', value: 'game' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSearchParams(value === 'all' ? {} : { type: value })}
                style={{
                  background: filter === value ? 'var(--color-accent)' : 'transparent',
                  color: filter === value ? '#07070f' : 'var(--color-text-secondary)',
                  border: `1px solid ${filter === value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 1rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.75rem', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
            >
              <option value="latest">Latest First</option>
              <option value="rating">Highest Rated</option>
              <option value="title">A–Z</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((review, i) => (
              <MovieCard key={review.id} review={review} index={i} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎞️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 400, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
              {reviews.length === 0 ? 'The reel is empty' : 'No reviews match this filter'}
            </h3>
            <p style={{ fontSize: '0.9rem' }}>
              {reviews.length === 0 ? 'Log in as admin to start adding reviews.' : 'Try a different filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedHero({ review }) {
  const isGame = review.mediaType === 'game';
  const isFullUrl = review.posterPath?.startsWith('http');
  const backdrop = isGame || isFullUrl
    ? review.backdropPath || review.posterPath
    : (review.backdropPath ? backdropUrl(review.backdropPath, 'original') : null);
  const poster = isGame || isFullUrl
    ? review.posterPath
    : (review.posterPath ? posterUrl(review.posterPath, 'lg') : null);

  return (
    <div style={{ position: 'relative', height: 'clamp(360px, 55vh, 520px)', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: backdrop ? `url(${backdrop})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center 20%',
        filter: 'brightness(0.35)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to right, rgba(7,7,15,0.95) 0%, rgba(7,7,15,0.5) 50%, transparent 100%), linear-gradient(to top, rgba(7,7,15,1) 0%, transparent 40%)`,
      }} />
      <div className="page-container" style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {poster && (
          <div style={{ flexShrink: 0, width: '120px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', animation: 'fadeInUp 0.6s ease' }}>
            <img src={poster} alt={review.title} style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: isGame ? '16/9' : '2/3' }} />
          </div>
        )}
        <div style={{ maxWidth: '560px' }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--color-accent)', background: 'var(--color-accent-dim)', padding: '0.2rem 0.55rem', borderRadius: '2px' }}>
              ● NOW SCREENING
            </span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              {review.mediaType === 'tv' ? 'TV Series' : review.mediaType === 'game' ? 'Video Game' : 'Film'}
            </span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '0.03em', color: 'var(--color-text-primary)', marginBottom: '0.5rem', animation: 'fadeInUp 0.5s ease 0.1s both', lineHeight: 1.1 }}>
            {review.title}
          </h2>
          <div style={{ marginBottom: '0.75rem', animation: 'fadeInUp 0.5s ease 0.2s both' }}>
            <StarRating value={review.rating} readOnly size={16} showValue />
          </div>
          {review.reviewText && (
            <p style={{ fontSize: '0.9rem', color: 'rgba(242,237,228,0.7)', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', animation: 'fadeInUp 0.5s ease 0.3s both', margin: 0 }}>
              {review.reviewText}
            </p>
          )}
          <Link
            to={`/${review.mediaType}/${review.tmdbId}`}
            className="btn btn-primary"
            style={{ marginTop: '1.25rem', display: 'inline-flex', animation: 'fadeInUp 0.5s ease 0.4s both' }}
          >
            Read Review →
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyHero() {
  return (
    <div style={{ height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at center, rgba(var(--color-accent-rgb), 0.05) 0%, transparent 70%), var(--color-bg)`, borderBottom: '1px solid var(--color-border)' }}>
      <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎞️</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 300, letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
          A Cinematic Journal
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
          Personal reviews of the films, series, and games that left a mark.
        </p>
      </div>
    </div>
  );
}
