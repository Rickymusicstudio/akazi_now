import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

const CATEGORIES = [
  { slug: "electronics", label: "Electronics" },
  { slug: "houses",      label: "Houses" },
  { slug: "plots",       label: "Plots" },
  { slug: "cars",        label: "Cars" },
  { slug: "kitchen",     label: "Kitchen" },
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

function Isoko() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const sectionTitle = (() => {
    const m = location.pathname.match(/\/isoko\/categories\/([^/]+)/i);
    if (!m) return "Isoko — Buy & Sell Locally";
    const slug = m[1];
    const label = CATEGORIES.find(c => c.slug === slug)?.label || slug;
    return `Isoko — ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  })();

  useEffect(() => {
    fetchListings();
    fetchUserAndProfile();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_evt, session) => {
        const user = session?.user || null;
        setAuthUser(user);
        if (user) {
          const { data } = await supabase
            .from("users")
            .select("image_url")
            .eq("auth_user_id", user.id)
            .single();
          setUserProfile(data || null);
        } else {
          setUserProfile(null);
        }
      });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("market_listings")
      .select(`
        id, title, description, price, currency, intent,
        category, location, first_image_url, created_at
      `)
      .order("created_at", { ascending: false });

    if (!error) setListings(data || []);
  };

  const fetchUserAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setAuthUser(user || null);
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  // mobile overlay behavior
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
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

  const bgFor = (cat) => CATEGORY_STYLES[cat?.toLowerCase?.()]?.bg || CATEGORY_STYLES.default.bg;

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

      {/* MOBILE OVERLAY NAV (no category sublinks) */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => { setMobileNavVisible(false); navigate("/"); }}>Home</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/gigs"); }}>Gigs</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/post-job"); }}>Post a Job</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/my-jobs"); }}>My Jobs</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/profile"); }}>Profile</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/inbox"); }}>Inbox</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/carpools"); }}>Car Pooling</li>

            {/* Isoko main links only */}
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko"); }}>Isoko</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>Post Item</li>

            {authUser ? (
              <li
                onClick={async () => {
                  await supabase.auth.signOut();
                  setMobileNavVisible(false);
                  navigate("/");
                }}
              >
                Logout
              </li>
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
              <li onClick={() => navigate("/")}>Home</li>
              <li onClick={() => navigate("/gigs")}>Gigs</li>
              <li onClick={() => navigate("/post-job")}>Post a Job</li>
              <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
              <li onClick={() => navigate("/profile")}>Profile</li>
              <li onClick={() => navigate("/inbox")}>Inbox</li>
              <li onClick={() => navigate("/carpools")}>Car Pooling</li>

              {/* Isoko */}
              <li onClick={() => navigate("/isoko")}>Isoko</li>
              <li onClick={() => navigate("/isoko/post-item")}>Post Item</li>
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
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate("/");
                  }}
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
            {sectionTitle.includes("—")
              ? `Browse ${sectionTitle.split("—")[1].trim()} listings in your area.`
              : "Post what you want to sell or find what you need."}
          </p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {listings.length} Items
          </div>
        </div>
      </div>

      {/* CATEGORY CHIPS (kept here; no longer in mobile nav) */}
      <div style={{ width: "100%", maxWidth: 1200, padding: "3.5rem 1rem 0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/isoko/categories/${c.slug}`)}
              className="isoko-chip"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTING CARDS (Index-style) */}
      <section className="gigs-cards-section">
        {listings.length > 0 ? (
          listings.map((item) => {
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
                    <span className={`isoko-intent ${item.intent?.toLowerCase() === "buy" ? "buy" : "sell"}`}>
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
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
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
            </span>.
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
