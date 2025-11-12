import React, { useEffect, useRef, useState } from "react";

/*
  App.jsx — static-site friendly blog loader
  - Put .txt blog files in public/blogs/
  - Put images in public/images/
  - Update blogFiles below with filenames you add (e.g. "into-the-ridge.txt")
*/

/* === CONFIG: list your blog files here (filenames inside public/blogs/) === */
const blogFiles = [
  "standbyme.txt",
  "the-boomerang-called-past.txt",
  "letter.txt",
  "western.txt"
  // add new filenames here as you create them
];

/* === Optional movie data (static) === */
const movies = [
  { id: 1, title: "Stand by Me", year: 1986, note: "Friendship and memory.", image: "/images/byme.jpg"},
  { id: 2, title: "The Good, the Bad and the Ugly", year: 1966, note: "Classic western rhythm.", image: "/images/thegood.jpg" },
  {id: 3, title: "Aparan", year: 1988, note: "A padmarajan padam.", image: "/images/aparan.jpg" },
  {id: 4, title: "Taxi Driver", year: 1976, note: "Isolation & Rage", image: "/images/taxi.jpg" },
  {id:5,  title: "Into the Wild", year: 2007, note: "Freedom & Solitude", image: "/images/into.jpg" },
  {id:6, title: "Cape Fear", year: 1991, note: "Revenge & Fear", image: "/images/cape.jpg" },
  {id:7, title: "The Breakfast Club", year: 1985, note: "Identity & Connection", image: "/images/break.jpg" },
  {id: 8, title: "Heat", year: 1995, note: "She has a Great ASSSS....", image: "/images/heat.jpg" },
  {id: 9, title: "Dead Poet Society", year: 1989, note: "Inspiration & Rebellion", image: "/images/dead.jpg" },
  {id: 10, title: "Back to the Future Triology", year: 1985-1990, note: "Adventure & Time", image: "/images/bttf.jpg" },
  {id: 11, title: "The Goat Life", year: 2024, note: "Survival & Faith", image: "/images/goat.jpg" },
  {id: 12, title: "The Godfather II", year: 1974, note: "Legacy & Corruption", image: "/images/god2.jpg" },
  {id: 13, title: "Hud", year: 1963, note: "Moral Decay & Loneliness", image: "/images/hud.jpg" },
  {id: 14, title: "The Hateful Eight", year: 2015, note: "Deception & Survival", image: "/images/8.jpg" },
   {id: 15, title: "Rambo: First Blood", year: 1982, note: "Isolation & Survival", image: "/images/first.jpeg" },
]

/* === tiny helper: robust image loader to avoid stray alt text showing === */
function ImageWithProbe({ src, alt, className, style }) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    if (!src) { setOk(false); return; }
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setOk(true); };
    img.onerror = () => { if (!cancelled) setOk(false); };
    img.src = src;
    return () => { cancelled = true; };
  }, [src]);
  if (ok === null) return <div className={`${className}`} style={style} aria-hidden />;
  if (!ok) return (
    <div className={`${className} bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center`} style={style}>
      <div className="text-gray-500 text-sm">No image</div>
    </div>
  );
  return <img src={src} alt={alt || ""} className={className} style={style} />;
}

/* === parser for blog .txt files using the simple format described earlier === */
async function parseBlogFile(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  const text = await res.text();
  // split lines, but preserve paragraphs by splitting on blank lines later
  const lines = text.replace(/\r/g, "").split("\n");
  // first non-empty lines are title, date, image, tags — then blank line then body
  // find first non-empty index
  const nonEmpty = lines.map(l => l.trim());
  let idx = 0;
  while (idx < nonEmpty.length && nonEmpty[idx] === "") idx++;
  const title = nonEmpty[idx] || "Untitled";
  idx++;
  const date = nonEmpty[idx] || (new Date()).toISOString().slice(0,10);
  idx++;
  const image = nonEmpty[idx] || "";
  idx++;
  const tagsLine = nonEmpty[idx] || "";
  idx++;
  // remaining lines after the first blank line form the body. Find the first blank after header.
  // Reconstruct original text to preserve paragraph breaks after the 5th line.
  const rawAfterHeader = lines.slice(idx).join("\n").trim();
  const body = rawAfterHeader;
  const tags = tagsLine ? tagsLine.split(",").map(t => t.trim()).filter(Boolean) : [];
  return { title, date, image, tags, body };
}

