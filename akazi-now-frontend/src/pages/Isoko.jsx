import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

/** Center/mobile links (Home + Isoko categories + Logout (auth only)) */
const ISOKO_LINKS = [
  { to: "/",                             label: "Home",        key: "home" },
  { to: "/isoko/categories/electronics", label: "Electronics", key: "electronics" },
  { to: "/isoko/categories/houses",      label: "Houses",      key: "houses" },
  { to: "/isoko/categories/cars",        label: "Cars",        key: "cars" },
  { to: "/isoko/categories/clothes",     label: "Clothes",     key: "clothes" },
  { label: "Logout", key: "logout", action: "logout", private: true },
];

function Isoko() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  // --- Mobile toggle/overlay (IDENTICAL behavior to Gigs) ---
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.key === "logout") return false;
    if (item.key === "home") return location.pathname === "/isoko" || location.pathname === "/";
    return item.to ? location.pathname.startsWith(item.to) : false;
  };

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

    // keep auth state in sync (same as Gigs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evt, session) => {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setAuthUser(user || null);
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  // --- MOBILE OVERLAY UX (exactly like Gigs) ---
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };

    const handleTouchMove = (e) => {
      if (!mobileNavVisible) return;
      const touchEndY = e.touches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      if (swipeDistance > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavVisible(false);
          setSlideDirection("");
        }, 300);
      }
    };

    const handleScroll = () => {
      if (!mobileNavVisible) return;
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavVisible(false);
        setSlideDirection("");
      }, 300);
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

  return (
    <div className="gigs-container">
      {/* MOBILE TOPBAR (green, fixed at top on mobile like Gigs) */}
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

      {/* MOBILE OVERLAY NAV (same structure/animation as Gigs) */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            {ISOKO_LINKS
              .filter((i) => !i.private || authUser)
              .map((item) => (
                <li
                  key={item.key}
                  onClick={() => {
                    if (item.action === "logout") { handleLogout(); return; }
                    setMobileNavVisible(false);
                    navigate(item.to);
                  }}
                >
                  {item.label}
                </li>
              ))}
            {/* CTA in overlay (optional but matches your pattern) */}
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>
              Post Item
            </li>
            {!authUser && (
              <>
                <li onClick={() => { setMobileNavVisible(false); navigate("/login"); }}>Sign In</li>
                <li onClick={() => { setMobileNavVisible(false); navigate("/signup"); }}>Sign Up</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* DESKTOP NAV (green gradient, same as Gigs) */}
      <div className="gigs-desktop-nav">
        <div className="gigs-desktop-nav-inner">
          <div
            className="gigs-nav-left-logo"
            onClick={() => navigate("/")}
            title="AkaziNow Home"
          >
            AkaziNow
          </div>

          <nav className="gigs-nav-center">
            <ul>
              {ISOKO_LINKS
                .filter((i) => !i.private || authUser)
                .map((item) => (
                  <li
                    key={item.key}
                    className={isActive(item) ? "active" : ""}
                    onClick={() =>
                      item.action === "logout" ? handleLogout() : navigate(item.to)
                    }
                  >
                    {item.label}
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
            {authUser ? (
              <img
                src={userProfile?.image_url || defaultAvatar}
                alt="me"
                className="gigs-mobile-avatar"
                style={{ width: 34, height: 34, cursor: "pointer" }}
                onClick={() => navigate("/profile")}
                title="Profile"
              />
            ) : (
              <>
                <button className="gigs-auth-button" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="gigs-auth-button" onClick={() => navigate("/signup")}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO (hero topbar hidden on desktop in CSS to avoid white strip) */}
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

      {/* CONTENT (render your Isoko listing cards here) */}
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

      {/* FOOTER (green gradient like Gigs) */}
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
