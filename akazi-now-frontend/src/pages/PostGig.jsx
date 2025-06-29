import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import defaultAvatar from "../assets/avatar.png";
import "./PostGig.css";

function PostGig() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    price: "",
    image: null,
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    const { data } = await supabase
      .from("users")
      .select("full_name, image_url")
      .eq("auth_user_id", user.id)
      .single();
    setProfile(data);
  };

  const toggleMobileNav = () => setMobileNavOpen(!mobileNavOpen);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle submit logic
  };

  return (
    <div className="postgig-container">
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={profile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="mobile-title">Post a Job</div>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={toggleMobileNav}>
          <ul onClick={(e) => e.stopPropagation()}>
            <li onClick={() => navigate("/")}>Home</li>
            <li onClick={() => navigate("/post-job")}>Post a Job</li>
            <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
            <li onClick={() => navigate("/profile")}>Profile</li>
            <li onClick={() => navigate("/inbox")}>Inbox</li>
            <li onClick={() => navigate("/carpool")}>Car Pooling</li>
            <li
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/login");
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* ✅ Left Panel with Profile Card */}
      <div className="gigs-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
        </div>

        <div className="profile-card">
          <img
            src={profile?.image_url || defaultAvatar}
            alt="avatar"
          />
          <h2>{profile?.full_name || "My Profile"}</h2>
          <label className="btn" onClick={() => navigate("/profile")}>Change Picture</label>
        </div>
      </div>

      {/* ✅ Right Form Panel */}
      <div className="gigs-right">
        <form className="signup-form" onSubmit={handleSubmit}>
          <label>Job Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />

          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>

          <label>Requirements</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
          ></textarea>

          <label>Price</label>
          <input
            type="text"
            name="price"
            value={formData.price}
            onChange={handleChange}
          />

          <label>Image</label>
          <input type="file" name="image" onChange={handleChange} />

          <button type="submit" className="btn">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostGig;