/* === main component === */
export default function App() {
  const [page, setPage] = useState("home"); // "home" = blogs list
  const [posts, setPosts] = useState([]);   // loaded posts
  const [currentPost, setCurrentPost] = useState(null);
  const [likes, setLikes] = useState(() => JSON.parse(localStorage.getItem("likes") || "{}"));
  const [query, setQuery] = useState("");
  const contentRef = useRef();
  const progressRef = useRef();


  /* load blog files (runs once) */
  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      const loaded = [];
      for (let i = 0; i < blogFiles.length; i++) {
        const name = blogFiles[i];
        try {
          const meta = await parseBlogFile(`/blogs/${name}`);
          loaded.push({ id: `b${i+1}`, ...meta, filename: name });
        } catch (err) {
          console.warn("Could not load blog", name, err);
        }
      }
      // sort by date desc
      loaded.sort((a,b) => new Date(b.date) - new Date(a.date));
      if (mounted) setPosts(loaded);
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  /* reading progress for post page */
  useEffect(() => {
    const onScroll = () => {
      if (!contentRef.current || page !== "post") return;
      const el = contentRef.current;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY - (el.offsetTop - 80);
      const pct = Math.max(0, Math.min(1, total <= 0 ? 1 : scrolled / total));
      if (progressRef.current) progressRef.current.style.width = `${Math.round(pct * 100)}%`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [page, currentPost]);

  function openPost(p) {
    setCurrentPost(p);
    setPage("post");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goHome() {
    setPage("home");
    setCurrentPost(null);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function incLike(id, e) {
    if (e) e.stopPropagation();
    setLikes(prev => {
      const updated = { ...prev, [id]: (prev[id] || 0) + 1 };
      localStorage.setItem("likes", JSON.stringify(updated));
      return updated;
    });
  }

  /* filtering */
  const filteredPosts = posts.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.title.toLowerCase().includes(q) ||
           p.body.toLowerCase().includes(q) ||
           (p.tags || []).some(t => t.toLowerCase().includes(q));
  });

  /* featured = first post if exists */
  const featured = posts.length ? posts[0] : null;

  /* small helper for reading time */
  const readingTime = (text) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

  return (
    <div className="min-h-screen bg-night text-gray-100 antialiased">
      {/* Reading progress bar */}
      <div aria-hidden className="fixed top-0 left-0 right-0 h-1 z-50">
        <div ref={progressRef} className="h-1 bg-accent transition-all" style={{ width: 0 }} />
      </div>
  
      {/* Header */}
      <header className="sticky top-0 z-40 bg-smoke/88 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={goHome}>
            <div className="font-serif text-2xl">The Silent Frame</div>
            <div className="hidden sm:block text-xs text-gray-400">Cinematic Journal</div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button onClick={goHome} className={`nav-btn ${page==="home"?"active":""}`}>Blogs</button>
            <button onClick={()=>{ setPage("movies"); setCurrentPost(null); setQuery(""); }} className={`nav-btn ${page==="movies"?"active":""}`}>Movies</button>
            <button onClick={()=>{ setPage("about"); setCurrentPost(null); setQuery(""); }} className={`nav-btn ${page==="about"?"active":""}`}>About</button>
          </nav>

          <div className="hidden sm:block">
            {page === "home" ? (
              <div className="relative">
                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search memories..." className="pl-11 pr-4 py-2 w-64 rounded-full bg-night border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-accent"/>
              </div>
            ) : <div style={{width: 256}} />}
          </div>
        </div>

        {/* mobile nav */}
        <div className="md:hidden border-t border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-around">
            <button onClick={goHome} className={`text-sm ${page==="home"?"text-accent":"text-gray-300"}`}>Blogs</button>
            <button onClick={()=>{ setPage("movies"); setQuery(""); }} className={`text-sm ${page==="movies"?"text-accent":"text-gray-300"}`}>Movies</button>
            <button onClick={()=>{ setPage("about"); setQuery(""); }} className={`text-sm ${page==="about"?"text-accent":"text-gray-300"}`}>About</button>
          </div>
          {page==="home" && <div className="px-4 pb-3"><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search memories..." className="w-full pl-10 pr-4 py-2 rounded-full bg-night border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-accent" /></div>}
        </div>
      </header>

      {/* HOME HERO */}
      {page === "home" && featured && (
        <section className="relative cursor-pointer" onClick={() => openPost(featured)}>
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="rounded-lg overflow-hidden shadow-xl">
                <ImageWithProbe src={featured.image} alt={featured.title} className="w-full h-80 object-cover"/>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-2">Featured</div>
                <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-4">{featured.title}</h2>
                <p className="text-gray-300 max-w-xl mb-4">{featured.body.split("\n\n")[0]}</p>
                <div className="flex gap-2 flex-wrap items-center">
                  {(featured.tags||[]).map(t => <span key={t} className="text-xs bg-gray-800 px-2 py-1 rounded-full">#{t}</span>)}
                  <button onClick={(e)=>{ e.stopPropagation(); incLike(featured.id); }} className="ml-4 bg-accent/95 px-3 py-2 rounded-full text-night font-semibold">❤️ {likes[featured.id]||0}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-night/95 pointer-events-none" />
        </section>
      )}

      {/* MAIN: GRID / POST / MOVIES / ABOUT */}
      <main ref={contentRef} className="max-w-6xl mx-auto px-6 py-12">
        {/* Grid */}
        {page === "home" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.slice(1).map(p => (
              <article key={p.id} onClick={()=>openPost(p)} className="group bg-smoke rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition cursor-pointer">
                <div className="h-56">
                  <ImageWithProbe src={p.image} alt={p.title} className="w-full h-full object-cover"/>
                </div>
                <div className="p-5">
                  <div className="text-xs text-gray-400 mb-1">{p.date}</div>
                  <h3 className="font-serif text-xl mb-2">{p.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-4">{p.body}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {(p.tags||[]).map(t => <span key={t} className="text-xs bg-gray-800 px-2 py-1 rounded-full">#{t}</span>)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-gray-500">{p.date}</div>
                      <button onClick={(e)=>incLike(p.id, e)} className="text-accent text-sm">❤️ {likes[p.id]||0}</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Post reading page */}
        {page === "post" && currentPost && (
          <article className="max-w-3xl mx-auto bg-smoke rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <button onClick={goHome} className="text-sm text-gray-400 hover:text-accent">← Back</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-400">{currentPost.date}</div>
                  <div className="text-sm text-gray-300">{readingTime(currentPost.body)} min</div>
                  <button onClick={()=>incLike(currentPost.id)} className="bg-accent/95 px-3 py-2 rounded-full text-night font-semibold">❤️ {likes[currentPost.id]||0}</button>
                </div>
              </div>

              <div className="rounded-lg overflow-hidden mb-6 shadow-lg">
                <ImageWithProbe src={currentPost.image} alt={currentPost.title} className="w-full h-96 object-cover"/>
              </div>

              <h1 className="font-serif text-4xl leading-tight mb-4">{currentPost.title}</h1>

              <div className="prose prose-invert max-w-none text-gray-200">
                {/* render split paragraphs so that plain text paragraphs in .txt are preserved */}
                {currentPost.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {(currentPost.tags||[]).map(t => <span key={t} className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-300">#{t}</span>)}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-400">Reading time: {readingTime(currentPost.body)} min</div>
                <div className="flex gap-3">
                  <button onClick={()=>{ navigator.clipboard?.writeText(window.location.href); alert("Link copied"); }} className="text-sm text-gray-300 hover:text-accent">Copy link</button>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Movies */}
{page === "movies" && (
  <div>
    <h2 className="font-serif text-3xl mb-8 text-center flex items-center justify-center gap-2">
      🎬 <span>Movie Picks</span>
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-10 justify-center">
      {movies.map(m => (
        <div
          key={m.id}
          className="group bg-smoke rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1"
        >
          <div className="aspect-[2/3] sm:aspect-[2/3] bg-gray-900 overflow-hidden flex items-center justify-center">
            <ImageWithProbe
              src={m.image}
              alt={m.title}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-3 sm:p-5">
            <h3 className="font-serif text-base sm:text-xl mb-1">{m.title}</h3>
            <div className="text-[10px] sm:text-xs text-gray-400 mb-1">{m.year}</div>
            <p className="text-xs sm:text-sm text-gray-300 leading-snug sm:leading-relaxed line-clamp-3">
              {m.note}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


{page === "about" && (
  <section className="profile-hero max-w-6xl mx-auto px-6 py-16">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/80 to-gray-800/95 shadow-2xl">
      {/* fingerprint vignette + subtle grain */}
      <div className="absolute inset-0 pointer-events-none profile-vignette" />

      <div className="grid lg:grid-cols-2 gap-8 items-center p-8 md:p-12">
        {/* Left: Portrait + filmstrip */}
        <div className="flex flex-col items-center gap-6">
          <div className="portrait-ring relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-xl">
            {/* Put your portrait in public/images/about-portrait.jpg */}
            <img src="/images/profile.jpeg" alt="V portrait" className="w-full h-full object-cover" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-sky-400 px-3 py-1 rounded-full text-sm font-semibold text-night shadow-md">The Silent Frame</div>
          </div>

          <div className="w-full max-w-xs filmstrip p-2 rounded-xl bg-black/40">
            <div className="strip overflow-hidden rounded-md">
              {/* decorative mini thumbnails — duplicate for effect; purely visual */}
              <div className="strip-track">
                <div className="thumb" style={{backgroundImage: "url('/images/martin.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/Akria.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/kamal.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/chris.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/clint.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/stephen.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/taren.jpeg')"}} />
                <div className="thumb" style={{backgroundImage: "url('/images/satya.jpeg')"}} />
              </div>
            </div>
          </div>

          {/* rotating micro-bios */}
          <div className="w-full text-center text-sm text-gray-300">
            <div className="rotator">
              <div>Writer • Civil Engineer-in-training • Filmmaker-by-ambition</div>
              <div>Documentarian of quiet moments • Coffee-powered</div>
              <div>Building things that feel like short films</div>
            </div>
          </div>
        </div>

        <div className="p-2 sm:p-6">
          <div className="bg-smoke/80 rounded-2xl p-6 md:p-8 shadow-inner relative overflow-hidden">
            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Profile</h3>
            <h2 className="font-serif text-3xl sm:text-4xl mb-3">V — storyteller & builder</h2>

            <p className="text-gray-300 leading-relaxed mb-4">
              I stitch memory and cinema together — a civil engineering student by day, a quiet filmmaker by night. 
              My work focuses on atmosphere: small scenes that feel like a lasting frame. This space is a curated journal of those frames.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div className="stat-card p-3 rounded-lg bg-black/20">
                <div className="text-xs text-gray-400">Experience</div>
                <div className="text-lg font-semibold">Building + Writing</div>
                <div className="text-xs text-gray-400 mt-1">Local projects, documentary shorts</div>
              </div>
              <div className="stat-card p-3 rounded-lg bg-black/20">
                <div className="text-xs text-gray-400">Current</div>
                <div className="text-lg font-semibold">Civil Eng. — Bishop Jerome</div>
                <div className="text-xs text-gray-400 mt-1">Design, field work, creative writing</div>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs text-gray-400 mb-2">Director’s Statement</div>
              <blockquote className="pl-4 border-l-2 border-accent text-gray-200 italic">
                “I look for quiet frames — a coffee cup, a railway, a light through a blinds — and build a scene around them.”
              </blockquote>
            </div>

            {/* Unique badges and micro-interactions */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="badge">Analog Mood</span>
              <span className="badge">Night Shoots</span>
              <span className="badge">Library Stories</span>
              <span className="badge">Documentary</span>
            </div>

            {/* CTA: Letterboxd follow */}
            <div className="flex items-center gap-3">
              <a
                href={"https://boxd.it/7EUAt"} 
                target="_blank"
                rel="noreferrer"
                className="follow-btn inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-sky-400 text-night font-semibold shadow hover:scale-[1.02] transition"
                aria-label="Follow V on Letterboxd"
              >
                {/* Letterboxd-like glyph (stylized film 'L' icon) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M7 8h3v8H7z" fill="currentColor" />
                </svg>
                Follow on Letterboxd
              </a>

              <button
                onClick={() => { navigator.clipboard?.writeText("https://boxd.it/7EUAt"); alert("Profile link copied"); }}
                className="px-3 py-2 rounded-md border border-gray-700 text-sm hover:border-accent transition"
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Tiny unique footer badge */}
          <div className="mt-5 text-xs text-gray-500 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="opacity-70"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="0.7"/></svg>
            <span>Unique profile — curated frames. Last updated: {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
)}
      </main>

      <footer className="py-8 text-center text-xs text-gray-500 border-t border-gray-800">
        © {new Date().getFullYear()} The Silent Frame — created by V
      </footer>
    </div>
  );
}

