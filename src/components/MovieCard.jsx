import { Link } from 'react-router-dom';
import { posterUrl } from '../config';
import StarRating from './StarRating';

export default function MovieCard({ review, index = 0 }) {
  const isGame = review.mediaType === 'game';
  const isTv   = review.mediaType === 'tv';
  const isFullUrl = review.posterPath?.startsWith('http');
  const imgSrc = isFullUrl ? review.posterPath : (review.posterPath ? posterUrl(review.posterPath, 'md') : null);

  return isGame
    ? <GameCard review={review} imgSrc={imgSrc} index={index} />
    : <CinemaCard review={review} imgSrc={imgSrc} isTv={isTv} index={index} />;
}

/* -- Cinema / TV Card --------------------------------------- */
function CinemaCard({ review, imgSrc, isTv, index }) {
  const ratingColor = review.rating >= 4 ? 'var(--color-cinema)' : review.rating >= 3 ? '#78b4a0' : '#c07070';
  return (
    <Link
      to={`/${review.mediaType}/${review.tmdbId}`}
      className="card card-cinema"
      style={{ display: 'block', textDecoration: 'none', cursor: 'pointer', animation: 'fadeInUp 0.5s ease both', animationDelay: `${index * 0.055}s` }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        {imgSrc ? (
          <img src={imgSrc} alt={review.title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div className="poster-placeholder" style={{ height: '100%' }}>🎬</div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(7,7,15,0.97) 0%, rgba(7,7,15,0.35) 40%, transparent 65%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '1rem', opacity: 0, transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-cinema)', marginBottom: '0.35rem' }}>
            View Review →
          </span>
          {review.reviewText && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(240,236,248,0.82)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0, lineHeight: 1.45 }}>
              {review.reviewText}
            </p>
          )}
        </div>

        {/* Top badges */}
        <div style={{ position: 'absolute', top: '0.65rem', left: '0.65rem' }}>
          <span className={`badge ${isTv ? 'badge-series' : 'badge-cinema'}`}>
            {isTv ? '⬛ SERIES' : '▶ FILM'}
          </span>
        </div>

        <div style={{ position: 'absolute', top: '0.65rem', right: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
          {review.mediaType === 'movie' && review.movieOfTheYear && (
            <div style={{ background: '#e2b83e', color: '#07070f', padding: '0.18rem 0.4rem', borderRadius: '2px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              🏆 {review.movieOfTheYear} Movie of the Year
            </div>
          )}
          {review.reviewerPick && (
            <div style={{ background: 'var(--color-cinema)', color: '#07070f', padding: '0.18rem 0.4rem', borderRadius: '2px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ★ Reviewer's Pick
            </div>
          )}
        </div>
        {review.recommended && (
          <div style={{ position: 'absolute', bottom: '0.65rem', right: '0.65rem' }}>
            <span title="Recommended" style={{ fontSize: '1.1rem' }}>💚</span>
          </div>
        )}
        {review.rewatchCount > 0 && (
          <div style={{ position: 'absolute', bottom: '0.65rem', left: '0.65rem' }}>
            <span
              title={`Watched ${review.rewatchCount + 1}× total`}
              style={{
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
                color: '#fff', background: 'rgba(7,7,15,0.75)', padding: '0.15rem 0.4rem',
                borderRadius: '2px', backdropFilter: 'blur(4px)',
              }}
            >
              🔁 {review.rewatchCount + 1}×
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '0.8rem 0.9rem', background: 'var(--color-bg-card)' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
          {review.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating value={review.rating} readOnly size={12} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: ratingColor }}>
            {review.rating > 0 ? `${review.rating}/5` : '-'}
          </span>
        </div>
        {review.watchedDate && (
          <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '0.35rem', letterSpacing: '0.04em' }}>
            {new Date(review.watchedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  );
}

/* -- Game Card ---------------------------------------------- */
function GameCard({ review, imgSrc, index }) {
  const ratingColor = review.rating >= 4 ? 'var(--color-game)' : review.rating >= 3 ? '#78b4a0' : '#c07070';
  const platforms = review.genres?.slice(0, 3) || [];

  return (
    <Link
      to={`/game/${review.tmdbId}`}
      className="card card-game"
      style={{ display: 'block', textDecoration: 'none', cursor: 'pointer', animation: 'fadeInUp 0.5s ease both', animationDelay: `${index * 0.055}s` }}
    >
      {/* 16:9 image section */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        {/* Scanline layer */}
        <div className="scanline-overlay" />

        {imgSrc ? (
          <img src={imgSrc} alt={review.title} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div className="poster-placeholder" style={{ height: '100%', fontSize: '2.5rem' }}>🎮</div>
        )}

        {/* Bottom gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(7,7,15,0.92) 0%, transparent 55%)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Top-left badge */}
        <div style={{ position: 'absolute', top: '0.6rem', left: '0.6rem', zIndex: 4 }}>
          <span className="badge badge-game">🎮 GAME</span>
        </div>

        {/* Critic pick */}
        {review.reviewerPick && (
          <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 4, background: 'var(--color-game)', color: '#07070f', padding: '0.18rem 0.4rem', borderRadius: '2px', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', fontFamily: 'var(--font-game)', textTransform: 'uppercase' }}>
            ★ Reviewer's Pick
          </div>
        )}

        {/* Recommended */}
        {review.recommended && (
          <div style={{ position: 'absolute', bottom: '0.6rem', right: '0.6rem', zIndex: 4 }}>
            <span title="Recommended" style={{ fontSize: '1.05rem' }}>💚</span>
          </div>
        )}
        {review.rewatchCount > 0 && (
          <div style={{ position: 'absolute', bottom: '0.6rem', left: '0.6rem', zIndex: 4 }}>
            <span
              title={`Played ${review.rewatchCount + 1}× total`}
              style={{
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em',
                color: '#fff', background: 'rgba(7,7,15,0.75)', padding: '0.15rem 0.4rem',
                borderRadius: '2px', backdropFilter: 'blur(4px)',
              }}
            >
              🔁 {review.rewatchCount + 1}×
            </span>
          </div>
        )}

        {/* Hover overlay text */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0.75rem', opacity: 0, transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <span style={{ fontFamily: 'var(--font-game)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-game)' }}>
            VIEW REVIEW →
          </span>
        </div>
      </div>

      {/* Game info footer */}
      <div style={{ padding: '0.75rem 0.9rem', background: 'var(--color-bg-card)', borderTop: '1px solid rgba(129,140,248,0.1)' }}>
        <h3 style={{
          fontFamily: 'var(--font-game)',
          fontSize: '1.05rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-primary)',
          marginBottom: '0.4rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {review.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <StarRating value={review.rating} readOnly size={12} />
          <span style={{ fontFamily: 'var(--font-game)', fontSize: '1rem', fontWeight: 700, color: ratingColor }}>
            {review.rating > 0 ? `${review.rating}/5` : '-'}
          </span>
        </div>

        {/* Genre tags as platform-style chips */}
        {platforms.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            {platforms.map((g) => (
              <span key={g} className="badge badge-platform">{g}</span>
            ))}
          </div>
        )}

        {review.watchedDate && (
          <p style={{ fontSize: '0.66rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em', fontFamily: 'var(--font-game)', marginTop: '0.2rem' }}>
            {new Date(review.watchedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
    </Link>
  );
}