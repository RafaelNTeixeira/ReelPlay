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

  // Set CSS accent to game colour when on a game route
  const isGameRoute = location.pathname.startsWith('/game');
  useEffect(() => {
    const root = document.documentElement;
    if (isGameRoute) {
      root.style.setProperty('--color-accent', 'rgb(129, 140, 248)');
      root.style.setProperty('--color-accent-rgb', '129, 140, 248');
      root.style.setProperty('--color-accent-dim', 'rgba(129, 140, 248, 0.14)');
      root.style.setProperty('--color-accent-glow', 'rgba(129, 140, 248, 0.38)');
    } else {
      root.style.setProperty('--color-accent', 'rgb(226, 168, 75)');
      root.style.setProperty('--color-accent-rgb', '226, 168, 75');
      root.style.setProperty('--color-accent-dim', 'rgba(226, 168, 75, 0.14)');
      root.style.setProperty('--color-accent-glow', 'rgba(226, 168, 75, 0.38)');
    }
  }, [isGameRoute]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 50,
        height: 'var(--navbar-height)',
        display: 'flex', alignItems: 'center',
        padding: '0 2rem',
        transition: 'all 0.4s ease',
        background: scrolled ? 'rgba(7, 7, 15, 0.97)' : 'linear-gradient(to bottom, rgba(7,7,15,0.92), transparent)',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : 'none',
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', flex: '0 0 auto' }}>
          <ReelPlayIcon isGame={isGameRoute} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'var(--font-label)',
              fontSize: '1.55rem',
              letterSpacing: '0.22em',
              color: isGameRoute ? 'var(--color-game)' : 'var(--color-cinema)',
              transition: 'color 0.4s ease',
            }}>
              REELPLAY
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.6rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginTop: '1px',
            }}>
              Film · Series · Games
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '2.5rem' }}>
          {[
            { label: 'All',     path: '/',            dot: null },
            { label: 'Films',   path: '/?type=movie', dot: 'cinema' },
            { label: 'Series',  path: '/?type=tv',    dot: 'cinema' },
            { label: 'Games',   path: '/?type=game',  dot: 'game' },
          ].map(({ label, path, dot }) => {
            const isActive = location.search === (path.includes('?') ? path.slice(path.indexOf('?')) : '') && location.pathname === '/';
            const isExactHome = path === '/' && location.pathname === '/' && !location.search;
            const active = path === '/' ? isExactHome : isActive;
            const accentColor = dot === 'game' ? 'var(--color-game)' : 'var(--color-cinema)';
            return (
              <Link key={label} to={path} style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.76rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active ? accentColor : 'var(--color-text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = active ? accentColor : 'var(--color-text-secondary)'}
              >
                {dot && (
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: dot === 'game' ? 'var(--color-game)' : 'var(--color-cinema)',
                    display: 'inline-block', flexShrink: 0,
                    opacity: active ? 1 : 0.35,
                  }} />
                )}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/stats" style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            Stats
          </Link>
          <Link to="/watchlist" style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            Watchlist
          </Link>
          <button onClick={() => setSearchOpen(true)} style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.75rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.76rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Search
          </button>

          {isAdmin ? (
            <>
              <Link to="/admin/manage" className="btn btn-ghost" style={{ fontSize: '0.73rem', padding: '0.5rem 1rem' }}>
                ⚙ Manage
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} style={{
                background: 'transparent', border: 'none', color: 'var(--color-text-muted)',
                fontSize: '0.73rem', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', padding: '0.5rem', transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#e05555'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/admin">
              <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '0.5rem', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              title="Admin Login">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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

/* Combined film-reel + play-button icon */
const ReelPlayIcon = ({ isGame }) => {
  const color = isGame ? 'var(--color-game)' : 'var(--color-cinema)';
  return (
    <svg width="30" height="30" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
      {/* Outer ring */}
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="4.5" style={{ transition: 'stroke 0.4s ease' }}/>
      {/* Inner circle */}
      <circle cx="50" cy="50" r="18" fill={color} style={{ transition: 'fill 0.4s ease' }}/>
      {/* Play triangle (games) or reel hole (cinema) */}
      {isGame ? (
        <polygon points="44,42 44,58 60,50" fill="#07070f" />
      ) : (
        <circle cx="50" cy="50" r="6" fill="#07070f"/>
      )}
      {/* Reel holes */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = 50 + 32 * Math.cos(rad);
        const y = 50 + 32 * Math.sin(rad);
        return <circle key={deg} cx={x} cy={y} r="5.5" fill="none" stroke={color} strokeWidth="3" style={{ transition: 'stroke 0.4s ease' }}/>;
      })}
    </svg>
  );
};