import { useEffect, useRef, useState, useCallback } from 'react';
import { backdropUrl } from '../config';

// Singleton YouTube API loader
let ytApiReady = false;
let ytApiCallbacks = [];

const loadYouTubeAPI = () => {
  if (ytApiReady) return Promise.resolve();
  if (window.YT && window.YT.Player) {
    ytApiReady = true;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);
    if (!document.getElementById('yt-iframe-api')) {
      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach((cb) => cb());
        ytApiCallbacks = [];
      };
      const script = document.createElement('script');
      script.id = 'yt-iframe-api';
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });
};

export default function HeroBanner({ videoId, backdropPath, title, onTheaterMode }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const playerDivRef = useRef(null);
  const [playerState, setPlayerState] = useState('loading'); // loading, playing, error
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(50);
  const [videoReady, setVideoReady] = useState(false);

  const initPlayer = useCallback(async () => {
    if (!videoId || !playerDivRef.current) return;
    try {
      await loadYouTubeAPI();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          loop: 1,
          playlist: videoId,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          disablekb: 1,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            e.target.setVolume(volume);
            e.target.playVideo();
            setVideoReady(true);
            setPlayerState('playing');
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.playVideo();
            }
          },
          onError: () => {
            setPlayerState('error');
          },
        },
      });
    } catch {
      setPlayerState('error');
    }
  }, [videoId, volume]);

  useEffect(() => {
    if (videoId) initPlayer();
    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
      setVideoReady(false);
      setMuted(true);
      setPlayerState('loading');
    };
  }, [videoId]);

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      player.setVolume(volume);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseInt(e.target.value);
    setVolume(v);
    if (playerRef.current) playerRef.current.setVolume(v);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {/* Backdrop image — shown while video loads or on error */}
      {backdropPath && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backdropUrl(backdropPath, 'original')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'opacity 1s ease',
            opacity: videoReady ? 0 : 1,
            zIndex: 0,
          }}
        />
      )}

      {/* YouTube iframe */}
      {videoId && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 1.5s ease',
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <div
            ref={playerDivRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '177.78vh',
              height: '100vh',
              minWidth: '100%',
              minHeight: '56.25vw',
            }}
          />
        </div>
      )}

      {/* Letterbox bars */}
      <div className="letterbox-top" style={{ height: '15%', zIndex: 2 }} />
      <div className="letterbox-bottom" style={{ height: '35%', zIndex: 2 }} />

      {/* Side gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to right, rgba(7,7,15,0.75) 0%, transparent 40%)',
        zIndex: 2,
        pointerEvents: 'none',
      }} />

      {/* Controls overlay */}
      {videoId && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(0.85rem, 3vw, 1.5rem)',
          right: 'clamp(0.85rem, 3vw, 1.5rem)',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: '0.6rem',
          zIndex: 10,
        }}>
          {/* Theater Mode */}
          {onTheaterMode && (
            <button
              onClick={onTheaterMode}
              style={{
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

          {/* Volume slider (visible when unmuted) */}
          {!muted && (
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                width: '80px',
                accentColor: 'var(--color-accent)',
                opacity: 0.9,
              }}
            />
          )}

          {/* Mute/Unmute */}
          <button
            onClick={toggleMute}
            style={{
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
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(7,7,15,0.75)';
            }}
          >
            {muted ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                Unmute
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
                Mute
              </>
            )}
          </button>
        </div>
      )}

      {/* No video fallback indicator */}
      {!videoId && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(0.85rem, 3vw, 1.5rem)',
          right: 'clamp(0.85rem, 3vw, 1.5rem)',
          zIndex: 10,
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          No trailer available
        </div>
      )}
    </div>
  );
}