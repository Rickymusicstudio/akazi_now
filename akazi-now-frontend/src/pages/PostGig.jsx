import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./PostGig.css";

function PostGig() {
  const [form, setForm] = useState({
    title: "",
    address: "",
    job_description: "",
    requirement: "",
    price: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const mobileNavRef = useRef(null);
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY.current - touchEndY > 50 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
    };

    if (mobileNavOpen) {
      window.addEventListener("touchstart", handleTouchStart);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavOpen]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("image_url, full_name, phone")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("❌ Not authenticated");
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("job-images")
        .upload(filePath, imageFile, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setMessage("❌ Failed to upload image: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("job-images")
        .getPublicUrl(filePath);

      imageUrl = data.publicUrl;
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("image_url, full_name, phone")
      .eq("auth_user_id", user.id)
      .single();

    const posterImage = userProfile?.image_url || null;
    const employerName = userProfile?.full_name || "Unknown";
    const contactInfo = userProfile?.phone || "N/A";

    const { error } = await supabase.from("jobs").insert([{
      user_id: user.id,
      ...form,
      status: "open",
      image_url: imageUrl,
      poster_image: posterImage,
      employer_name: employerName,
      contact_info: contactInfo,
    }]);

    if (error) {
      setMessage("❌ Failed to post job: " + error.message);
    } else {
      setMessage("✅ Job posted successfully!");
      setForm({
        title: "",
        address: "",
        job_description: "",
        requirement: "",
        price: "",
      });
      setImageFile(null);
    }
  };

  const toggleMobileNav = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavOpen(false), 300);
    }
  };

  const handleNavClick = async (path, logout = false) => {
    setSlideDirection("slide-up");
    setTimeout(async () => {
      if (logout) await supabase.auth.signOut();
      setMobileNavOpen(false);
      navigate(path);
    }, 300);
  };

  return (
    <div
      className="postgig-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center top",
      }}
    >
      {/* MOBILE NAV BAR */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <h2 className="mobile-title">Post a Job</h2>
        <NotificationBell />
      </div>

      {/* MOBILE NAV OVERLAY */}
      {mobileNavOpen && (
        <div ref={mobileNavRef} className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => handleNavClick("/")}>Home</li>
            <li onClick={() => handleNavClick("/post-job")}>Post a Job</li>
            <li onClick={() => handleNavClick("/my-jobs")}>My Jobs</li>
            <li onClick={() => handleNavClick("/profile")}>Profile</li>
            <li onClick={() => handleNavClick("/inbox")}>Inbox</li>
            <li onClick={() => handleNavClick("/carpools")}>Car Pooling</li>
            <li onClick={() => handleNavClick("/login", true)}>Logout</li>
          </ul>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="postgig-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
      </div>

      <div className="postgig-right">
        <form className="postgig-form" onSubmit={handleSubmit}>
          <h2 style={{ textAlign: "center", marginBottom: "1rem", fontWeight: "bold" }}>
            Post a Job
          </h2>

          {message && (
            <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>
          )}

          <label>Job Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required />

          <label>Address</label>
          <input type="text" name="address" value={form.address} onChange={handleChange} required />

          <label>Job Description</label>
          <textarea name="job_description" value={form.job_description} onChange={handleChange} required />

          <label>Requirement</label>
          <textarea name="requirement" value={form.requirement} onChange={handleChange} />

          <label>Price (Frw)</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} />

          <label>Upload Job Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />

          <button type="submit" className="btn">Post Job</button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;
