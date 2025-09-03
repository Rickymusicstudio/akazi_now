import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
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

function IsokoCategory() {
  const { name } = useParams(); // category slug from route
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  const currentCategory = CATEGORIES.find(c => c.slug === (name || "").toLowerCase());

  useEffect(() => {
    fetchListings();
    fetchUserAndProfile();

    // Keep auth state in sync across pages
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const fetchListings = async () => {
    // Case-insensitive exact match on category slug/label
    const categoryFilter = (name || "").toLowerCase();
    const { data, error } = await supabase
      .from("market_listings")
      .select(`
        id, title, description, price, currency, intent,
        category, location, first_image_url, created_at
      `)
      .order("created_at", { ascending: false });

    if (!error) {
      const filtered = (data || []).filter((it) => {
        const cat = (it.category || "").toLowerCase().trim();
        // match by slug, or by human label (both lowercased)
        return (
          cat === categoryFilter ||
          cat === (currentCategory?.label || "").toLowerCase()
        );
      });
      setListings(filtered);
    }
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

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

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

  const categoryTitle = currentCategory?.label || name;

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
        <h2 className="gigs-mobile-title">{categoryTitle}</h2>
        <NotificationBell />
      </div>

      {/* MOBILE OVERLAY NAV */}
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

            {/* Isoko links */}
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko"); }}>Isoko</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>Post Item</li>
            {CATEGORIES.map(c => (
              <li key={c.slug} onClick={() => { setMobileNavVisible(false); navigate(`/isoko/categories/${c.slug}`); }}>
                {c.label}
              </li>
            ))}

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
          <div
            className="gigs-nav-left-logo"
            onClick={() => navigate("/")}
            title="AkaziNow Home"
          >
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
          <h1 className="gigs-heading">Isoko — {categoryTitle}</h1>
          <p className="gigs-subheading">Browse {categoryTitle} listings in your area.</p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {listings.length} Items
          </div>
        </div>
      </div>

      {/* QUICK CATEGORY CHIPS */}
      <div style={{ width: "100%", maxWidth: 1200, padding: "3.5rem 1rem 0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => navigate(`/isoko/categories/${c.slug}`)}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: 999,
                padding: "8px 14px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* LISTINGS */}
      <section className="gigs-cards-section">
        {listings.length > 0 ? (
          listings.map((item) => {
            const imgUrl = item.first_image_url;
            const isHeic = imgUrl?.toLowerCase().endsWith(".heic");
            const displayUrl = isHeic ? null : imgUrl;

            return (
              <div className="gigs-card" key={item.id} style={{ background: "#fff" }}>
                <div className="gigs-card-text">
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                    <img
                      src={userProfile?.image_url || defaultAvatar}
                      alt="poster"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        marginRight: "10px",
                      }}
                    />
                    <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                      {item.intent?.toUpperCase() === "BUY" ? "Buyer" : "Seller"}
                    </span>
                  </div>

                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <p><strong>Price:</strong> {Number(item.price || 0).toLocaleString()} {item.currency || "RWF"}</p>
                  <p><strong>Location:</strong> {item.location || "—"}</p>
                  <p><strong>Category:</strong> {item.category || "—"}</p>
                  <p><strong>Intent:</strong> {item.intent || "sell"}</p>

                  <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                    <button onClick={() => navigate("/isoko/post-item")}>Post Item</button>
                  </div>
                </div>

                {displayUrl && (
                  <div className="gigs-card-image-wrapper">
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
            No items in {categoryTitle} yet.
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

export default IsokoCategory;
