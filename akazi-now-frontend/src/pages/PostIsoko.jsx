import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import sellSticker from "../assets/sells.png"; // adjust name/ext if needed
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";
import "./PostIsoko.css";

/* ====== USE THE SAME BUCKET AS POSTGIG ====== */
const BUCKET = "job-images";

const CATEGORIES = [
  "electronics",
  "houses",
  "plots",
  "cars",
  "kitchen",
  "clothes",
  "other",
];

/** Isoko-only nav items */
const ISOKO_LINKS = [
  { to: "/",                             label: "Home",        key: "home" },
  { to: "/isoko/categories/electronics", label: "Electronics", key: "electronics" },
  { to: "/isoko/categories/houses",      label: "Houses",      key: "houses" },
  { to: "/isoko/categories/cars",        label: "Cars",        key: "cars" },
  { to: "/isoko/categories/clothes",     label: "Clothes",     key: "clothes" },
  { label: "Logout", key: "logout", action: "logout", private: true },
];

function PostIsoko() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // mobile overlay
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  const navigate = useNavigate();

  // form
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "RWF",
    intent: "sell",
    category: "electronics",
    location: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------- auth / profile ---------- */
  useEffect(() => {
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

  const fetchUserAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setAuthUser(user);
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  /* ---------- mobile overlay UX ---------- */
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

  const isActive = (item) => {
    if (item.key === "logout") return false;
    if (item.key === "home") return location.pathname === "/isoko" || location.pathname === "/";
    return false;
  };

  /* ---------- form helpers ---------- */
  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  // ✅ Mirror PostGig's upload style & bucket
  async function uploadImageIfAny() {
    if (!file) return null;

    // Optional: keep HEIC guard (can remove if you prefer)
    if (file.type === "image/heic" || /\.heic$/i.test(file.name)) {
      throw new Error("Please upload JPG or PNG. HEIC is not supported.");
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${Date.now()}.${ext}`;     // same pattern as PostGig
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

    if (uploadError) throw new Error(uploadError.message);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!authUser) return navigate("/login");

    if (!form.title.trim() || !form.description.trim()) {
      alert("Please fill Title and Description.");
      return;
    }

    setSubmitting(true);
    try {
      const firstImageUrl = await uploadImageIfAny();

      const payload = {
        user_id: authUser.id,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price || 0),
        currency: form.currency,
        intent: form.intent,
        category: form.category.trim(),
        location: form.location.trim(),
        first_image_url: firstImageUrl,
        images: firstImageUrl ? [firstImageUrl] : [],
      };

      const { error } = await supabase.from("market_listings").insert([payload]);
      if (error) throw new Error(error.message);

      // Reset and go back to Isoko
      setForm({
        title: "",
        description: "",
        price: "",
        currency: "RWF",
        intent: "sell",
        category: "electronics",
        location: "",
      });
      setFile(null);
      setPreview(null);

      navigate("/isoko");
    } catch (err) {
      alert(`Failed to post item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- UI ---------- */
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
            {ISOKO_LINKS.filter(i => !i.private || authUser).map(item => (
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
              {ISOKO_LINKS.filter(i => !i.private || authUser).map(item => (
                <li
                  key={item.key}
                  className={isActive(item) ? "active" : ""}
                  onClick={() => item.action === "logout" ? handleLogout() : navigate(item.to)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </nav>

          <div className="gigs-nav-right">
            <button
              className="gigs-auth-button gigs-auth-button--gold"
              onClick={() => navigate("/isoko")}
              title="View Listings"
            >
              View Listings
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
          <h1 className="gigs-heading">Post an Item on Isoko</h1>
          <p className="gigs-subheading">Add your listing and reach local buyers.</p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> Post yours now
          </div>
        </div>
      </div>

      {/* TWO-COLUMN SECTION */}
      <section className="postitem-section">
        {/* Left: Form */}
        <div className="postitem-form-card">
          <form className="postitem-form" onSubmit={handleSubmit} autoComplete="on">
            <h2 className="postitem-title">Create Listing</h2>

            <label>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              required
              placeholder="e.g., iPhone 12, 128GB"
            />

            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              rows={4}
              placeholder="Add details, condition, etc."
            />

            <div className="postitem-row">
              <div className="postitem-col">
                <label>Category</label>
                <select name="category" value={form.category} onChange={onChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="postitem-col">
                <label>Intent</label>
                <select name="intent" value={form.intent} onChange={onChange}>
                  <option value="sell">Sell</option>
                  <option value="buy">Buy</option>
                </select>
              </div>
            </div>

            <div className="postitem-row">
              <div className="postitem-col">
                <label>Price</label>
                <input
                  name="price"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.price}
                  onChange={onChange}
                />
              </div>

              <div className="postitem-col">
                <label>Currency</label>
                <select name="currency" value={form.currency} onChange={onChange}>
                  <option>RWF</option>
                  <option>USD</option>
                </select>
              </div>
            </div>

            <label>Location</label>
            <input
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Kigali, Gasabo"
            />

            <label>Image (JPG/PNG) — avoid HEIC</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              onChange={onFileChange}
            />
            {preview && <img className="post-preview" src={preview} alt="preview" />}

            <div className="postitem-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate("/isoko")}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Posting..." : "Post Item"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: SELL sticker from assets */}
        <div className="postitem-info-card">
          <div className="postitem-info-content">
            <h3>Post Your Item</h3>
            <p>
              Connect with local buyers. Clear details and bright photos help your item sell faster.
            </p>
            <img
              src={sellSticker}
              alt="Sell sticker"
              className="sell-sticker"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
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

export default PostIsoko;
