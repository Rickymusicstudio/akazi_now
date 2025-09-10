import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

const ISOKO_LINKS = [
  { to: "/isoko/categories/electronics", label: "Electronics", key: "electronics" },
  { to: "/isoko/categories/houses",      label: "Houses",      key: "houses" },
  { to: "/isoko/categories/cars",        label: "Cars",        key: "cars" },
];

function Isoko() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const activeCat = location.pathname.match(/\/isoko\/categories\/([^/]+)/i)?.[1] ?? null;

  const sectionTitle = (() => {
    const m = location.pathname.match(/\/isoko\/categories\/([^/]+)/i);
    if (!m) return "Isoko — Buy & Sell Locally";
    const slug = m[1];
    const label = ISOKO_LINKS.find((l) => l.key === slug)?.label || slug;
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

  // Mobile overlay UX (swipe up or scroll closes)
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

  return (
    <div className="gigs-container">
      {/* MOBILE TOPBAR (green like Gigs) */}
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

      {/* MOBILE OVERLAY NAV — Isoko links only */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            {ISOKO_LINKS.map((l) => (
              <li key={l.to}
                  onClick={() => { setMobileNavVisible(false); navigate(l.to); }}>
                {l.label}
              </li>
            ))}
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>
              Post Item
            </li>
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

      {/* DESKTOP NAV — same style as Gigs, Isoko links only */}
      <div className="gigs-desktop-nav">
        <div className="gigs-desktop-nav-inner">
          <div className="gigs-nav-left-logo" onClick={() => navigate("/")} title="AkaziNow Home">
            AkaziNow
          </div>

          <nav className="gigs-nav-center">
            <ul>
              {ISOKO_LINKS.map((l) => (
                <li
                  key={l.to}
                  className={activeCat && l.key === activeCat ? "active" : ""}
                  onClick={() => navigate(l.to)}
                >
                  {l.label}
                </li>
              ))}
            </ul>
          </nav>

          <div className="gigs-nav-right">
            <button
              className="gigs-auth-button gigs-auth-button--gold"
              onClick={() => navigate("/isoko/post-item")}
              title="Post Item"
            >
              Post Item
            </button>
          </div>
        </div>
      </div>

      {/* HERO (keep exactly like Gigs) */}
      <div className="gigs-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        {/* Hide on desktop via CSS to avoid the white strip */}
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

      {/* CONTENT — you can keep your cards here; placeholder left for now */}
      <section className="gigs-cards-section">
        {listings.length > 0 ? (
          <p style={{ fontWeight: 600 }}>Render your Isoko listing cards here…</p>
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

      {/* FOOTER — identical to Gigs */}
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
