import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./Isoko.css";         // keep shared nav/hero styles
import "./PostIsoko.css";     // form-specific fixes (light inputs, grid, etc)

const BUCKET = "market-images"; // Supabase Storage bucket

const CATEGORIES = [
  "electronics",
  "houses",
  "plots",
  "cars",
  "kitchen",
  "clothes",
  "other",
];

function PostIsoko() {
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "RWF",
    intent: "sell", // sell | buy
    category: "electronics",
    location: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    setAuthUser(user);
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  // mobile overlay UX
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

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function onFileChange(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function uploadImageIfAny() {
    if (!file) return null;

    // Avoid HEIC (not supported by most browsers)
    if (file.type === "image/heic" || /\.heic$/i.test(file.name)) {
      throw new Error("Please upload JPG or PNG. HEIC is not supported.");
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${authUser.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase
      .storage
      .from(BUCKET)
      .upload(filename, file, { cacheControl: "3600", upsert: false });

    if (upErr) throw new Error(upErr.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
    return data?.publicUrl || null;
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
        intent: form.intent,         // 'sell' | 'buy'
        category: form.category.trim(),
        location: form.location.trim(),
        first_image_url: firstImageUrl,
        images: firstImageUrl ? [firstImageUrl] : [],
      };

      const { error } = await supabase.from("market_listings").insert([payload]);
      if (error) throw new Error(error.message);

      navigate("/isoko");
    } catch (err) {
      alert(`Failed to post item: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

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
        <h2 className="gigs-mobile-title">Post Item</h2>
        <NotificationBell />
      </div>

      {/* MOBILE OVERLAY NAV — Isoko group only */}
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

            {/* Isoko group */}
            <li className="nav-section">Isoko</li>
            <li className="nav-sublink"
                onClick={() => { setMobileNavVisible(false); navigate("/isoko"); }}>
              Browse
            </li>
            <li className="nav-sublink"
                onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>
              Post Item
            </li>

            {authUser ? (
              <li onClick={async () => { await supabase.auth.signOut(); setMobileNavVisible(false); navigate("/"); }}>
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
                <button className="gigs-auth-button" onClick={() => navigate("/isoko")}>
                  View Listings
                </button>
                <button className="gigs-auth-button" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
                  Logout
                </button>
              </>
            ) : (
              <div className="gigs-auth-buttons gigs-auth-buttons--desktop">
                <button className="gigs-auth-button" onClick={() => navigate("/login")}>Sign In</button>
                <button className="gigs-auth-button" onClick={() => navigate("/signup")}>Sign Up</button>
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
          <h1 className="gigs-heading">Post an Item on Isoko</h1>
          <p className="gigs-subheading">Add your listing and reach local buyers.</p>
        </div>
      </div>

      {/* FORM */}
      <section className="gigs-cards-section" style={{ paddingTop: "2rem" }}>
        <div className="post-card">
          <form onSubmit={handleSubmit} className="post-form" autoComplete="off">
            <h2 className="post-form-title">Create Listing</h2>

            <div className="post-grid">
              {/* Title */}
              <div className="post-field">
                <label>Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={onChange}
                  required
                  placeholder="e.g., iPhone 12, 128GB"
                />
              </div>

              {/* Description (spans 2 on desktop) */}
              <div className="post-field span-2">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={4}
                  placeholder="Add details, condition, etc."
                />
              </div>

              {/* Price */}
              <div className="post-field">
                <label>Price</label>
                <input
                  name="price"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.price}
                  onChange={onChange}
                  placeholder="0"
                />
              </div>

              {/* Currency */}
              <div className="post-field">
                <label>Currency</label>
                <select name="currency" value={form.currency} onChange={onChange}>
                  <option>RWF</option>
                  <option>USD</option>
                </select>
              </div>

              {/* Intent */}
              <div className="post-field">
                <label>Intent</label>
                <select name="intent" value={form.intent} onChange={onChange}>
                  <option value="sell">Sell</option>
                  <option value="buy">Buy (Wanted)</option>
                </select>
              </div>

              {/* Category */}
              <div className="post-field">
                <label>Category</label>
                <select name="category" value={form.category} onChange={onChange}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Location (span 2) */}
              <div className="post-field span-2">
                <label>Location</label>
                <input
                  name="location"
                  value={form.location}
                  onChange={onChange}
                  placeholder="e.g., Kigali"
                />
              </div>

              {/* Image (span 2) */}
              <div className="post-field span-2">
                <label>Image (JPG/PNG) — avoid HEIC</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  onChange={onFileChange}
                />
                {preview && (
                  <img className="post-preview" src={preview} alt="preview" />
                )}
              </div>
            </div>

            <div className="post-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/isoko")}
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Posting..." : "Post Item"}
              </button>
            </div>
          </form>
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
