import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getReviews, updateReviewFlags, deleteReview } from '../utils/storage';
import { posterUrl } from '../config';
import { useAdmin } from '../context/AdminContext';

export default function AdminManage() {
  const { isAdmin } = useAdmin();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/admin" replace />;

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (typeFilter !== 'all' && r.mediaType !== typeFilter) return false;
      if (search.trim() && !r.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [reviews, typeFilter, search]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const allSelected = filtered.every((r) => prev.has(r.id));
      if (allSelected) {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const selectedReviews = reviews.filter((r) => selected.has(r.id));

  const applyField = async (review, field, value) => {
    setError(null);
    try {
      const updated = await updateReviewFlags(review.tmdbId, review.mediaType, { [field]: value });
      setReviews((prev) => prev.map((r) => (r.id === review.id ? updated : r)));
    } catch (err) {
      setError(err.message);
    }
  };

  const applyToggle = (review, field) => applyField(review, field, !review[field]);

  const bulkApply = async (field, value) => {
    setBusy(true);
    setError(null);
    try {
      const updates = await Promise.all(
        selectedReviews.map((r) => updateReviewFlags(r.tmdbId, r.mediaType, { [field]: value }))
      );
      const byId = new Map(updates.map((u) => [u.id, u]));
      setReviews((prev) => prev.map((r) => byId.get(r.id) || r));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const bulkDelete = async () => {
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await Promise.all(selectedReviews.map((r) => deleteReview(r.tmdbId, r.mediaType)));
      setReviews((prev) => prev.filter((r) => !selected.has(r.id)));
      setSelected(new Set());
      setConfirmBulkDelete(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '5rem' }}>
      <div className="page-container" style={{ padding: '2.5rem 2rem 0' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--color-accent)' }}>
            ✦ ADMIN
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 3vw, 2.3rem)', fontWeight: 300, margin: '0.4rem 0 0' }}>
            Manage Reviews
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
            Edit rating, rewatch count, and Movie of the Year per title, or select multiple to update Recommended / Reviewer's Pick in bulk.
            For TV series, this is the overall series rating only — episode ratings are managed on the series page itself.
            Multiple movies can share the same Movie of the Year year — think of it as your shortlist of contenders, not a single winner.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.25rem' }}>
          <input
            className="form-input"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '280px' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[
              { label: 'All', value: 'all' },
              { label: '▶ Films', value: 'movie' },
              { label: '⬛ Series', value: 'tv' },
              { label: '🎮 Games', value: 'game' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setTypeFilter(value)}
                style={{
                  background: typeFilter === value ? 'var(--color-accent)' : 'transparent',
                  color: typeFilter === value ? '#07070f' : 'var(--color-text-secondary)',
                  border: `1px solid ${typeFilter === value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            {filtered.length} title{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <div style={{ background: 'rgba(224,85,85,0.08)', border: '1px solid rgba(224,85,85,0.35)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', color: '#e05555', fontSize: '0.84rem', marginBottom: '1rem' }}>
            ⚠ {error}
          </div>
        )}

        {/* Bulk action bar */}
        <div style={{
          position: 'sticky',
          top: 'calc(var(--navbar-height) + 0.75rem)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          background: selected.size > 0 ? 'var(--color-bg-elevated)' : 'transparent',
          border: selected.size > 0 ? '1px solid var(--color-accent)' : '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          padding: selected.size > 0 ? '0.75rem 1rem' : '0',
          marginBottom: '1rem',
          minHeight: selected.size > 0 ? 'auto' : '0',
          transition: 'all 0.2s ease',
        }}>
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                {selected.size} selected
              </span>
              <button className="btn btn-outline" disabled={busy} onClick={() => bulkApply('reviewerPick', true)} style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}>
                ⭐ Set Reviewer's Pick
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => bulkApply('reviewerPick', false)} style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}>
                Remove Pick
              </button>
              <button className="btn btn-outline" disabled={busy} onClick={() => bulkApply('recommended', true)} style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}>
                💚 Set Recommended
              </button>
              <button className="btn btn-ghost" disabled={busy} onClick={() => bulkApply('recommended', false)} style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}>
                Remove Recommended
              </button>
              <button
                className={`btn ${confirmBulkDelete ? 'btn-danger' : 'btn-ghost'}`}
                disabled={busy}
                onClick={bulkDelete}
                onBlur={() => setConfirmBulkDelete(false)}
                style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}
              >
                {confirmBulkDelete ? '⚠ Confirm Delete' : '🗑 Delete Selected'}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => { setSelected(new Set()); setConfirmBulkDelete(false); }}
                style={{ fontSize: '0.72rem', padding: '0.4rem 0.8rem', marginLeft: 'auto' }}
              >
                Clear Selection
              </button>
            </>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '56px', borderRadius: 'var(--radius-sm)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', padding: '2rem 0' }}>No reviews match this search/filter.</p>
        ) : (
          <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.6rem 1rem',
              background: 'var(--color-bg-elevated)', borderBottom: '1px solid var(--color-border)',
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)',
            }}>
              <input type="checkbox" checked={filtered.length > 0 && filtered.every((r) => selected.has(r.id))} onChange={selectAllVisible} />
              <span style={{ width: '44px' }} />
              <span style={{ flex: 1 }}>Title</span>
              <span style={{ width: '78px', textAlign: 'center' }}>Rating</span>
              <span style={{ width: '90px', textAlign: 'center' }}>Rewatches</span>
              <span style={{ width: '90px', textAlign: 'center' }}>Recommended</span>
              <span style={{ width: '110px', textAlign: 'center' }}>Reviewer's Pick</span>
              <span style={{ width: '150px', textAlign: 'center' }}>Movie of the Year</span>
              <span style={{ width: '50px' }} />
            </div>

            {filtered.map((r) => {
              const isFullUrl = r.posterPath?.startsWith('http');
              const img = isFullUrl ? r.posterPath : (r.posterPath ? posterUrl(r.posterPath, 'sm') : null);
              const typeLabel = r.mediaType === 'movie' ? '▶ Film' : r.mediaType === 'tv' ? '⬛ Series' : '🎮 Game';
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.6rem 1rem',
                    borderBottom: '1px solid var(--color-border)', background: selected.has(r.id) ? 'var(--color-accent-dim)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                  <div style={{ width: '34px', height: '48px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-card)' }}>
                    {img && <img src={img} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.title}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{typeLabel}{r.year ? ` · ${r.year}` : ''}</div>
                  </div>
                  <span style={{ width: '78px', textAlign: 'center' }}>
                    <RatingCell review={r} onSave={(v) => applyField(r, 'rating', v)} />
                  </span>
                  <span style={{ width: '90px', textAlign: 'center' }}>
                    <RewatchCell review={r} onSave={(v) => applyField(r, 'rewatchCount', v)} />
                  </span>
                  <div style={{ width: '90px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!r.recommended} onChange={() => applyToggle(r, 'recommended')} />
                  </div>
                  <div style={{ width: '110px', textAlign: 'center' }}>
                    <input type="checkbox" checked={!!r.reviewerPick} onChange={() => applyToggle(r, 'reviewerPick')} />
                  </div>
                  <div style={{ width: '150px', textAlign: 'center' }}>
                    {r.mediaType === 'movie' ? (
                      <MovieOfYearCell review={r} onSave={(y) => applyField(r, 'movieOfTheYear', y)} />
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>—</span>
                    )}
                  </div>
                  <Link to={`/${r.mediaType}/${r.tmdbId}`} style={{ width: '50px', fontSize: '0.72rem', color: 'var(--color-accent)', textAlign: 'right' }}>
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RatingCell({ review, onSave }) {
  const [value, setValue] = useState(review.rating);

  useEffect(() => { setValue(review.rating); }, [review.rating]);

  const commit = () => {
    let v = parseFloat(value);
    if (isNaN(v)) v = 0;
    v = Math.min(5, Math.max(0, Math.round(v * 2) / 2)); // clamp 0-5, snap to nearest 0.5
    setValue(v);
    if (v !== review.rating) onSave(v);
  };

  return (
    <input
      type="number"
      min="0"
      max="5"
      step="0.5"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      title={review.mediaType === 'tv' ? 'Overall series rating' : 'Rating'}
      style={{
        width: '56px',
        textAlign: 'center',
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-text-primary)',
        fontSize: '0.82rem',
        padding: '0.3rem',
      }}
    />
  );
}

function RewatchCell({ review, onSave }) {
  const count = review.rewatchCount || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
      <button
        onClick={() => onSave(Math.max(0, count - 1))}
        disabled={count === 0}
        className="btn btn-ghost"
        style={{ padding: '0.15rem 0.5rem', fontSize: '0.78rem', opacity: count === 0 ? 0.4 : 1 }}
      >
        −
      </button>
      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', minWidth: '1.1rem', textAlign: 'center' }}>{count}</span>
      <button
        onClick={() => onSave(count + 1)}
        className="btn btn-ghost"
        style={{ padding: '0.15rem 0.5rem', fontSize: '0.78rem' }}
      >
        +
      </button>
    </div>
  );
}

function MovieOfYearCell({ review, onSave }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - i);
  const value = review.movieOfTheYear ?? '';

  return (
    <select
      value={value}
      onChange={(e) => onSave(e.target.value === '' ? null : Number(e.target.value))}
      style={{
        background: value ? 'rgba(226,184,62,0.14)' : 'var(--color-bg-elevated)',
        border: `1px solid ${value ? '#e2b83e' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-sm)',
        color: value ? '#e2b83e' : 'var(--color-text-secondary)',
        fontSize: '0.78rem',
        fontWeight: value ? 700 : 400,
        padding: '0.3rem 0.5rem',
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
      }}
    >
      <option value="">— None —</option>
      {years.map((y) => (
        <option key={y} value={y}>🏆 {y}</option>
      ))}
    </select>
  );
}