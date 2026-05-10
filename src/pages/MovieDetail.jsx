import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getMovieDetails,
  getTVDetails,
  extractTrailer,
  formatRuntime,
  formatMoney,
  getContentRating,
} from '../utils/tmdb';
import { getReview, saveReview, deleteReview } from '../utils/storage';
import { posterUrl, backdropUrl, profileUrl } from '../config';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import HeroBanner from '../components/HeroBanner';
import TheaterMode from '../components/TheaterMode';
import StarRating from '../components/StarRating';
import CastCarousel from '../components/CastCarousel';
import ReviewForm from '../components/ReviewForm';

export default function MovieDetail({ mediaType }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { extractFromImage, resetPalette } = useTheme();

  const [details, setDetails] = useState(null);
  const [review, setReview] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [theaterOpen, setTheaterOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const colorExtracted = useRef(false);

  // Load data
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      colorExtracted.current = false;
      setSpoilerRevealed(false);
      setShowReviewForm(false);
      setConfirmDelete(false);

      try {
        const fetcher = mediaType === 'tv' ? getTVDetails : getMovieDetails;
        const data = await fetcher(Number(id));
        if (cancelled) return;
        setDetails(data);
        setTrailer(extractTrailer(data.videos));
        setReview(await getReview(Number(id), mediaType));
      } catch (err) {
        if (!cancelled) setError('Could not load this title. Check your TMDB API key.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; resetPalette(); };
  }, [id, mediaType]);

  // ColorThief extraction once poster is known
  useEffect(() => {
    if (details?.poster_path && !colorExtracted.current) {
      colorExtracted.current = true;
      extractFromImage(posterUrl(details.poster_path, 'lg'));
    }
  }, [details, extractFromImage]);

  const handleReviewSave = useCallback((saved) => {
    setReview(saved);
    setShowReviewForm(false);
  }, []);

  const handleDelete = async () => {
    setReview(null);
    setConfirmDelete(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    });
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onBack={() => navigate('/')} />;
  if (!details) return null;

  const title = details.title || details.name;
  const year = (details.release_date || details.first_air_date || '').slice(0, 4);
  const runtime = mediaType === 'movie'
    ? formatRuntime(details.runtime)
    : details.episode_run_time?.[0] ? `${details.episode_run_time[0]}m / ep` : null;
  const genres = details.genres || [];
  const cast = details.credits?.cast || details.credits?.cast || [];
  const crew = details.credits?.crew || [];
  const director = crew.find((c) => c.job === 'Director');
  const writers = crew.filter((c) => ['Screenplay', 'Writer', 'Story'].includes(c.job)).slice(0, 2);
  const contentRating = getContentRating(details, mediaType);
  const similar = (details.similar?.results || []).slice(0, 6);
  const wordCount = review?.reviewText ? review.reviewText.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ═══ HERO BANNER ═══ */}
      <div style={{
        position: 'relative',
        height: 'clamp(400px, 65vh, 620px)',
        marginTop: 0,
      }}>
        <HeroBanner
          videoId={trailer?.key}
          backdropPath={details.backdrop_path}
          title={title}
          onTheaterMode={trailer?.key ? () => setTheaterOpen(true) : null}
        />

        {/* Scroll anchor gradient */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(to top, var(--color-bg) 0%, transparent 100%)',
          zIndex: 5,
          pointerEvents: 'none',
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            top: 'calc(var(--navbar-height) + 1rem)',
            left: '2rem',
            zIndex: 10,
            background: 'rgba(7,7,15,0.75)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            padding: '0.45rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(7,7,15,0.75)'}
        >
          ← Back
        </button>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="page-container" style={{ padding: '0 2rem 6rem', position: 'relative', zIndex: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem', alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ marginTop: '-120px' }}>
            {/* Poster */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07)',
              marginBottom: '1.5rem',
              animation: 'fadeInUp 0.5s ease',
            }}>
              {details.poster_path ? (
                <img
                  src={posterUrl(details.poster_path, 'lg')}
                  alt={title}
                  style={{ width: '100%', display: 'block' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="poster-placeholder" style={{ aspectRatio: '2/3' }}>🎬</div>
              )}
            </div>

            {/* Quick facts */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              animation: 'fadeInUp 0.5s ease 0.1s both',
            }}>
              {[
                { label: 'Status', value: details.status },
                { label: mediaType === 'tv' ? 'Seasons' : 'Runtime', value: mediaType === 'tv' ? `${details.number_of_seasons} seasons (${details.number_of_episodes} ep)` : runtime },
                { label: 'Rating', value: contentRating },
                { label: 'TMDB Score', value: details.vote_average ? `${details.vote_average.toFixed(1)} / 10` : null },
                ...(mediaType === 'movie' ? [
                  { label: 'Budget', value: formatMoney(details.budget) },
                  { label: 'Revenue', value: formatMoney(details.revenue) },
                ] : []),
                ...(director ? [{ label: 'Director', value: director.name }] : []),
                ...(writers.length ? [{ label: 'Written by', value: writers.map((w) => w.name).join(', ') }] : []),
              ]
                .filter((f) => f.value && f.value !== 'N/A' && f.value !== 'null')
                .map(({ label, value }) => (
                  <div key={label}>
                    <div style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-muted)',
                      marginBottom: '0.2rem',
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: '0.88rem',
                      color: 'var(--color-text-primary)',
                      fontWeight: 400,
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ paddingTop: '2rem', minWidth: 0, overflow: 'hidden' }}>

            {/* Title block */}
            <div style={{ marginBottom: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                <span style={{
                  fontFamily: 'var(--font-label)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.2em',
                  color: mediaType === 'tv' ? '#78b4c8' : 'var(--color-accent)',
                  background: mediaType === 'tv' ? 'rgba(120,180,200,0.1)' : 'var(--color-accent-dim)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '2px',
                }}>
                  {mediaType === 'tv' ? 'TV Series' : 'Film'}
                </span>
                {year && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{year}</span>}
                {contentRating && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    border: '1px solid var(--color-border)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '2px',
                    letterSpacing: '0.08em',
                  }}>
                    {contentRating}
                  </span>
                )}
              </div>

              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                fontWeight: 400,
                letterSpacing: '0.02em',
                lineHeight: 1.1,
                color: 'var(--color-text-primary)',
                marginBottom: '0.75rem',
              }}>
                {title}
              </h1>

              {/* Genre tags */}
              {genres.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {genres.map((g) => (
                    <span key={g.id} className="badge badge-genre">{g.name}</span>
                  ))}
                </div>
              )}

              {/* Tagline */}
              {details.tagline && (
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: '1.05rem',
                  color: 'var(--color-accent)',
                  opacity: 0.85,
                  marginBottom: '1rem',
                }}>
                  "{details.tagline}"
                </p>
              )}

              {/* Overview */}
              {details.overview && (
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.75,
                  color: 'var(--color-text-secondary)',
                  maxWidth: '680px',
                  margin: 0,
                }}>
                  {details.overview}
                </p>
              )}
            </div>

            {/* Action row */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '2.5rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid var(--color-border)',
              animation: 'fadeInUp 0.4s ease 0.15s both',
            }}>
              {trailer?.key && (
                <button
                  className="btn btn-primary"
                  onClick={() => setTheaterOpen(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Watch Trailer
                </button>
              )}
              <button className="btn btn-ghost" onClick={handleShare}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {shareToast ? '✓ Copied!' : 'Share'}
              </button>
              {isAdmin && !showReviewForm && (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => { setShowReviewForm(true); setSpoilerRevealed(false); }}
                  >
                    {review ? '✎ Edit Review' : '+ Write Review'}
                  </button>
                  {review && (
                    <button
                      className={`btn ${confirmDelete ? 'btn-danger' : 'btn-ghost'}`}
                      onClick={handleDelete}
                      onBlur={() => setConfirmDelete(false)}
                      style={{ fontSize: '0.78rem' }}
                    >
                      {confirmDelete ? '⚠ Confirm Delete' : '🗑 Delete'}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Review Form (admin) */}
            {showReviewForm && isAdmin && (
              <div style={{ marginBottom: '2.5rem' }}>
                <ReviewForm
                  movie={details}
                  mediaType={mediaType}
                  existingReview={review}
                  onSave={handleReviewSave}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            {/* ═══ REVIEW DISPLAY ═══ */}
            {review && !showReviewForm && (
              <ReviewDisplay
                review={review}
                spoilerRevealed={spoilerRevealed}
                setSpoilerRevealed={setSpoilerRevealed}
                readingTime={readingTime}
                wordCount={wordCount}
              />
            )}

            {/* No review yet */}
            {!review && !showReviewForm && (
              <div style={{
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem',
                textAlign: 'center',
                marginBottom: '2.5rem',
              }}>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  {isAdmin
                    ? 'No review yet. Click "Write Review" above to add your thoughts.'
                    : 'No review has been written for this title yet.'}
                </p>
              </div>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <div style={{ marginBottom: '2.5rem', animation: 'fadeInUp 0.5s ease 0.3s both' }}>
                <CastCarousel cast={cast} />
              </div>
            )}

            {/* Similar titles */}
            {similar.length > 0 && (
              <SimilarSection items={similar} mediaType={mediaType} />
            )}
          </div>
        </div>
      </div>

      {/* Theater Mode */}
      {theaterOpen && trailer?.key && (
        <TheaterMode
          videoId={trailer.key}
          title={title}
          onClose={() => setTheaterOpen(false)}
        />
      )}
    </div>
  );
}

/* ═══ REVIEW DISPLAY ═══ */
function ReviewDisplay({ review, spoilerRevealed, setSpoilerRevealed, readingTime, wordCount }) {
  const ratingLabel = review.rating >= 4.5 ? "Masterpiece" :
    review.rating >= 4 ? "Excellent" :
    review.rating >= 3.5 ? "Very Good" :
    review.rating >= 3 ? "Good" :
    review.rating >= 2 ? "Mixed" : "Disappointing";

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: '2.5rem',
      animation: 'fadeInUp 0.5s ease 0.25s both',
      boxShadow: '0 0 0 1px var(--color-accent-dim)',
    }}>
      {/* Review header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-accent-dim) 0%, transparent 60%)',
        borderBottom: '1px solid var(--color-border)',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              color: 'var(--color-accent)',
            }}>
              ✦ CRITIC'S REVIEW
            </span>
            {review.rating >= 4.5 && (
              <span style={{
                background: 'var(--color-accent)',
                color: '#07070f',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                padding: '0.15rem 0.4rem',
                borderRadius: '2px',
              }}>
                CRITIC'S PICK
              </span>
            )}
          </div>
          <StarRating value={review.rating} readOnly size={22} showValue />
          <div style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '0.95rem',
            color: 'var(--color-text-secondary)',
            marginTop: '0.3rem',
          }}>
            {ratingLabel}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          {review.recommended && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.4rem',
              justifyContent: 'flex-end',
            }}>
              <span style={{ fontSize: '1rem' }}>💚</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#78c878',
              }}>
                Recommended
              </span>
            </div>
          )}
          {review.watchedDate && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Watched {new Date(review.watchedDate).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              })}
            </div>
          )}
          {wordCount > 0 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {wordCount} words · {readingTime} min read
            </div>
          )}
        </div>
      </div>

      {/* Review body */}
      <div style={{ padding: '1.75rem' }}>
        {review.reviewTitle && (
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 500,
            fontStyle: 'italic',
            color: 'var(--color-text-primary)',
            marginBottom: '1rem',
            lineHeight: 1.3,
          }}>
            "{review.reviewTitle}"
          </h3>
        )}

        {review.containsSpoilers && !spoilerRevealed && (
          <div style={{
            background: 'rgba(224,180,60,0.08)',
            border: '1px solid rgba(224,180,60,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
              ⚠ This review contains spoilers
            </span>
            <button
              className="btn btn-outline"
              onClick={() => setSpoilerRevealed(true)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}
            >
              Reveal
            </button>
          </div>
        )}

        {review.reviewText ? (
          <div
            className={review.containsSpoilers && !spoilerRevealed ? 'spoiler-text' : ''}
            onClick={() => review.containsSpoilers && !spoilerRevealed && setSpoilerRevealed(true)}
            style={{ cursor: review.containsSpoilers && !spoilerRevealed ? 'pointer' : 'default' }}
          >
            {review.reviewText.split('\n\n').map((para, i) => (
              <p key={i} style={{
                fontSize: '0.97rem',
                lineHeight: 1.8,
                color: 'var(--color-text-secondary)',
                marginBottom: '1.1rem',
                margin: i < review.reviewText.split('\n\n').length - 1 ? '0 0 1.1rem' : 0,
              }}>
                {para}
              </p>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            No written review yet.
          </p>
        )}

        {/* Review footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#07070f',
          }}>
            C
          </div>
          <div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              letterSpacing: '0.04em',
            }}>
              CineVerse
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Personal Journal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ SIMILAR TITLES ═══ */
function SimilarSection({ items, mediaType }) {
  const navigate = useNavigate();
  return (
    <div style={{ animation: 'fadeInUp 0.5s ease 0.4s both' }}>
      <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>
        You Might Also Like
      </h3>
      <div className="scroll-row">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/${mediaType}/${item.id}`)}
            style={{
              flexShrink: 0,
              width: '110px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '110px',
              aspectRatio: '2/3',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              marginBottom: '0.5rem',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
            >
              {item.poster_path ? (
                <img
                  src={posterUrl(item.poster_path, 'sm')}
                  alt={item.title || item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>🎬</div>
              )}
            </div>
            <p style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {item.title || item.name}
            </p>
            {item.vote_average > 0 && (
              <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>
                ★ {item.vote_average.toFixed(1)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══ LOADING STATE ═══ */
function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 'var(--navbar-height)' }}>
      <div style={{ height: 'clamp(400px, 65vh, 620px)', background: 'var(--color-bg-card)' }} className="skeleton" />
      <div className="page-container" style={{ padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
          <div style={{ marginTop: '-120px' }}>
            <div className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '20px', width: '40%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '52px', width: '70%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '16px', width: '50%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══ ERROR STATE ═══ */
function ErrorState({ message, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.6rem' }}>
        Could Not Load Title
      </h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', fontSize: '0.9rem' }}>
        {message}
      </p>
      <button className="btn btn-outline" onClick={onBack} style={{ marginTop: '0.5rem' }}>
        ← Back to Reviews
      </button>
    </div>
  );
}