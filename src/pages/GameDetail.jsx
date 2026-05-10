import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getGameDetails,
  getGameScreenshots,
  getGameTrailers,
  getSuggestedGames,
  stripHtml,
  getPlatformLabel,
  metacriticColor,
} from '../utils/rawg';
import { getReview, deleteReview } from '../utils/storage';
import { useAdmin } from '../context/AdminContext';
import { useTheme } from '../context/ThemeContext';
import StarRating from '../components/StarRating';
import ReviewForm from '../components/ReviewForm';
import ScreenshotCarousel from '../components/ScreenshotCarousel';
import TheaterMode from '../components/TheaterMode';

const PLATFORM_ICONS = {
  PC: '💻', PS5: '🎮', PS4: '🎮', PS3: '🎮', PlayStation: '🎮',
  'Xbox Series': '🟩', 'Xbox One': '🟩', 'Xbox 360': '🟩', Xbox: '🟩',
  Switch: '🔴', '3DS': '🔴', 'Wii U': '🔴', Wii: '🔴',
  macOS: '🍎', Linux: '🐧', Android: '📱', iOS: '📱',
};

export default function GameDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { extractFromImage, resetPalette } = useTheme();

  const [game, setGame] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [theaterOpen, setTheaterOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const videoRef = useRef(null);
  const colorExtracted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      colorExtracted.current = false;
      setSpoilerRevealed(false);
      setShowReviewForm(false);
      setHeroVideoReady(false);
      try {
        const [details, shots, vids, sugg] = await Promise.allSettled([
          getGameDetails(id),
          getGameScreenshots(id),
          getGameTrailers(id),
          getSuggestedGames(id),
        ]);
        if (cancelled) return;
        if (details.status === 'fulfilled') setGame(details.value);
        else throw new Error('Game not found');
        if (shots.status === 'fulfilled') setScreenshots(shots.value.results || []);
        if (vids.status === 'fulfilled') setTrailers(vids.value.results || []);
        if (sugg.status === 'fulfilled') setSuggested(sugg.value.results || []);
        setReview(await getReview(Number(id), 'game'));
      } catch {
        if (!cancelled) setError('Could not load this game. Check your RAWG API key.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; resetPalette(); };
  }, [id]);

  useEffect(() => {
    if (game?.background_image && !colorExtracted.current) {
      colorExtracted.current = true;
      extractFromImage(game.background_image);
    }
  }, [game, extractFromImage]);

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
  if (error || !game) return <ErrorState message={error} onBack={() => navigate('/')} />;

  const description = stripHtml(game.description);
  const platforms = (game.platforms || []).map((p) => getPlatformLabel(p.platform.name));
  const uniquePlatforms = [...new Set(platforms)];
  const genres = (game.genres || []).map((g) => g.name);
  const developers = (game.developers || []).map((d) => d.name).join(', ');
  const publishers = (game.publishers || []).map((p) => p.name).join(', ');
  const releaseYear = game.released ? new Date(game.released).getFullYear() : null;
  const wordCount = review?.reviewText ? review.reviewText.trim().split(/\s+/).filter(Boolean).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  // Clip: prefer YouTube ID from clip object, else direct MP4
  const youtubeTrailerId = game.clip?.video || null;
  const mp4ClipUrl = game.clip?.clips?.full || game.clip?.clip || null;
  const firstTrailerYouTube = trailers[0]?.data && null; // RAWG trailers are direct MP4s
  const firstTrailerMp4 = trailers[0]?.data?.max || trailers[0]?.data?.['480'] || null;

  const hasYouTubeTrailer = !!youtubeTrailerId;
  const hasVideoHero = hasYouTubeTrailer || !!mp4ClipUrl;

  // tmdb-compatible shape for ReviewForm
  const gameAsMovie = {
    id: game.id,
    title: game.name,
    poster_path: null,
    backdrop_path: null,
    genres: game.genres || [],
    // pass full image URLs directly
    _rawgBackground: game.background_image,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ═══ HERO ═══ */}
      <div style={{
        position: 'relative',
        height: 'clamp(400px, 65vh, 620px)',
      }}>
        {/* Background image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: game.background_image ? `url(${game.background_image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'opacity 1s ease',
          opacity: heroVideoReady ? 0 : 1,
        }} />

        {/* HTML5 clip video (if no YouTube ID) */}
        {!hasYouTubeTrailer && mp4ClipUrl && (
          <video
            ref={videoRef}
            src={mp4ClipUrl}
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={() => setHeroVideoReady(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: heroVideoReady ? 1 : 0,
              transition: 'opacity 1s ease',
              zIndex: 0,
            }}
          />
        )}

        {/* Gradients */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(to right, rgba(7,7,15,0.92) 0%, rgba(7,7,15,0.45) 55%, transparent 100%),
            linear-gradient(to top, rgba(7,7,15,1) 0%, transparent 40%)
          `,
          zIndex: 2,
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

        {/* Hero content */}
        <div className="page-container" style={{
          position: 'absolute',
          bottom: '3rem',
          left: 0,
          right: 0,
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              color: 'var(--color-accent)',
              background: 'var(--color-accent-dim)',
              padding: '0.2rem 0.55rem',
              borderRadius: '2px',
            }}>
              🎮 VIDEO GAME
            </span>
            {releaseYear && (
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{releaseYear}</span>
            )}
            {game.esrb_rating && (
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '0.1rem 0.4rem',
                borderRadius: '2px',
                letterSpacing: '0.08em',
              }}>
                {game.esrb_rating.name}
              </span>
            )}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 400,
            color: '#fff',
            letterSpacing: '0.02em',
            lineHeight: 1.1,
            marginBottom: '1rem',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            animation: 'fadeInUp 0.5s ease',
          }}>
            {game.name}
          </h1>

          {/* Platform badges in hero */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {uniquePlatforms.slice(0, 6).map((p) => (
              <span key={p} style={{
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.65)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                padding: '0.15rem 0.5rem',
                borderRadius: '2px',
                backdropFilter: 'blur(6px)',
                fontWeight: 700,
                letterSpacing: '0.06em',
              }}>
                {PLATFORM_ICONS[p] || '🕹'} {p}
              </span>
            ))}
          </div>
        </div>

        {/* Trailer controls */}
        {(hasYouTubeTrailer || firstTrailerMp4) && (
          <button
            onClick={() => setTheaterOpen(true)}
            style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '1.5rem',
              zIndex: 10,
              background: 'rgba(7,7,15,0.75)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent)';
              e.currentTarget.style.color = '#07070f';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(7,7,15,0.75)';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Theater Mode
          </button>
        )}
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="page-container" style={{ padding: '0 2rem 6rem', position: 'relative', zIndex: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem', alignItems: 'start' }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ marginTop: '-80px' }}>
            {/* Cover art */}
            <div style={{
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.07)',
              marginBottom: '1.5rem',
              aspectRatio: '3/4',
              animation: 'fadeInUp 0.5s ease',
            }}>
              {game.background_image ? (
                <img
                  src={game.background_image}
                  alt={game.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="poster-placeholder" style={{ height: '100%', fontSize: '4rem' }}>🎮</div>
              )}
            </div>

            {/* Scores */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1rem',
              animation: 'fadeInUp 0.5s ease 0.1s both',
            }}>
              <div style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '1rem',
              }}>
                Scores
              </div>

              {/* RAWG rating */}
              {game.rating > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>RAWG</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                      {game.rating.toFixed(1)}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>/ 5</span>
                  </div>
                  {game.ratings_count > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                      {game.ratings_count.toLocaleString()} ratings
                    </div>
                  )}
                </div>
              )}

              {/* Metacritic */}
              {game.metacritic && (
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>Metacritic</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.3rem 0.75rem',
                    border: `2px solid ${metacriticColor(game.metacritic)}`,
                    borderRadius: '4px',
                    fontFamily: 'var(--font-label)',
                    fontSize: '1.5rem',
                    color: metacriticColor(game.metacritic),
                    letterSpacing: '0.05em',
                  }}>
                    {game.metacritic}
                  </div>
                </div>
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
              animation: 'fadeInUp 0.5s ease 0.15s both',
            }}>
              {[
                { label: 'Released', value: game.released ? new Date(game.released).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null },
                { label: 'Developer', value: developers || null },
                { label: 'Publisher', value: publishers || null },
                { label: 'Playtime', value: game.playtime ? `~${game.playtime}h avg` : null },
                { label: 'Achievements', value: game.achievements_count > 0 ? `${game.achievements_count}` : null },
              ].filter((f) => f.value).map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ paddingTop: '2rem', minWidth: 0, overflow: 'hidden' }}>

            {/* Genre tags */}
            {genres.length > 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {genres.map((g) => (
                  <span key={g} className="badge badge-genre">{g}</span>
                ))}
              </div>
            )}

            {/* Description */}
            {description && (
              <div style={{ marginBottom: '2rem', animation: 'fadeInUp 0.4s ease 0.1s both' }}>
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.78,
                  color: 'var(--color-text-secondary)',
                  maxWidth: '680px',
                  display: '-webkit-box',
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: 0,
                }}>
                  {description}
                </p>
              </div>
            )}

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
              {(hasYouTubeTrailer || firstTrailerMp4) && (
                <button className="btn btn-primary" onClick={() => setTheaterOpen(true)}>
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
                  <button className="btn btn-outline" onClick={() => setShowReviewForm(true)}>
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

            {/* Review Form */}
            {showReviewForm && isAdmin && (
              <div style={{ marginBottom: '2.5rem' }}>
                <ReviewForm
                  movie={{
                    id: game.id,
                    title: game.name,
                    poster_path: null,
                    backdrop_path: null,
                    genres: game.genres || [],
                    _gameImageUrl: game.background_image,
                  }}
                  mediaType="game"
                  existingReview={review}
                  onSave={handleReviewSave}
                  onCancel={() => setShowReviewForm(false)}
                  overridePosterUrl={game.background_image}
                  overrideBackdropUrl={game.background_image}
                />
              </div>
            )}

            {/* Review Display */}
            {review && !showReviewForm && (
              <GameReviewDisplay
                review={review}
                spoilerRevealed={spoilerRevealed}
                setSpoilerRevealed={setSpoilerRevealed}
                readingTime={readingTime}
                wordCount={wordCount}
              />
            )}

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
                    ? 'No review yet. Click "Write Review" to add your thoughts.'
                    : 'No review has been written for this game yet.'}
                </p>
              </div>
            )}

            {/* Screenshots */}
            {screenshots.length > 0 && (
              <div style={{ marginBottom: '2.5rem', animation: 'fadeInUp 0.5s ease 0.3s both' }}>
                <ScreenshotCarousel screenshots={screenshots} />
              </div>
            )}

            {/* Suggested games */}
            {suggested.length > 0 && (
              <SuggestedSection games={suggested} />
            )}
          </div>
        </div>
      </div>

      {/* Theater Mode */}
      {theaterOpen && (
        hasYouTubeTrailer ? (
          <TheaterMode videoId={youtubeTrailerId} title={game.name} onClose={() => setTheaterOpen(false)} />
        ) : firstTrailerMp4 ? (
          <VideoTheaterMode src={firstTrailerMp4} title={game.name} onClose={() => setTheaterOpen(false)} />
        ) : null
      )}
    </div>
  );
}

/* ── Direct MP4 Theater Mode ── */
function VideoTheaterMode({ src, title, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.3s ease',
        backdropFilter: 'blur(6px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: '90%', maxWidth: '960px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        {title && <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 400 }}>{title}</h2>}
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
      <div style={{ width: '90%', maxWidth: '960px', aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.8)', animation: 'scaleIn 0.35s ease' }}>
        <video src={src} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
      </div>
      <p style={{ marginTop: '1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Press ESC or click outside to close</p>
    </div>
  );
}

/* ── Review Display ── */
function GameReviewDisplay({ review, spoilerRevealed, setSpoilerRevealed, readingTime, wordCount }) {
  const ratingLabel = review.rating >= 4.5 ? "Masterpiece" : review.rating >= 4 ? "Excellent" : review.rating >= 3.5 ? "Very Good" : review.rating >= 3 ? "Good" : review.rating >= 2 ? "Mixed" : "Disappointing";

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
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', letterSpacing: '0.2em', color: 'var(--color-accent)' }}>
              🎮 GAME REVIEW
            </span>
            {review.rating >= 4.5 && (
              <span style={{ background: 'var(--color-accent)', color: '#07070f', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', padding: '0.15rem 0.4rem', borderRadius: '2px' }}>
                CRITIC'S PICK
              </span>
            )}
          </div>
          <StarRating value={review.rating} readOnly size={22} showValue />
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>{ratingLabel}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {review.recommended && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', justifyContent: 'flex-end' }}>
              <span>💚</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#78c878' }}>Recommended</span>
            </div>
          )}
          {review.watchedDate && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Played {new Date(review.watchedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          )}
          {wordCount > 0 && (
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              {wordCount} words · {readingTime} min read
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '1.75rem' }}>
        {review.reviewTitle && (
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, fontStyle: 'italic', color: 'var(--color-text-primary)', marginBottom: '1rem', lineHeight: 1.3 }}>
            "{review.reviewTitle}"
          </h3>
        )}
        {review.containsSpoilers && !spoilerRevealed && (
          <div style={{ background: 'rgba(224,180,60,0.08)', border: '1px solid rgba(224,180,60,0.25)', borderRadius: 'var(--radius-sm)', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>⚠ This review contains spoilers</span>
            <button className="btn btn-outline" onClick={() => setSpoilerRevealed(true)} style={{ fontSize: '0.75rem', padding: '0.35rem 0.85rem' }}>Reveal</button>
          </div>
        )}
        {review.reviewText ? (
          <div className={review.containsSpoilers && !spoilerRevealed ? 'spoiler-text' : ''} onClick={() => review.containsSpoilers && !spoilerRevealed && setSpoilerRevealed(true)} style={{ cursor: review.containsSpoilers && !spoilerRevealed ? 'pointer' : 'default' }}>
            {review.reviewText.split('\n\n').map((para, i, arr) => (
              <p key={i} style={{ fontSize: '0.97rem', lineHeight: 1.8, color: 'var(--color-text-secondary)', margin: i < arr.length - 1 ? '0 0 1.1rem' : 0 }}>{para}</p>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No written review yet.</p>
        )}
      </div>
    </div>
  );
}

/* ── Suggested Games ── */
function SuggestedSection({ games }) {
  const navigate = useNavigate();
  return (
    <div style={{ animation: 'fadeInUp 0.5s ease 0.4s both' }}>
      <h3 className="section-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>You Might Also Like</h3>
      <div className="scroll-row">
        {games.map((g) => (
          <div key={g.id} onClick={() => navigate(`/game/${g.id}`)} style={{ flexShrink: 0, width: '130px', cursor: 'pointer' }}>
            <div style={{
              width: '130px', aspectRatio: '16/10',
              borderRadius: 'var(--radius-sm)', overflow: 'hidden',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              marginBottom: '0.5rem',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
            >
              {g.background_image ? (
                <img src={g.background_image} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎮</div>
              )}
            </div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {g.name}
            </p>
            {g.rating > 0 && <p style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0' }}>★ {g.rating.toFixed(1)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', paddingTop: 'var(--navbar-height)' }}>
      <div className="skeleton" style={{ height: 'clamp(400px, 65vh, 620px)' }} />
      <div className="page-container" style={{ padding: '3rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
          <div style={{ marginTop: '-80px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)' }} />
          </div>
          <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '20px', width: '40%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '52px', width: '70%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '80px', width: '100%', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message, onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem' }}>⚠️</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: '1.6rem' }}>Could Not Load Game</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '400px', fontSize: '0.9rem' }}>{message}</p>
      <button className="btn btn-outline" onClick={onBack} style={{ marginTop: '0.5rem' }}>← Back to Reviews</button>
    </div>
  );
}