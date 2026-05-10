import { useState } from 'react';
import { saveReview } from '../utils/storage';
import StarRating from './StarRating';

export default function ReviewForm({ movie, mediaType, existingReview, onSave, onCancel, overridePosterUrl, overrideBackdropUrl }) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [reviewTitle, setReviewTitle] = useState(existingReview?.reviewTitle || '');
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [watchedDate, setWatchedDate] = useState(
    existingReview?.watchedDate || new Date().toISOString().split('T')[0]
  );
  const [recommended, setRecommended] = useState(existingReview?.recommended ?? true);
  const [spoilers, setSpoilers] = useState(existingReview?.containsSpoilers ?? false);
  const [saving, setSaving] = useState(false);

  const wordCount = reviewText.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please set a star rating before saving.');
      return;
    }
    setSaving(true);
    try {
      const saved = saveReview({
        tmdbId: movie.id,
        mediaType,
        title: movie.title || movie.name,
        posterPath: overridePosterUrl || movie.poster_path,
        backdropPath: overrideBackdropUrl || movie.backdrop_path,
        rating,
        reviewTitle,
        reviewText,
        watchedDate,
        recommended,
        containsSpoilers: spoilers,
        year: (movie.release_date || movie.first_air_date || '').slice(0, 4),
        genres: movie.genres?.map((g) => g.name) || [],
        tmdbRating: movie.vote_average,
        runtime: movie.runtime || movie.episode_run_time?.[0] || null,
        director: movie.credits?.crew?.find((c) => c.job === 'Director')?.name || null,
      });
      onSave(saved);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '2rem',
        animation: 'fadeInUp 0.3s ease',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.75rem',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          fontWeight: 500,
        }}>
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </h3>
        <span style={{
          fontFamily: 'var(--font-label)',
          fontSize: '0.7rem',
          letterSpacing: '0.15em',
          color: 'var(--color-accent)',
          background: 'var(--color-accent-dim)',
          padding: '0.25rem 0.6rem',
          borderRadius: '2px',
        }}>
          ADMIN
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Rating */}
        <div className="form-group">
          <label className="form-label">Your Rating *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <StarRating
              value={rating}
              onChange={setRating}
              max={5}
              size={28}
              showValue
            />
            {rating > 0 && (
              <button
                onClick={() => setRating(0)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div className="form-group">
          <label className="form-label">Review Headline (optional)</label>
          <input
            className="form-input"
            value={reviewTitle}
            onChange={(e) => setReviewTitle(e.target.value)}
            placeholder="A one-line take on the film…"
            maxLength={120}
          />
        </div>

        {/* Review Text */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label className="form-label">Your Review</label>
            {wordCount > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {wordCount} words · ~{readingTime} min read
              </span>
            )}
          </div>
          <textarea
            className="form-textarea"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think? Share your thoughts, feelings, and observations…"
            style={{ minHeight: '180px' }}
          />
        </div>

        {/* Two columns for date and toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Date Watched</label>
            <input
              type="date"
              className="form-input"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          </div>

          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="form-label">Flags</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <ToggleOption
                checked={recommended}
                onChange={setRecommended}
                label="💚 Recommended"
                description="Would you recommend this?"
              />
              <ToggleOption
                checked={spoilers}
                onChange={setSpoilers}
                label="⚠️ Contains Spoilers"
                description="Warn readers before reading?"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'flex-start',
          flexWrap: 'wrap',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--color-border)',
        }}>
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || rating === 0}
            style={{
              opacity: rating === 0 ? 0.5 : 1,
              cursor: rating === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : existingReview ? 'Update Review' : 'Publish Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleOption({ checked, onChange, label }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      cursor: 'pointer',
      fontSize: '0.85rem',
      color: 'var(--color-text-secondary)',
    }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '10px',
          background: checked ? 'var(--color-accent)' : 'var(--color-bg-card)',
          border: `1px solid ${checked ? 'var(--color-accent)' : 'var(--color-border)'}`,
          position: 'relative',
          transition: 'all 0.25s ease',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: checked ? '#07070f' : 'var(--color-text-muted)',
          transition: 'left 0.25s ease',
        }} />
      </div>
      {label}
    </label>
  );
}
