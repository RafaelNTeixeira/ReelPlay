# 🎬 CineVerse - A Cinematic Review Journal

> A personal movie & TV review website with a cinematic, immersive experience. Powered by the TMDB API.

---

## 🌐 Deployment

This app is deployed in Vercel under the link: [CineVerse on Vercel](https://cineverse-ruddy-three.vercel.app/)

---

## ✨ Features

### 🎥 Cinematic Trailer Integration
- **Netflix-Style Hero Banner** - Every movie/show detail page opens with an auto-playing, muted YouTube trailer filling the entire header. A prominent **Unmute** button and volume slider let you dive in immediately.
- **Theater Mode** - A dedicated "Watch Trailer" button dims the entire page to 90% black and centers the player for a distraction-free experience. Press `ESC` or click outside to exit.

### 🎮 Video Game Reviews
- **RAWG-powered** - game data, cover art, Metacritic scores, platforms, developers
- **Screenshot lightbox** - full-screen gallery with previous/next navigation
- **Trailer support** - YouTube IDs and direct MP4 clips both handled
- **Platform badges** - PS5, Xbox Series, PC, Switch and more displayed on cards and detail pages
- **Scanline overlay** - game cards and game routes use a CRT scanline texture instead of film grain

### 🎨 Adaptive UI/UX
- **Dynamic Color Palettes** - Uses [ColorThief](https://lokeshdhakar.com/projects/color-thief/) to extract the dominant colors from the official movie poster, then dynamically updates accent colors, button highlights, and background gradients to perfectly match the film being viewed.
- **Film Grain Overlay** - A canvas-based animated film grain texture rendered over the entire page for an authentic cinematic feel.


![alt text](images/image.png)

### 🔐 Admin-Only Reviews
- Password-protected admin session (session-scoped, clears on browser close).
- Only the admin can write, edit, or delete reviews. Visitors have read-only access.
- Review form includes: **5-star rating**, **headline**, **full review text**, **watched date**, **recommended toggle**, and a **spoiler warning** flag.
- Spoiler-tagged reviews are blurred for visitors, with a one-click reveal.

![alt text](images/image-1.png)

### 🗂 Review Management
- Filter by **Films** or **TV Series**, sort by **Latest**, **Highest Rated**, or **A–Z**.
- Reviews are persisted in `Supabase`.
- **Critic's Pick** badge automatically awarded to titles rated 4.5★ or above.
- Stats bar shows total reviews, film/series count, recommendations, and average rating.

![alt text](images/image-2.png)

### 🎞 Extra Cinematic Touches
- Cast carousel with profile photos pulled from TMDB.
- "You Might Also Like" similar titles section.
- Quick-facts sidebar: runtime, budget, revenue, content rating, director/writer.
- Share button copies the page URL to clipboard.
- Reading time estimator on reviews.
- Responsive design - works on mobile, tablet, and desktop.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── CastCarousel.jsx        # Scrollable cast list
│   ├── FilmGrain.jsx           # Grain (cinema) / scanlines (games)
│   ├── HeroBanner.jsx          # Auto-playing YouTube hero
│   ├── MovieCard.jsx           # Cinema card + Game card (two designs)
│   ├── Navbar.jsx              # Context-aware, dual-accent nav
│   ├── ReviewForm.jsx          # Admin review editor
│   ├── ScreenshotCarousel.jsx  # Game screenshot lightbox
│   ├── SearchModal.jsx         # TMDB + RAWG tabbed search
│   ├── StarRating.jsx          # Half-star interactive rating
│   └── TheaterMode.jsx         # Full-screen trailer overlay
├── context/
│   ├── AdminContext.jsx        # Auth state
│   └── ThemeContext.jsx        # ColorThief dynamic palette
├── pages/
│   ├── AdminLogin.jsx
│   ├── GameDetail.jsx          # Full game page
│   ├── Home.jsx                # Split cinema/games grid
│   └── MovieDetail.jsx         # Film & TV detail page
└── utils/
    ├── rawg.js                 # RAWG API wrapper
    ├── storage.js              # Supabase + localStorage
    └── tmdb.js                 # TMDB API wrapper
```

---

## 📝 License

MIT - personal use, fork freely.

---

*Built with React + Vite. Data from [The Movie Database (TMDB)](https://www.themoviedb.org). This product uses the TMDB API but is not endorsed or certified by TMDB.*
