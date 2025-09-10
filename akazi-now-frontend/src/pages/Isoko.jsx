import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

/* -----------------------------------
   Categories (used for filter links)
----------------------------------- */
const CATEGORIES = [
  { slug: "electronics", label: "Electronics" },
  { slug: "houses",      label: "Houses" },
  { slug: "cars",        label: "Cars" },
  { slug: "clothes",     label: "Clothes" },
];

const CATEGORY_STYLES = {
  electronics: { bg: "#e0f7ff" }, // soft blue
  houses:      { bg: "#fff8d4" }, // soft yellow
  plots:       { bg: "#e8ffe8" }, // soft green
  cars:        { bg: "#f0e8ff" }, // soft purple
  kitchen:     { bg: "#ffe9f0" }, // soft pink
  clothes:     { bg: "#f6f6f6" }, // soft gray
  default:     { bg: "#ffffff" },
};

/* Isoko-only links for the green nav */
const ISOKO_LINKS = [
  { to: "/",                     label: "Home",       key: "home" },
  { to: "/isoko",                label: "View All",   key: "all"  },
  { to: "/isoko/categories/electronics", label: "Electronics", key: "electronics" },
  { to: "/isoko/categories/houses",      label: "Houses",      key: "houses" },
  { to: "/isoko/categories/cars",        label: "Cars",        key: "cars" },
  { to: "/isoko/categories/clothes",     label: "Clothes",     key: "clothes" },
  { to: "/isoko/post-item",      label: "Post Item",  key: "post" },
];

