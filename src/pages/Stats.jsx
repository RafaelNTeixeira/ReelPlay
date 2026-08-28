import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getReviews } from '../utils/storage';
import { posterUrl } from '../config';

const RATING_BUCKETS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

export default function Stats() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getReviews();
      const completed = data.filter((r) => r.rating > 0);
      setReviews(completed);

      const years = [...new Set(
        completed.map((r) => r.watchedDate && new Date(r.watchedDate).getFullYear()).filter(Boolean)
      )].sort((a, b) => b - a);
      setSelectedYear(years[0] ? String(years[0]) : 'all');
      setLoading(false);
    };
    load();
  }, []);

  const years = useMemo(() => {
    return [...new Set(
      reviews.map((r) => r.watchedDate && new Date(r.watchedDate).getFullYear()).filter(Boolean)
    )].sort((a, b) => b - a);
  }, [reviews]);

  const scoped = useMemo(() => {
    if (selectedYear === 'all') return reviews;
    return reviews.filter((r) => r.watchedDate && new Date(r.watchedDate).getFullYear() === Number(selectedYear));
  }, [reviews, selectedYear]);

  // -- Global (all-time) stats, independent of year selector --
  const globalStats = useMemo(() => {
    const totalRewatches = reviews.reduce((s, r) => s + (r.rewatchCount || 0), 0);
    const movieMinutes = reviews
      .filter((r) => r.mediaType === 'movie' && r.runtime)
      .reduce((s, r) => s + r.runtime * (1 + (r.rewatchCount || 0)), 0);
    const episodesRated = reviews.reduce((s, r) => {
      const er = r.episodeRatings || {};
      return s + Object.values(er).reduce((s2, season) => s2 + Object.keys(season).length, 0);
    }, 0);
    return {
      totalRewatches,
      movieHours: Math.round(movieMinutes / 60),
      episodesRated,
    };
  }, [reviews]);

  // -- Scoped (year-filtered) stats --
  const scopedStats = useMemo(() => {
    const ratings = scoped.map((r) => r.rating).filter(Boolean);
    const avg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    const recommendedPct = scoped.length ? Math.round((scoped.filter((r) => r.recommended).length / scoped.length) * 100) : 0;

    const histogram = RATING_BUCKETS.map((b) => ({
      bucket: b,
      count: scoped.filter((r) => r.rating === b).length,
    }));
    const maxBucket = Math.max(1, ...histogram.map((h) => h.count));

    const genreCounts = {};
    scoped.forEach((r) => (r.genres || []).forEach((g) => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxGenre = Math.max(1, ...topGenres.map(([, c]) => c));

    const directorCounts = {};
    scoped.forEach((r) => { if (r.director) directorCounts[r.director] = (directorCounts[r.director] || 0) + 1; });
    const topDirectors = Object.entries(directorCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxDirector = Math.max(1, ...topDirectors.map(([, c]) => c));

    const byType = {
      movie: scoped.filter((r) => r.mediaType === 'movie').length,
      tv: scoped.filter((r) => r.mediaType === 'tv').length,
      game: scoped.filter((r) => r.mediaType === 'game').length,
    };

    const sorted = [...scoped].sort((a, b) => b.rating - a.rating);
    const highest = sorted[0] || null;
    const lowest = sorted.length ? sorted[sorted.length - 1] : null;

    return { avg, recommendedPct, histogram, maxBucket, topGenres, maxGenre, topDirectors, maxDirector, byType, highest, lowest };
  }, [scoped]);

  const mostRewatched = useMemo(
    () => [...reviews].filter((r) => r.rewatchCount > 0).sort((a, b) => b.rewatchCount - a.rewatchCount).slice(0, 5),
    [reviews]
  );

  const motyGroups = useMemo(() => {
    const contenders = reviews.filter((r) => r.mediaType === 'movie' && r.movieOfTheYear);
    const byYear = {};
    contenders.forEach((r) => {
      (byYear[r.movieOfTheYear] ||= []).push(r);
    });
    return Object.entries(byYear)
      .map(([year, movies]) => ({ year: Number(year), movies: movies.sort((a, b) => b.rating - a.rating) }))
      .sort((a, b) => b.year - a.year);
  }, [reviews]);
  const nowYear = new Date().getFullYear();
  const currentYearGroup = motyGroups.find((g) => g.year === nowYear) || null;
  const pastYearGroups = motyGroups.filter((g) => g.year !== nowYear);

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: 'var(--radius-sm)' }} />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <div>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ fontWeight: 300 }}>Nothing to reflect on yet</h2>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Once reviews come in, the numbers will show up here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', paddingBottom: '5rem' }}>
      {/* Hero */}
      <div style={{
        background: 'radial-gradient(ellipse at 20% 0%, rgba(226,168,75,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 0%, rgba(129,140,248,0.08) 0%, transparent 50%), var(--color-bg)',
        borderBottom: '1px solid var(--color-border)',
        padding: '3.5rem clamp(1rem, 4vw, 2rem) 2.5rem',
      }}>
        <div className="page-container">
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', letterSpacing: '0.22em', color: 'var(--color-accent)' }}>
            ✦ THE NUMBERS
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 300, letterSpacing: '0.03em', margin: '0.5rem 0 2rem' }}>
            A reflection on everything watched &amp; played
          </h1>

          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
            <HeroStat value={reviews.length} label="Total Reviews" />
            <HeroStat value={(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)} label="All-Time Avg ★" />
            <HeroStat value={`${Math.round((reviews.filter((r) => r.recommended).length / reviews.length) * 100)}%`} label="Recommended" />
            <HeroStat value={globalStats.totalRewatches} label="Rewatches Logged" />
            {globalStats.movieHours > 0 && <HeroStat value={globalStats.movieHours} label="Movie Hours Logged" />}
            {globalStats.episodesRated > 0 && <HeroStat value={globalStats.episodesRated} label="Episodes Rated" />}
          </div>
        </div>
      </div>

      <div className="page-container" style={{ padding: '3rem clamp(1rem, 4vw, 2rem) 0' }}>

        {/* Year selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <span className="section-title" style={{ marginBottom: 0, flex: '0 0 auto' }}>Year in Review</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <YearPill label="All Time" active={selectedYear === 'all'} onClick={() => setSelectedYear('all')} />
            {years.map((y) => (
              <YearPill key={y} label={String(y)} active={selectedYear === String(y)} onClick={() => setSelectedYear(String(y))} />
            ))}
          </div>
        </div>

        {/* Year summary row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '3rem',
        }}>
          <SummaryCard label="Reviews" value={scoped.length} />
          <SummaryCard label="Avg Rating" value={scoped.length ? `${scopedStats.avg.toFixed(1)} ★` : '—'} />
          <SummaryCard label="Recommended" value={scoped.length ? `${scopedStats.recommendedPct}%` : '—'} />
          <SummaryCard label="Films / Series / Games" value={`${scopedStats.byType.movie} / ${scopedStats.byType.tv} / ${scopedStats.byType.game}`} small />
        </div>

        {/* Highest / lowest rated */}
        {scoped.length > 1 && scopedStats.highest && scopedStats.lowest && scopedStats.highest.id !== scopedStats.lowest.id && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
            <HighlightCard label="Highest Rated" review={scopedStats.highest} accent="#6bc87a" />
            <HighlightCard label="Lowest Rated" review={scopedStats.lowest} accent="#e05555" />
          </div>
        )}

        {/* Rating histogram */}
        <Section title="Rating Distribution">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: '160px', padding: '0 0.5rem' }}>
            {scopedStats.histogram.map(({ bucket, count }) => (
              <div key={bucket} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{count > 0 ? count : ''}</span>
                <div style={{
                  width: '100%',
                  height: `${count > 0 ? Math.max(6, (count / scopedStats.maxBucket) * 100) : 2}%`,
                  background: count > 0 ? 'var(--color-accent)' : 'var(--color-border)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.4s ease',
                }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>{bucket}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Genre breakdown */}
        {scopedStats.topGenres.length > 0 && (
          <Section title="Top Genres">
            <BarList items={scopedStats.topGenres} max={scopedStats.maxGenre} color="var(--color-cinema)" />
          </Section>
        )}

        {/* Director breakdown */}
        {scopedStats.topDirectors.length > 0 && (
          <Section title="Top Directors" note="Tracked for films only">
            <BarList items={scopedStats.topDirectors} max={scopedStats.maxDirector} color="var(--color-game)" />
          </Section>
        )}

        {/* Movies of the Year (independent of the year selector above) */}
        {motyGroups.length > 0 && (
          <Section title="Movies of the Year" note="Films only · your shortlist of contenders per year">
            {currentYearGroup ? (
              <MovieOfYearGroup year={nowYear} movies={currentYearGroup.movies} featured />
            ) : (
              <div style={{
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                marginBottom: pastYearGroups.length > 0 ? '1.5rem' : 0,
              }}>
                No {nowYear} contenders marked yet.
              </div>
            )}

            {pastYearGroups.length > 0 && (
              <div style={{ marginTop: currentYearGroup ? '2rem' : 0, display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  Past Years
                </div>
                {pastYearGroups.map((g) => (
                  <MovieOfYearGroup key={g.year} year={g.year} movies={g.movies} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* Most rewatched (always all-time) */}
        {mostRewatched.length > 0 && (
          <Section title="Most Rewatched" note="All-time">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {mostRewatched.map((r) => (
                <RewatchTile key={r.id} review={r} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function HeroStat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginTop: '0.35rem' }}>
        {label}
      </div>
    </div>
  );
}

function YearPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? '#07070f' : 'var(--color-text-secondary)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.32rem 0.8rem',
        fontSize: '0.76rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

function SummaryCard({ label, value, small }) {
  return (
    <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.4rem' }}>
      <div style={{ fontFamily: small ? 'var(--font-body)' : 'var(--font-display)', fontSize: small ? '1.1rem' : '1.6rem', fontWeight: small ? 700 : 500, color: 'var(--color-text-primary)' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginTop: '0.3rem' }}>
        {label}
      </div>
    </div>
  );
}

function HighlightCard({ label, review, accent }) {
  const isFullUrl = review.posterPath?.startsWith('http');
  const img = isFullUrl ? review.posterPath : (review.posterPath ? posterUrl(review.posterPath, 'sm') : null);
  return (
    <Link
      to={`/${review.mediaType}/${review.tmdbId}`}
      style={{
        display: 'flex', gap: '1rem', alignItems: 'center',
        background: 'var(--color-bg-card)', border: `1px solid ${accent}33`,
        borderRadius: 'var(--radius-md)', padding: '1rem', textDecoration: 'none',
      }}
    >
      <div style={{ width: '52px', height: '72px', borderRadius: '3px', overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-elevated)' }}>
        {img && <img src={img} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{review.rating.toFixed(1)} ★</div>
      </div>
    </Link>
  );
}

function Section({ title, note, children }) {
  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500 }}>{title}</h3>
        {note && <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}

function BarList({ items, max, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {items.map(([label, count]) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', width: '130px', flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
          <div style={{ flex: 1, background: 'var(--color-bg-elevated)', borderRadius: '3px', overflow: 'hidden', height: '10px' }}>
            <div style={{ width: `${Math.max(4, (count / max) * 100)}%`, height: '100%', background: color, borderRadius: '3px' }} />
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', width: '24px', textAlign: 'right', flexShrink: 0 }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

function RewatchTile({ review }) {
  const isFullUrl = review.posterPath?.startsWith('http');
  const img = isFullUrl ? review.posterPath : (review.posterPath ? posterUrl(review.posterPath, 'sm') : null);
  return (
    <Link to={`/${review.mediaType}/${review.tmdbId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-card)', position: 'relative', marginBottom: '0.5rem' }}>
        {img && <img src={img} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', bottom: '0.4rem', left: '0.4rem', background: 'rgba(7,7,15,0.8)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '2px' }}>
          🔁 {review.rewatchCount + 1}×
        </div>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.title}</div>
    </Link>
  );
}

function MovieOfYearGroup({ year, movies, featured }) {
  return (
    <div style={{
      background: featured ? 'linear-gradient(135deg, rgba(226,184,62,0.1) 0%, transparent 60%)' : 'transparent',
      border: featured ? '1px solid rgba(226,184,62,0.35)' : '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '1.5rem',
    }}>
      <div style={{ fontSize: featured ? '0.72rem' : '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e2b83e', marginBottom: '1rem' }}>
        🏆 {year} · {movies.length} contender{movies.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${featured ? '130px' : '110px'}, 1fr))`, gap: '1rem' }}>
        {movies.map((r) => (
          <MovieOfYearTile key={r.id} review={r} large={featured} />
        ))}
      </div>
    </div>
  );
}

function MovieOfYearTile({ review, large }) {
  const isFullUrl = review.posterPath?.startsWith('http');
  const img = isFullUrl ? review.posterPath : (review.posterPath ? posterUrl(review.posterPath, large ? 'md' : 'sm') : null);
  return (
    <Link to={`/movie/${review.tmdbId}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-card)', position: 'relative', marginBottom: '0.5rem', boxShadow: large ? '0 12px 30px rgba(0,0,0,0.4)' : 'none' }}>
        {img && <img src={img} alt={review.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', bottom: '0.4rem', left: '0.4rem', background: 'rgba(7,7,15,0.8)', color: '#e2b83e', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '2px' }}>
          {review.rating.toFixed(1)} ★
        </div>
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{review.title}</div>
    </Link>
  );
}