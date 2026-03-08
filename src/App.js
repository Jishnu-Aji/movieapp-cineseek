import { useState, useEffect, useRef } from "react";

const API_KEY = "52de9661";
const BASE_URL = "https://www.omdbapi.com/";

const fetchMovies = async (query, page = 1) => {
  const res = await fetch(`${BASE_URL}?s=${encodeURIComponent(query)}&page=${page}&apikey=${API_KEY}`);
  const data = await res.json();
  return data;
};

const fetchMovieDetails = async (imdbID) => {
  const res = await fetch(`${BASE_URL}?i=${imdbID}&plot=full&apikey=${API_KEY}`);
  const data = await res.json();
  return data;
};

const GENRES = ["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Thriller", "Romance", "Animation"];
const FEATURED = ["Inception", "Interstellar", "The Dark Knight", "Parasite", "Dune", "Oppenheimer"];

export default function MovieApp() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searched, setSearched] = useState(false);
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    // Load a featured movie for hero display
    const loadFeatured = async () => {
      const results = [];
      for (const title of FEATURED.slice(0, 3)) {
        const data = await fetchMovies(title, 1);
        if (data.Search && data.Search[0]) {
          const detail = await fetchMovieDetails(data.Search[0].imdbID);
          if (detail.Response === "True") results.push(detail);
        }
      }
      setFeaturedMovies(results);
    };
    loadFeatured();
  }, []);

  const search = async (q = query, p = 1) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    setSearched(true);
    setSelected(null);
    try {
      const data = await fetchMovies(q, p);
      if (data.Response === "True") {
        setMovies(data.Search);
        setTotalResults(parseInt(data.totalResults));
        setPage(p);
      } else {
        setMovies([]);
        setError(data.Error || "No results found.");
        setTotalResults(0);
      }
    } catch {
      setError("Failed to fetch. Check your connection.");
    }
    setLoading(false);
  };

  const openDetail = async (imdbID) => {
    setDetailLoading(true);
    setSelected(null);
    const data = await fetchMovieDetails(imdbID);
    if (data.Response === "True") setSelected(data);
    setDetailLoading(false);
  };

  const handleGenre = (genre) => {
    setQuery(genre);
    search(genre, 1);
  };

  const totalPages = Math.ceil(totalResults / 10);

  return (
    <div style={styles.root}>
      <style>{globalStyles}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>▶</span>
          <span style={styles.logoText}>CINESEEK</span>
        </div>
        <div style={styles.searchBar}>
          <input
            ref={inputRef}
            style={styles.input}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Search movies, series, episodes..."
          />
          <button style={styles.searchBtn} onClick={() => search()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>
        </div>
      </header>

      {/* GENRE PILLS */}
      <div style={styles.centeredWrapper}>
      <div style={styles.genreRow}>
        {GENRES.map(g => (
          <button key={g} style={styles.genrePill} onClick={() => handleGenre(g)}
            onMouseEnter={e => e.target.style.background = "#E8B84B"}
            onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.07)"}
          >{g}</button>
        ))}
      </div>

      {/* HERO — shown when not searched */}
      {!searched && featuredMovies.length > 0 && (
        <section style={styles.hero}>
          <div style={styles.heroLabel}>✦ FEATURED</div>
          <div style={styles.heroGrid}>
            {featuredMovies.map((m, i) => (
              <div key={m.imdbID} style={{...styles.heroCard, animationDelay: `${i * 0.15}s`}}
                className="hero-card" onClick={() => openDetail(m.imdbID)}>
                <img src={m.Poster !== "N/A" ? m.Poster : "https://via.placeholder.com/300x445/111/555?text=No+Image"}
                  alt={m.Title} style={styles.heroImg} />
                <div style={styles.heroOverlay}>
                  <div style={styles.heroRating}>★ {m.imdbRating}</div>
                  <div style={styles.heroTitle}>{m.Title}</div>
                  <div style={styles.heroMeta}>{m.Year} · {m.Genre?.split(",")[0]}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RESULTS */}
      <main style={styles.main}>
        {loading && <div style={styles.spinner}><div className="spin" /></div>}
        {error && !loading && <div style={styles.error}>{error}</div>}

        {!loading && movies.length > 0 && (
          <>
            <div style={styles.resultsHeader}>
              <span style={styles.resultsCount}>{totalResults.toLocaleString()} results for "<em>{query}</em>"</span>
            </div>
            <div style={styles.grid}>
              {movies.map((m, i) => (
                <MovieCard key={m.imdbID} movie={m} index={i} onClick={() => openDetail(m.imdbID)} />
              ))}
            </div>
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button style={styles.pageBtn} disabled={page <= 1} onClick={() => search(query, page - 1)}>← Prev</button>
                <span style={styles.pageInfo}>{page} / {totalPages}</span>
                <button style={styles.pageBtn} disabled={page >= totalPages} onClick={() => search(query, page + 1)}>Next →</button>
              </div>
            )}
          </>
        )}
      </main>
      </div>

      {/* DETAIL MODAL */}
      {(selected || detailLoading) && (
        <div style={styles.modalBackdrop} onClick={() => { setSelected(null); }}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            {detailLoading ? (
              <div style={styles.spinner}><div className="spin" /></div>
            ) : selected && (
              <MovieDetail movie={selected} onClose={() => setSelected(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MovieCard({ movie, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{...styles.card, ...(hovered ? styles.cardHover : {})}}
      className="movie-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.posterWrap}>
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x445/111/333?text=No+Poster"}
          alt={movie.Title}
          style={styles.poster}
        />
        <div style={{...styles.cardOverlay, opacity: hovered ? 1 : 0}}>
          <div style={styles.viewBtn}>View Details</div>
        </div>
      </div>
      <div style={styles.cardInfo}>
        <div style={styles.cardType}>{movie.Type?.toUpperCase()}</div>
        <div style={styles.cardTitle}>{movie.Title}</div>
        <div style={styles.cardYear}>{movie.Year}</div>
      </div>
    </div>
  );
}

function MovieDetail({ movie, onClose }) {
  const hasRatings = movie.Ratings && movie.Ratings.length > 0;
  return (
    <div style={styles.detail}>
      <button style={styles.closeBtn} onClick={onClose}>✕</button>
      <div style={styles.detailInner}>
        <div style={styles.detailLeft}>
          <img
            src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x445/111/333?text=No+Image"}
            alt={movie.Title}
            style={styles.detailPoster}
          />
          {hasRatings && (
            <div style={styles.ratings}>
              {movie.Ratings.map(r => (
                <div key={r.Source} style={styles.ratingItem}>
                  <div style={styles.ratingSource}>{r.Source.replace("Internet Movie Database","IMDb").replace("Rotten Tomatoes","RT")}</div>
                  <div style={styles.ratingValue}>{r.Value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={styles.detailRight}>
          <div style={styles.detailType}>{movie.Type?.toUpperCase()} · {movie.Year}</div>
          <h2 style={styles.detailTitle}>{movie.Title}</h2>
          <div style={styles.detailMeta}>
            {movie.Runtime !== "N/A" && <span style={styles.metaBadge}>{movie.Runtime}</span>}
            {movie.Rated !== "N/A" && <span style={styles.metaBadge}>{movie.Rated}</span>}
            {movie.imdbRating !== "N/A" && <span style={{...styles.metaBadge, background:"#E8B84B", color:"#000"}}>★ {movie.imdbRating}</span>}
          </div>
          <div style={styles.detailGenre}>{movie.Genre}</div>
          <p style={styles.detailPlot}>{movie.Plot}</p>
          <div style={styles.detailCredits}>
            {movie.Director !== "N/A" && <div><span style={styles.creditLabel}>Director</span><span style={styles.creditVal}>{movie.Director}</span></div>}
            {movie.Writer !== "N/A" && <div><span style={styles.creditLabel}>Writer</span><span style={styles.creditVal}>{movie.Writer?.split(",").slice(0,2).join(", ")}</span></div>}
            {movie.Actors !== "N/A" && <div><span style={styles.creditLabel}>Cast</span><span style={styles.creditVal}>{movie.Actors}</span></div>}
            {movie.Language !== "N/A" && <div><span style={styles.creditLabel}>Language</span><span style={styles.creditVal}>{movie.Language}</span></div>}
            {movie.Country !== "N/A" && <div><span style={styles.creditLabel}>Country</span><span style={styles.creditVal}>{movie.Country}</span></div>}
            {movie.Awards !== "N/A" && <div><span style={styles.creditLabel}>Awards</span><span style={styles.creditVal}>{movie.Awards}</span></div>}
          </div>
          {movie.imdbID && (
            <a href={`https://www.imdb.com/title/${movie.imdbID}`} target="_blank" rel="noreferrer" style={styles.imdbLink}>
              View on IMDb ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  .spin {
    width: 40px; height: 40px;
    border: 3px solid #222;
    border-top-color: #E8B84B;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hero-card { animation: fadeUp 0.6s ease both; }
  .movie-card { animation: fadeUp 0.4s ease both; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  input::placeholder { color: #555; }
`;

const styles = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: "#0a0a0f",
    minHeight: "100vh",
    color: "#e0e0e0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px 32px",
    borderBottom: "1px solid #1a1a2a",
    background: "rgba(10,10,15,0.95)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
  },
  headerInner: {
    display: "flex",
    alignItems: "center",
    gap: 24,
    width: "100%",
    maxWidth: 1200,
  },
  logo: { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  logoIcon: { color: "#E8B84B", fontSize: 20 },
  logoText: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 4, color: "#fff" },
  searchBar: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: "#13131f",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    overflow: "hidden",
    maxWidth: 600,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e0e0e0",
    fontSize: 15,
    padding: "12px 16px",
    fontFamily: "'DM Sans', sans-serif",
  },
  searchBtn: {
    background: "#E8B84B",
    border: "none",
    color: "#000",
    padding: "12px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  centeredWrapper: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "0 32px",
    width: "100%",
  },
  genreRow: {
    display: "flex",
    gap: 8,
    padding: "14px 0",
    overflowX: "auto",
    borderBottom: "1px solid #1a1a2a",
    flexWrap: "wrap",
  },
  genrePill: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid #2a2a3a",
    color: "#ccc",
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.2s, color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  },
  hero: { padding: "32px 0 0" },
  heroLabel: { fontSize: 11, letterSpacing: 4, color: "#E8B84B", marginBottom: 16, fontWeight: 500 },
  heroGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 860 },
  heroCard: {
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
    cursor: "pointer",
    aspectRatio: "2/3",
  },
  heroImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    background: "linear-gradient(transparent, rgba(0,0,0,0.9))",
    padding: "30px 14px 14px",
  },
  heroRating: { color: "#E8B84B", fontSize: 13, fontWeight: 500, marginBottom: 4 },
  heroTitle: { color: "#fff", fontSize: 16, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 },
  heroMeta: { color: "#888", fontSize: 12 },
  main: { padding: "32px 0" },
  spinner: { display: "flex", justifyContent: "center", padding: 60 },
  error: { textAlign: "center", color: "#888", padding: 60, fontSize: 16 },
  resultsHeader: { marginBottom: 20 },
  resultsCount: { color: "#666", fontSize: 13 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#13131f",
    borderRadius: 8,
    overflow: "hidden",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid #1a1a2a",
  },
  cardHover: {
    transform: "translateY(-4px)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
    border: "1px solid #E8B84B44",
  },
  posterWrap: { position: "relative", aspectRatio: "2/3", overflow: "hidden" },
  poster: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardOverlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity 0.2s",
  },
  viewBtn: {
    background: "#E8B84B",
    color: "#000",
    padding: "8px 16px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  cardInfo: { padding: "10px 12px 12px" },
  cardType: { fontSize: 9, letterSpacing: 2, color: "#E8B84B", marginBottom: 4, fontWeight: 600 },
  cardTitle: { fontSize: 13, fontWeight: 500, color: "#e0e0e0", lineHeight: 1.3, marginBottom: 4 },
  cardYear: { fontSize: 12, color: "#555" },
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 40, paddingTop: 24, borderTop: "1px solid #1a1a2a" },
  pageBtn: {
    background: "#13131f",
    border: "1px solid #2a2a3a",
    color: "#ccc",
    padding: "8px 20px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s",
  },
  pageInfo: { color: "#555", fontSize: 14 },
  modalBackdrop: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.85)",
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "#0f0f1a",
    borderRadius: 12,
    maxWidth: 860,
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    border: "1px solid #2a2a3a",
    position: "relative",
    animation: "fadeUp 0.3s ease",
  },
  detail: { padding: 32 },
  detailInner: { display: "flex", gap: 32, flexWrap: "wrap" },
  detailLeft: { flexShrink: 0, width: 200 },
  detailPoster: { width: "100%", borderRadius: 8, display: "block", marginBottom: 16 },
  ratings: { display: "flex", flexDirection: "column", gap: 8 },
  ratingItem: { background: "#13131f", borderRadius: 6, padding: "8px 12px" },
  ratingSource: { fontSize: 10, color: "#666", letterSpacing: 1, marginBottom: 2 },
  ratingValue: { fontSize: 16, fontWeight: 600, color: "#e0e0e0" },
  detailRight: { flex: 1, minWidth: 200 },
  detailType: { fontSize: 11, letterSpacing: 3, color: "#E8B84B", marginBottom: 8 },
  detailTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, letterSpacing: 2, color: "#fff", lineHeight: 1.1, marginBottom: 12 },
  detailMeta: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  metaBadge: { background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: 4, padding: "3px 10px", fontSize: 12, color: "#ccc" },
  detailGenre: { color: "#666", fontSize: 13, marginBottom: 16, letterSpacing: 0.5 },
  detailPlot: { color: "#aaa", fontSize: 14, lineHeight: 1.7, marginBottom: 24 },
  detailCredits: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 },
  creditLabel: { fontSize: 10, letterSpacing: 2, color: "#555", display: "block", marginBottom: 2 },
  creditVal: { fontSize: 13, color: "#ccc" },
  imdbLink: {
    display: "inline-block",
    background: "#E8B84B",
    color: "#000",
    padding: "9px 20px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  closeBtn: {
    position: "absolute", top: 16, right: 16,
    background: "#1e1e2e",
    border: "1px solid #2a2a3a",
    color: "#ccc",
    width: 32, height: 32,
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: 14,
    zIndex: 10,
  },
};