function Isoko() {
  const [listings, setListings] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Mobile overlay state
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Extract category slug from route if present (e.g. /isoko/categories/:slug)
  const activeSlug = useMemo(() => {
    const m = location.pathname.match(/\/isoko\/categories\/([^/]+)/i);
    return m ? m[1].toLowerCase() : null;
  }, [location.pathname]);

  // Title text
  const sectionTitle = useMemo(() => {
    if (!activeSlug) return "Isoko — Buy & Sell Locally";
    const label = CATEGORIES.find(c => c.slug === activeSlug)?.label || activeSlug;
    return `Isoko — ${label}`;
  }, [activeSlug]);

  /* -------------------
     Data & Auth
  ------------------- */
  useEffect(() => {
    const bootstrap = async () => {
      // Load items (ALWAYS all; filtering happens client-side)
      const { data, error } = await supabase
        .from("market_listings")
        .select(`
          id, title, description, price, currency, intent,
          category, location, first_image_url, created_at
        `)
        .order("created_at", { ascending: false });
      if (!error) setListings(data || []);

      // Auth + profile
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user || null);
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("image_url")
          .eq("auth_user_id", user.id)
          .single();
        setUserProfile(profile || null);
      }
    };

    bootstrap();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_evt, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("image_url")
            .eq("auth_user_id", user.id)
            .single();
          setUserProfile(profile || null);
        } else {
          setUserProfile(null);
        }
      });

    return () => subscription?.unsubscribe();
  }, []);

  /* -------------------
     Derived: displayed list
     (All by default; filter only if /categories/:slug)
  ------------------- */
  const displayed = useMemo(() => {
    if (!activeSlug) return listings;
    return listings.filter(
      (it) => (it.category || "").toLowerCase() === activeSlug
    );
  }, [listings, activeSlug]);

  /* -------------------
     Mobile overlay UX
  ------------------- */
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove  = (e) => {
      if (!mobileNavVisible) return;
      const swipe = touchStartY - e.touches[0].clientY;
      if (swipe > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => { setMobileNavVisible(false); setSlideDirection(""); }, 300);
      }
    };
    const handleScroll = () => {
      if (!mobileNavVisible) return;
      setSlideDirection("slide-up");
      setTimeout(() => { setMobileNavVisible(false); setSlideDirection(""); }, 300);
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mobileNavVisible]);

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileNavVisible(false);
    navigate("/");
  };

  const bgFor = (cat) =>
    CATEGORY_STYLES[cat?.toLowerCase?.()]?.bg || CATEGORY_STYLES.default.bg;

  return (
    <div className="gigs-container">
      {/* MOBILE TOPBAR */}
      <div className="gigs-mobile-topbar">
        <div className="gigs-mobile-left">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="gigs-mobile-avatar"
          />
          <FaBars className="gigs-mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="gigs-mobile-title">Isoko</h2>
        <NotificationBell />
      </div>

      {/* MOBILE OVERLAY NAV (Isoko-focused) */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            {ISOKO_LINKS.map((item) => (
              <li
                key={item.key}
                onClick={() => {
                  setMobileNavVisible(false);
                  navigate(item.to);
                }}
              >
                {item.label}
              </li>
            ))}
            {authUser ? (
              <li onClick={handleLogout}>Logout</li>
            ) : (
              <>
                <li onClick={() => { setMobileNavVisible(false); navigate("/login"); }}>Sign In</li>
                <li onClick={() => { setMobileNavVisible(false); navigate("/signup"); }}>Sign Up</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* DESKTOP NAV */}
      <div className="gigs-desktop-nav">
        <div className="gigs-desktop-nav-inner">
          <div className="gigs-nav-left-logo" onClick={() => navigate("/")} title="AkaziNow Home">
            AkaziNow
          </div>

          <nav className="gigs-nav-center">
            <ul>
              {ISOKO_LINKS.map((item) => (
                <li key={item.key} onClick={() => navigate(item.to)}>
                  {item.label}
                </li>
              ))}
            </ul>
          </nav>

          <div className="gigs-nav-right">
            {authUser ? (
              <>
                <img
                  src={userProfile?.image_url || defaultAvatar}
                  alt="me"
                  className="gigs-nav-avatar"
                  onClick={() => navigate("/profile")}
                  title="Profile"
                />
                <button
                  className="gigs-auth-button"
                  onClick={() => navigate("/isoko/post-item")}
                  title="Post Item"
                >
                  Post Item
                </button>
                <button
                  className="gigs-auth-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="gigs-auth-buttons gigs-auth-buttons--desktop">
                <button className="gigs-auth-button" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="gigs-auth-button" onClick={() => navigate("/signup")}>
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="gigs-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="gigs-topbar">
          <div className="gigs-logo">AkaziNow</div>
          {!authUser && (
            <div className="gigs-auth-buttons">
              <button onClick={() => navigate("/login")}>Sign In</button>
              <button onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          )}
        </div>

        <div className="gigs-hero-content">
          <h1 className="gigs-heading">{sectionTitle}</h1>
          <p className="gigs-subheading">
            {activeSlug
              ? `Browse ${sectionTitle.split("—")[1].trim()} listings in your area.`
              : "Post what you want to sell or find what you need."}
          </p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {displayed.length} Items
          </div>
        </div>
      </div>

      {/* CATEGORY CHIPS (filters only when clicked) */}
      <div style={{ width: "100%", maxWidth: 1200, padding: "3.5rem 1rem 0.5rem" }}>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => navigate("/isoko")}
            className={`isoko-chip ${!activeSlug ? "isoko-chip--active" : ""}`}
          >
            View All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/isoko/categories/${c.slug}`)}
              className={`isoko-chip ${activeSlug === c.slug ? "isoko-chip--active" : ""}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTINGS */}
      <section className="gigs-cards-section">
        {displayed.length > 0 ? (
          displayed.map((item) => {
            const imgUrl = item.first_image_url;
            const isHeic = imgUrl?.toLowerCase().endsWith(".heic");
            const displayUrl = isHeic ? null : imgUrl;
            const bg = bgFor(item.category);

            return (
              <div className="isoko-card isoko-card--row" key={item.id} style={{ background: bg }}>
                <div className="isoko-card-text">
                  <div className="isoko-card-header">
                    <img
                      src={userProfile?.image_url || defaultAvatar}
                      alt="poster"
                      className="isoko-avatar"
                    />
                    <span
                      className={`isoko-intent ${
                        item.intent?.toLowerCase() === "buy" ? "buy" : "sell"
                      }`}
                    >
                      {item.intent?.toUpperCase() === "BUY" ? "Buyer" : "Seller"}
                    </span>
                  </div>

                  <h2 className="isoko-title">{item.title}</h2>
                  <p className="isoko-desc">{item.description}</p>

                  <div className="isoko-meta">
                    <span className="isoko-price">
                      {Number(item.price || 0).toLocaleString()} {item.currency || "RWF"}
                    </span>
                    <span className="isoko-dot">•</span>
                    <span className="isoko-loc">{item.location || "—"}</span>
                    <span className="isoko-dot">•</span>
                    <span className="isoko-cat">{item.category || "—"}</span>
                  </div>

                  <div className="isoko-actions">
                    <button onClick={() => navigate("/isoko/post-item")}>Post Item</button>
                  </div>
                </div>

                {displayUrl && (
                  <div className="isoko-card-image">
                    <img
                      src={displayUrl}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p style={{ marginTop: "2rem", fontWeight: "bold" }}>
            No items yet. Be the first to{" "}
            <span
              style={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={() => navigate("/isoko/post-item")}
            >
              post one
            </span>
            .
          </p>
        )}
      </section>

      {/* FOOTER */}
      <footer className="gigs-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="gigs-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default Isoko;
