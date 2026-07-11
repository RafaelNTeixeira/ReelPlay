import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTVSeasonDetails } from '../utils/tmdb';
import { saveEpisodeRating } from '../utils/storage';
import { stillUrl } from '../config';
import StarRating from './StarRating';

const TV_ACCENT = '#78b4c8';
const TV_ACCENT_DIM = 'rgba(120,180,200,0.1)';

export default function EpisodeRatings({ tmdbId, seasons, episodeRatings, isAdmin, onRatingsChange, seed }) {
  // Only real seasons with at least one episode; keep original TMDB order.
  const validSeasons = useMemo(
    () => (seasons || []).filter((s) => s.episode_count > 0),
    [seasons]
  );

  const [activeSeason, setActiveSeason] = useState(
    validSeasons.find((s) => s.season_number > 0)?.season_number ?? validSeasons[0]?.season_number ?? null
  );
  const [seasonCache, setSeasonCache] = useState({});
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);

  const loadSeason = useCallback(async (seasonNumber) => {
    if (seasonNumber == null || seasonCache[seasonNumber]) return;
    setLoadingSeason(true);
    setError(null);
    try {
      const data = await getTVSeasonDetails(tmdbId, seasonNumber);
      setSeasonCache((prev) => ({ ...prev, [seasonNumber]: data.episodes || [] }));
    } catch {
      setError('Could not load episodes for this season.');
    } finally {
      setLoadingSeason(false);
    }
  }, [tmdbId, seasonCache]);

  useEffect(() => {
    if (activeSeason != null) loadSeason(activeSeason);
  }, [activeSeason]); // eslint-disable-line react-hooks/exhaustive-deps

  const ratingsSummary = useMemo(() => {
    let count = 0;
    let sum = 0;
    Object.values(episodeRatings || {}).forEach((season) => {
      Object.values(season).forEach((v) => { count++; sum += v; });
    });
    return { count, avg: count > 0 ? (sum / count).toFixed(1) : null };
  }, [episodeRatings]);

  const handleRate = async (seasonNumber, episodeNumber, rating) => {
    const key = `${seasonNumber}-${episodeNumber}`;
    setSavingKey(key);
    setError(null);
    try {
      const saved = await saveEpisodeRating(tmdbId, 'tv', seasonNumber, episodeNumber, rating, seed);
      onRatingsChange?.(saved);
    } catch (err) {
      setError(err.message || 'Failed to save episode rating.');
    } finally {
      setSavingKey(null);
    }
  };

  if (validSeasons.length === 0) return null;

  const episodes = activeSeason != null ? (seasonCache[activeSeason] || []) : [];

  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: '2.5rem',
      animation: 'fadeInUp 0.5s ease 0.28s both',
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        background: `linear-gradient(135deg, ${TV_ACCENT_DIM} 0%, transparent 60%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            color: TV_ACCENT,
          }}>
            ⬛ EPISODE RATINGS
          </span>
        </div>
        {ratingsSummary.count > 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {ratingsSummary.count} episode{ratingsSummary.count !== 1 ? 's' : ''} rated · avg {ratingsSummary.avg}/5
          </div>
        )}
      </div>

      {/* Season tabs */}
      <div className="scroll-row" style={{ padding: '1rem 1.5rem 0', gap: '0.5rem' }}>
        {validSeasons.map((s) => {
          const active = s.season_number === activeSeason;
          const label = s.season_number === 0 ? 'Specials' : `Season ${s.season_number}`;
          return (
            <button
              key={s.season_number}
              onClick={() => setActiveSeason(s.season_number)}
              style={{
                flexShrink: 0,
                background: active ? TV_ACCENT : 'transparent',
                color: active ? '#07070f' : 'var(--color-text-secondary)',
                border: `1px solid ${active ? TV_ACCENT : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.9rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Episode list */}
      <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
        {error && (
          <div style={{ color: '#e05555', fontSize: '0.82rem', marginBottom: '0.75rem' }}>⚠ {error}</div>
        )}

        {loadingSeason ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-sm)' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {episodes.map((ep) => {
              const current = episodeRatings?.[activeSeason]?.[ep.episode_number] || 0;
              const key = `${activeSeason}-${ep.episode_number}`;
              const isSaving = savingKey === key;
              const still = stillUrl(ep.still_path, 'sm');
              return (
                <div
                  key={ep.id || ep.episode_number}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-bg-elevated)',
                    border: '1px solid var(--color-border)',
                    opacity: isSaving ? 0.6 : 1,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  <div style={{
                    width: '96px',
                    aspectRatio: '16/9',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    background: 'var(--color-bg-card)',
                  }}>
                    {still ? (
                      <img src={still} alt={ep.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>⬛</div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.15rem' }}>
                      EP {ep.episode_number}{ep.air_date ? ` · ${new Date(ep.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.98rem',
                      color: 'var(--color-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {ep.name}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <StarRating
                      value={current}
                      onChange={isAdmin ? (v) => {
                        const whole = Math.round(v);
                        handleRate(activeSeason, ep.episode_number, whole === current ? 0 : whole);
                      } : undefined}
                      max={5}
                      size={16}
                      readOnly={!isAdmin}
                    />
                  </div>
                </div>
              );
            })}
            {episodes.length === 0 && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No episode data available for this season.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}