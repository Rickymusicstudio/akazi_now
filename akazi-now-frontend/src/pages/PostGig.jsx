import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerOffice from "../assets/office.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let touchStartY = 0;

    const handleScroll = () => {
      if (!mobileNavOpen) return;
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavOpen(false);
          setSlideDirection("");
        }, 300);
      }
      lastScrollY = currentScrollY;
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 50 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavOpen(false);
          setSlideDirection("");
        }, 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
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

  const handleMenuToggle = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavOpen(false);
        setSlideDirection("");
      }, 300);
    }
  };

  const closeAndNavigate = async (path, logout = false) => {
    setSlideDirection("slide-up");
    setTimeout(async () => {
      setMobileNavOpen(false);
      setSlideDirection("");
      if (logout) await supabase.auth.signOut();
      navigate(path);
    }, 300);
  };

  return (
    <div className="public-container">
      <div
        className="public-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="desktop-navbar">
          <div className="desktop-links">
            <span onClick={() => navigate("/")}>Home</span>
            <span onClick={() => navigate("/gigs")}>Gigs</span>
            <span onClick={() => navigate("/post-job")}>Post a Job</span>
            <span onClick={() => navigate("/my-jobs")}>My Jobs</span>
            <span onClick={() => navigate("/profile")}>Profile</span>
          </div>
          <div className="desktop-bell">
            <NotificationBell />
          </div>
        </div>

        <div className="mobile-top-bar">
          <div className="mobile-left-group">
            <img
              src={userProfile?.image_url || defaultAvatar}
              alt="avatar"
              className="mobile-profile-pic"
            />
            <FaBars className="mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <h2 className="mobile-title">Post a Job</h2>
          <NotificationBell />
        </div>

        {mobileNavOpen && (
          <div ref={mobileNavRef} className={`mobile-nav-overlay ${slideDirection}`}>
            <ul>
              <li onClick={() => closeAndNavigate("/")}>Home</li>
              <li onClick={() => closeAndNavigate("/post-job")}>Post a Job</li>
              <li onClick={() => closeAndNavigate("/my-jobs")}>My Jobs</li>
              <li onClick={() => closeAndNavigate("/profile")}>Profile</li>
              <li onClick={() => closeAndNavigate("/inbox")}>Inbox</li>
              <li onClick={() => closeAndNavigate("/carpools")}>Car Pooling</li>
              <li onClick={() => closeAndNavigate("/login", true)}>Logout</li>
            </ul>
          </div>
        )}
      </div>

      <div className="postgig-body">
        <div className="postgig-right-sticker">
          <img src={stickerOffice} alt="office sticker" />
        </div>

        <div className="postgig-left-form">
          <form className="postgig-form" onSubmit={handleSubmit}>
            <h2>Post a Job</h2>
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
            <button type="submit">Post Job</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PostGig;
