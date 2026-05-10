import { useNavigate } from 'react-router-dom';
import { posterUrl } from '../config';
import StarRating from './StarRating';

export default function MovieCard({ review, index = 0 }) {
  const navigate = useNavigate();
  const isGame = review.mediaType === 'game';
  const isFullUrl = review.posterPath?.startsWith('http');
  const href = `/${review.mediaType}/${review.tmdbId}`;
  const imgSrc = isFullUrl ? review.posterPath : (review.posterPath ? posterUrl(review.posterPath, 'md') : null);

  const badgeLabel = isGame ? '🎮 GAME' : review.mediaType === 'tv' ? '⬛ SERIES' : '▶ FILM';
  const badgeColor = isGame ? '#a78bfa' : review.mediaType === 'tv' ? '#78b4c8' : 'var(--color-accent)';
  const badgeBg = isGame ? 'rgba(167,139,250,0.15)' : review.mediaType === 'tv' ? 'rgba(120,180,200,0.12)' : 'var(--color-accent-dim)';

  const ratingColor = review.rating >= 4
    ? 'var(--color-accent)'
    : review.rating >= 3
    ? '#78b4a0'
    : '#c07070';

  return (
    <div
      onClick={() => navigate(href)}
      className="card"
      style={{
        cursor: 'pointer',
        position: 'relative',
        animation: 'fadeInUp 0.5s ease both',
        animationDelay: `${index * 0.06}s`,
        overflow: 'hidden',
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', aspectRatio: '2/3', overflow: 'hidden' }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={review.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            loading="lazy"
          />
        ) : (
          <div className="poster-placeholder" style={{ height: '100%' }}>🎬</div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(7,7,15,0.96) 0%, rgba(7,7,15,0.4) 40%, transparent 70%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '1rem',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
        >
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-accent)',
            marginBottom: '0.4rem',
          }}>
            View Review →
          </span>
          {review.reviewText && (
            <p style={{
              fontSize: '0.8rem',
              color: 'rgba(242,237,228,0.85)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {review.reviewText}
            </p>
          )}
        </div>

        {/* Badges */}
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          left: '0.75rem',
          display: 'flex',
          gap: '0.4rem',
          flexWrap: 'wrap',
        }}>
          <span className="badge" style={{
            background: 'rgba(7,7,15,0.85)',
            color: badgeColor,
            border: `1px solid ${badgeBg}`,
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            backdropFilter: 'blur(8px)',
          }}>
            {badgeLabel}
          </span>
        </div>

        {/* Critic's Choice badge */}
        {review.rating >= 4.5 && (
          <div style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: 'var(--color-accent)',
            color: '#07070f',
            padding: '0.2rem 0.45rem',
            borderRadius: '2px',
            fontSize: '0.6rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            ★ Critic's Pick
          </div>
        )}

        {review.recommended && (
          <div style={{
            position: 'absolute',
            bottom: '0.75rem',
            right: '0.75rem',
          }}>
            <span style={{ fontSize: '1.2rem' }} title="Recommended">💚</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.85rem 1rem', background: 'var(--color-bg-card)' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.05rem',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          marginBottom: '0.3rem',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {review.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StarRating
            value={review.rating}
            readOnly
            size={13}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.05rem',
            fontWeight: 600,
            color: ratingColor,
          }}>
            {review.rating > 0 ? `${review.rating}/5` : '—'}
          </span>
        </div>

        {review.watchedDate && (
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.4rem',
            letterSpacing: '0.05em',
          }}>
            {new Date(review.watchedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
