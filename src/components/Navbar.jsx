import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import SearchModal from './SearchModal';

export default function Navbar() {
  const { isAdmin, logout } = useAdmin();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 'var(--navbar-height)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem',
        transition: 'all 0.4s ease',
        background: scrolled
          ? 'rgba(7, 7, 15, 0.96)'
          : 'linear-gradient(to bottom, rgba(7,7,15,0.9), transparent)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          textDecoration: 'none',
          flex: '0 0 auto',
        }}>
          <FilmReelIcon />
          <span style={{
            fontFamily: 'var(--font-label)',
            fontSize: '1.6rem',
            letterSpacing: '0.2em',
            color: 'var(--color-accent)',
            lineHeight: 1,
          }}>
            CINEVERSE
          </span>
        </Link>

        {/* Center nav links */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          gap: '2.5rem',
        }}>
          {[
            { label: 'All Reviews', path: '/' },
            { label: 'Movies', path: '/?type=movie' },
            { label: 'TV Shows', path: '/?type=tv' },
            { label: 'Games', path: '/?type=game' },
          ].map(({ label, path }) => (
            <Link
              key={label}
              to={path}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: location.pathname === path.split('?')[0] && !path.includes('?')
                  ? 'var(--color-accent)'
                  : 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--color-text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--color-text-secondary)'}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}
              >
                + Add Review
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.5rem',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#e05555'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/admin">
              <button style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '0.5rem',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Admin Login">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </button>
            </Link>
          )}
        </div>
      </nav>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          setSearchOpen(false);
          if (item.media_type === 'game') navigate(`/game/${item.id}`);
          else navigate(`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`);
        }}
        adminMode={isAdmin}
      />
    </>
  );
}

const FilmReelIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
    <circle cx="50" cy="50" r="46" fill="none" stroke="var(--color-accent)" strokeWidth="5"/>
    <circle cx="50" cy="50" r="12" fill="var(--color-accent)"/>
    <circle cx="50" cy="50" r="5" fill="var(--color-bg)"/>
    {[0, 60, 120, 180, 240, 300].map((deg) => {
      const r = 30;
      const rad = (deg * Math.PI) / 180;
      const x = 50 + r * Math.cos(rad);
      const y = 50 + r * Math.sin(rad);
      return <circle key={deg} cx={x} cy={y} r="7" fill="none" stroke="var(--color-accent)" strokeWidth="3.5"/>;
    })}
  </svg>
);
