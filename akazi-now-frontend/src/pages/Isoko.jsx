import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

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

  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const activeCategory = useMemo(() => {
    const m = location.pathname.match(/\/isoko\/categories\/([^/]+)/i);
    return m ? m[1] : null;
  }, [location.pathname]);

  const isActive = (item) => {
    if (item.key === "logout") return false;
    if (item.key === "home") return location.pathname === "/isoko" || location.pathname === "/";
    return item.to ? location.pathname.startsWith(item.to) : false;
  };

  const sectionTitle = useMemo(() => {
    if (!activeCategory) return "Isoko — Buy & Sell Locally";
    const label = ISOKO_LINKS.find((l) => l.key === activeCategory)?.label || activeCategory;
    return `Isoko — ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  }, [activeCategory]);

  useEffect(() => {
    fetchListings();
    fetchUserAndProfile();

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
    const { data: rawListings, error } = await supabase
      .from("market_listings")
      .select(
        "id, user_id, title, description, price, currency, intent, category, location, first_image_url, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetchListings error:", error.message);
      setListings([]);
      return;
    }
    const list = rawListings || [];

    const userIds = Array.from(new Set(list.map((l) => l.user_id).filter(Boolean)));
    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData, error: usersErr } = await supabase
        .from("users")
        .select("auth_user_id, full_name, image_url")
        .in("auth_user_id", userIds);

      if (!usersErr && usersData) {
        userMap = new Map(usersData.map((u) => [u.auth_user_id, u]));
      }
    }

    setListings(
      list.map((l) => ({
        ...l,
        user: userMap.get(l.user_id) || null,
      }))
    );
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
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (!mobileNavVisible) return;
      const swipeDistance = touchStartY - e.touches[0].clientY;
      if (swipeDistance > 50) {
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

  const handleInterested = async (listing) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }
    if (user.id === listing.user_id) {
      alert("This is your own listing.");
      return;
    }

    const note = prompt(`Send a message to the seller of "${listing.title}"`, "Hi! I'm interested.");
    if (note === null) return; // cancelled
    const message = note.trim() || "Hi! I'm interested.";

    // Lightweight notification to the seller
    const { error: notifError } = await supabase.from("notifications").insert([
      {
        recipient_id: listing.user_id,
        message: `Interest on "${listing.title}": ${message}`,
        type: "isoko_interest",
        read: false,
      },
    ]);

    if (notifError) {
      console.error("notify error", notifError.message);
      alert("Couldn't send your interest. Please try again.");
      return;
    }

    alert("Your message was sent to the seller!");
  };

  const visibleListings = useMemo(() => {
    if (!activeCategory) return listings;
    return listings.filter(
      (l) => (l.category || "").toLowerCase() === activeCategory.toLowerCase()
    );
  }, [listings, activeCategory]);

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

      {/* MOBILE OVERLAY NAV */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            {ISOKO_LINKS.filter((i) => !i.private || authUser).map((item) => (
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

      {/* DESKTOP NAV */}
      <div className="gigs-desktop-nav">
        <div className="gigs-desktop-nav-inner">
          <div className="gigs-nav-left-logo" onClick={() => navigate("/")} title="AkaziNow Home">
            AkaziNow
          </div>

          <nav className="gigs-nav-center">
            <ul>
              {ISOKO_LINKS.filter((i) => !i.private || authUser).map((item) => (
                <li
                  key={item.key}
                  className={isActive(item) ? "active" : ""}
                  onClick={() => (item.action === "logout" ? handleLogout() : navigate(item.to))}
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
            {activeCategory
              ? `Browse ${activeCategory} listings in your area.`
              : "Browse Buy & Sell Locally listings in your area."}
          </p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {visibleListings.length} Items
          </div>
        </div>
      </div>

      {/* LISTING CARDS */}
      <section className="gigs-cards-section isoko-cards">
        {visibleListings.length > 0 ? (
          visibleListings.map((item) => (
            <div className="gigs-card isoko-card" key={item.id}>
              <div className="isoko-card-header">
                <div className="isoko-user">
                  <img
                    src={item.user?.image_url || defaultAvatar}
                    alt="poster"
                    className="isoko-avatar"
                  />
                  <span className="isoko-name">{item.user?.full_name || "Anonymous"}</span>
                </div>
                {item.price ? (
                  <span className="isoko-price-chip">
                    {item.price} {item.currency || ""}
                  </span>
                ) : null}
              </div>

              <h2 className="isoko-title">{item.title}</h2>
              {item.description && (
                <p className="isoko-desc">{item.description}</p>
              )}

              <div className="isoko-meta">
                <div><strong>Location:</strong> {item.location || "—"}</div>
                <div><strong>Category:</strong> {item.category || "—"}</div>
                <div><strong>Intent:</strong> {item.intent || "—"}</div>
              </div>

              {item.first_image_url && (
                <div className="gigs-card-image-wrapper">
                  <img src={item.first_image_url} alt="listing" />
                </div>
              )}

              <div className="isoko-actions">
                <button className="isoko-btn" onClick={() => handleInterested(item)}>
                  Interested
                </button>
              </div>
            </div>
          ))
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
